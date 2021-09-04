import * as helpers from '../helpers';
import { File, Post, Prisma, Thread } from '@prisma/client';
import { logger, prisma, redis } from '../globals';
import crypto from 'crypto';
import { omit } from 'lodash';

/*
 * Gets multiple threads.
 */
export async function getThreadsByPage(
  page: number,
  where: Prisma.ThreadWhereInput,
  includeSensitiveData = false
): Promise<Thread[]> {
  const skip = (page - 1) * 10;
  const postSelectParams = helpers.getPostSelectParams(
    includeSensitiveData,
    where.boardId as string
  );

  postSelectParams.files = false;

  // Fetch the threads.
  const threads = await prisma.thread.findMany({
    where,
    orderBy: [
      {
        sticky: 'desc',
      },
      {
        bumpedAt: 'desc',
      },
    ],
    skip,
    take: 10,
    include: {
      rootPost: {
        select: postSelectParams,
      },
      _count: {
        select: { posts: true },
      },
    },
  });

  await assembleFiles(threads);

  return threads;
}

/*
 * Lists sticky threads.
 */
export async function listStickyThreads(
  boardId: string | null,
  take = 10
): Promise<Thread[]> {
  const where: Prisma.ThreadWhereInput = {
    archived: false,
    sticky: true,
  };
  if (boardId) {
    where.boardId = boardId;
  }
  const threads = await prisma.thread.findMany({
    where,
    orderBy: {
      id: 'desc',
    },
    take,
  });
  return threads;
}

/*
 * Lists the latest 20 threads.
 */
export async function listLatestThreads(
  boardId: string | null,
  take = 20
): Promise<Thread[]> {
  const where: Prisma.ThreadWhereInput = {
    archived: false,
    sticky: false,
  };
  if (boardId) {
    where.boardId = boardId;
  }
  const threads = await prisma.thread.findMany({
    where,
    orderBy: {
      bumpedAt: 'desc',
    },
    take,
  });
  return threads;
}

/*
 * Gets one thread and its posts.
 */
export async function getThread(
  params: {
    boardId: string;
    threadId: bigint;
  },
  includeSensitiveData = false
): Promise<Thread | null> {
  const postSelectParams = helpers.getPostSelectParams(
    includeSensitiveData,
    params.boardId
  );

  // Fetch the thread.
  const thread = await prisma.thread.findUnique({
    where: { id: params.threadId },
    include: {
      rootPost: {
        select: postSelectParams,
      },
      posts: {
        orderBy: {
          id: 'asc',
        },
        select: postSelectParams,
      },
      _count: {
        select: { posts: true },
      },
    },
  });

  return thread;
}

/*
 * Updates a thread.
 */
export async function updateThread(
  params: { boardId: string; threadId: bigint },
  data: Prisma.ThreadUpdateInput
): Promise<Thread> {
  if (data.archived) {
    // If thread is set to archive, set all other flags to false.
    data = {
      archived: true,
      sticky: false,
      cycle: false,
      locked: false,
      anchored: false,
      willArchive: false,
    };
  }
  const thread = await prisma.thread.update({
    where: { id: params.threadId },
    data,
  });

  logger.debug(`Updated thread ${params.threadId}`);

  return thread;
}

/*
 * Adds a new thread.
 */
