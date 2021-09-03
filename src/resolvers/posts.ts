import * as helpers from '../helpers';
import { Post, Prisma, Thread } from '@prisma/client';
import { logger, prisma, redis } from '../globals';
import { omit } from 'lodash';
import { render } from '../helpers';

/*
 * Gets multiple threads.
 */
export async function getPostsByPage(
  page: number,
  where: Prisma.PostWhereInput,
  includeSensitiveData = false
): Promise<Post[]> {
  const skip = (page - 1) * 10;
  const postSelectParams = helpers.getPostSelectParams(
    includeSensitiveData,
    where.boardId as string
  );

  // Fetch the posts.
  const posts = await prisma.post.findMany({
    where,
    orderBy: [
      {
        createdAt: 'desc',
      },
    ],
    skip,
    take: 10,
    select: postSelectParams,
  });

  return posts as (Post & { thread: Thread | null })[];
}

/*
 * Adds a post reply to the given thread.
 */
export async function addPost(
  params: {
    userId: string | undefined;
    threadId: bigint;
    boardId: string;
    sage: boolean;
    name: string;
    ipAddress: string;
    tripcode: string;
    authorId: string;
    body: string | null;
  },
  files: Express.Multer.File[] | undefined,
  thread: Thread,
  includeSensitiveData = false
): Promise<Partial<Post>> {
  return prisma.$transaction(async (prisma) => {
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

    const postId = stat.value;
    if (!postId) {
      throw new Error(
        `Error incrementing post counter. prisma.stat.update() returned ${JSON.stringify(
          stat
        )}`
      );
    }

    let bodyMd = null;
    let bodyHtml = null;
    let bodyText = null;
    let references = null;
    if (params.body) {
      const { original, rendered, metadata } = render(params.body);
      bodyMd = original;
      bodyHtml = rendered;
      bodyText = bodyHtml.replace(/<[^>]*>/g, '');
      if (metadata.references) {
        references = Array.from(metadata.references);
      }
    }

    // Build post creation data.
    const data: Prisma.PostCreateInput = {
      id: postId,
      ipAddress: params.ipAddress,
      name: params.name,
      authorId: params.authorId,
      tripcode: params.tripcode,
      sage: params.sage,
      bodyMd,
      bodyHtml,
      bannedForThisPost: false,
      rootPost: {
        connect: {
          id: params.threadId,
        },
      },
      thread: {
        connect: {
          id: params.threadId,
        },
      },
      board: {
        connect: {
          id: params.boardId,
        },
      },
    };

    if (files?.length) {
      data.files = {
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
      };
    }

    if (params.userId) {
      data.user = {
        connect: {
          id: params.userId,
        },
      };
    }

    // Create the post (and the files).
    const post = (await prisma.post.create({
      data,
      include: {
        files: true,
        referencedBy: {
          select: {
            id: true,
          },
        },
      },
    })) as Partial<Post>;

    if (!includeSensitiveData) {
      // Delete ipAddress field.
      delete post.ipAddress;
    }

    if (!params.sage && !thread.anchored) {
      // Bump the thread.
      await prisma.thread.update({
        where: {
          id: params.threadId,
        },
        data: {
          bumpedAt: new Date(),
        },
      });
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

    // Set Redis key for searching.
    await redis.hmset(
      `post:${post.id}`,
      omit(
        {
          ...post,
          createdAt: post?.createdAt?.getTime(),
          updatedAt: post?.updatedAt?.getTime(),
          bodyText,
        } as any,
        ['files', 'referencedBy', 'ipAddress', 'userId']
      )
    );

    return post;
  });
}

/*
 * Deletes a post.
 */
export async function deletePost(params: {
  postId: bigint;
  boardId: string;
  ipAddress: string;
  deleteOnBoard: boolean;
  deleteOnAllBoards: boolean;
}): Promise<void> {
  if (params.deleteOnAllBoards) {
    // Delete all posts by this IP across all boards.
    await prisma.post.deleteMany({
      where: {
        ipAddress: params.ipAddress,
      },
    });
    logger.debug(`Deleted all posts by ${params.ipAddress}`);
  } else if (params.deleteOnBoard) {
    // Delete all posts by this IP on the given board.
    await prisma.post.deleteMany({
      where: {
        ipAddress: params.ipAddress,
        boardId: params.boardId,
      },
    });
    logger.debug(
      `Deleted all posts by ${params.ipAddress} on /${params.boardId}/`
    );
  } else {
    // Delete one post.
    await prisma.post.delete({
      where: {
        id: params.postId,
      },
    });
    logger.debug(`Deleted post ${params.postId}`);
  }
}