export async function addThread(
  params: {
    userId: string | undefined;
    boardId: string;
    title: string;
    name: string;
    ipAddress: string;
    tripcode: string;
    body: string;
  },
  files: any[],
  includeSensitiveData = false
): Promise<Partial<Post>> {
  let archivedCount;
  let trimmedCount;
  const post = await prisma.$transaction(async (prisma) => {
    // Update stat object to obtain post ID.
    const stat = await prisma.stat.update({
      where: {
        key: 'PostCount',
      },
      data: {
        value: {
          increment: 1,
        },
      },
    });

    const rootPostId = stat.value;
    if (!rootPostId) {
      throw new Error(
        `Error incrementing post counter. prisma.stat.update() returned ${JSON.stringify(
          stat
        )}`
      );
    }

    // Generate author ID.
    const authorId = crypto
      .createHash('sha256')
      .update(params.ipAddress + rootPostId)
      .digest('hex');

    // Render the post body Markdown.
    const {
      original: bodyMd,
      rendered: bodyHtml,
      metadata,
    } = helpers.render(params.body);

    // Extract references from Markdown metadata.
    const references = metadata.references
      ? Array.from(metadata.references)
      : null;

    // Prepare the root post data.
    const data: Prisma.PostCreateInput = {
      id: rootPostId,
      ipAddress: params.ipAddress,
      name: params.name,
      authorId,
      tripcode: params.tripcode,
      bodyMd,
      bodyHtml,
      bannedForThisPost: false,
      board: {
        connect: {
          id: params.boardId,
        },
      },
      files: {
        connectOrCreate: files.map((file) => {
          return {
            where: {
              id: file.id,
            },
            create: {
              id: file.id,
              size: file.size,
              filename: file.filename,
              mimetype: file.mimetype,
              nsfw: file.nsfw,
            },
          };
        }),
      },
    };

    if (params.userId) {
      data.user = {
        connect: {
          id: params.userId,
        },
      };
    }

    // Create the root post.
    const post = (await prisma.post.create({ data })) as Partial<Post>;

    // Create the thread.
    await prisma.thread.create({
      data: {
        id: rootPostId,
        title: params.title,
        bumpedAt: new Date(),
        rootPost: {
          connect: {
            id: rootPostId,
          },
        },
        board: {
          connect: {
            id: params.boardId,
          },
        },
      },
    });

    if (!includeSensitiveData) {
      // Delete ipAddress field.
      delete post.ipAddress;
    }

    // If there are references, connect them.
    if (references) {
      for (const id of references) {
        try {
          await prisma.post.update({
            where: {
              id: post.id,
            },
            data: {
              references: {
                connect: [{ id: id as number }],
              },
            },
          });
        } catch (error) {
          // Likely thrown because the referenced ID does not exist.
        }
      }
    }

    // If thread count has exceeded 100, trim threads.
    // This retrieves the last thread, after which all threads should be trimmed.
    const threads = await prisma.thread.findMany({
      where: {
        boardId: params.boardId,
        archived: false,
      },
      select: {
        bumpedAt: true,
      },
      orderBy: [
        {
          sticky: 'desc',
        },
        {
          bumpedAt: 'desc',
        },
      ],
      skip: 99,
      take: 1,
    });

    if (threads.length) {
      const lastThread = threads[0];

      // Update all threads set as "willArchive".
      const { count: _archivedCount } = await prisma.thread.updateMany({
        where: {
          willArchive: true,
          archived: false,
          sticky: false,
          bumpedAt: {
            lt: lastThread.bumpedAt,
          },
        },
        data: {
          archived: true,
          sticky: false,
          cycle: false,
          locked: false,
          anchored: false,
          willArchive: false,
        },
      });
      archivedCount = _archivedCount;

      // Delete all other threads.
      const { count: _trimmedCount } = await prisma.thread.deleteMany({
        where: {
          archived: false,
          sticky: false,
          bumpedAt: {
            lt: lastThread.bumpedAt,
          },
        },
      });
      trimmedCount = _trimmedCount;
    }

    // Set Redis key for searching.
    const bodyText = bodyHtml.replace(/<[^>]*>/g, '');
    await redis.hmset(
      `post:${post.id}`,
      omit(
        {
          ...post,
          threadId: post.id,
          createdAt: post?.createdAt?.getTime(),
          updatedAt: post?.updatedAt?.getTime(),
          bodyText,
        } as any,
        ['files', 'referencedBy', 'ipAddress', 'userId', 'thread']
      )
    );

    return post;
  });

  logger.debug(`Created new thread ${post.id}`);
  if (archivedCount) {
    logger.debug(`Archived ${archivedCount} threads`);
  }
  if (trimmedCount) {
    logger.debug(`Trimmed ${trimmedCount} threads`);
  }

  return post;
}

/*
 * This retarded monstrosity is here because Prisma's findMany function doesn't properly
 * populate nested relations. To be more specific, if a nested relation shares a many-to-many
 * child relation with another sibling relation, that child relation gets "used up" and only
 * appears on some of the parent relations. It's weird.
 */
async function assembleFiles(
  threads: (Thread & {
    rootPost: Record<string, unknown>;
    _count: { posts: number } | null;
  })[]
) {
  const rootPostIds = threads.map((thread) => parseInt(thread.id as any));

  if (!rootPostIds.length) {
    return;
  }

  const args = Array.from(rootPostIds)
    .map((_, i) => `$${i + 1}`)
    .join(',');
  const results = await prisma.$queryRaw(
    'SELECT "public"."_FileToPost"."B", "public"."_FileToPost"."A" ' +
      `FROM "public"."_FileToPost" WHERE "public"."_FileToPost"."B" IN (${args})`,
    ...rootPostIds
  );

  const fileIds = Array.from(
    new Set(results.map(({ A: fileId }: { A: string; B: string }) => fileId))
  ) as string[];

  const files = await prisma.file.findMany({
    where: {
      id: {
        in: fileIds,
      },
    },
  });

  for (const { A: fileId, B: postId } of results) {
    const rootPost = threads.find((thread) => {
      return thread.id === BigInt(postId);
    })?.rootPost;
    if (!rootPost) {
      throw new Error('Root post not found');
    }
    const file = files.find((file) => file.id === fileId);
    if (!rootPost.files) {
      rootPost.files = [];
    }
    (rootPost as { files: File[] }).files.push(file as File);
  }
}
