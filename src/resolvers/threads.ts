import * as helpers from '../helpers';
import { Post, Prisma, Thread } from '@prisma/client';
import { logger, prisma } from '../globals';
import crypto from 'crypto';

const postSelectParams = {
  id: true,
  name: true,
  authorId: true,
  tripcode: true,
  createdAt: true,
  bodyHtml: true,
  bannedForThisPost: true,
  files: true,
  referencedBy: {
    select: {
      id: true,
    },
  },
};

/*
 * Gets multiple threads.
 */
export async function getThreadsByPage(
  params: {
    boardId: string;
    page: number;
  },
  includeSensitiveData = false
): Promise<Thread[]> {
  const skip = (params.page - 1) * 10;
  const threads = await prisma.thread.findMany({
    where: { boardId: params.boardId },
    orderBy: [
      {
        sticky: 'desc',
      },
      {
        id: 'desc',
      },
    ],
    skip,
    take: 10,
    include: {
      rootPost: {
        select: includeSensitiveData
          ? { ipAddress: true, ...postSelectParams }
          : postSelectParams,
      },
      _count: {
        select: { posts: true },
      },
    },
  });

  for (const thread of threads) {
    (thread as any).lastPost = await prisma.post.findFirst({
      where: {
        threadId: thread.id,
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        updatedAt: true,
      },
    });
  }

  return threads;
}

/*
 * Gets all sticky threads.
 */
export async function getStickyThreads(params: {
  boardId: string;
}): Promise<Thread[]> {
  const threads = await prisma.thread.findMany({
    where: {
      boardId: params.boardId,
      sticky: true,
    },
    orderBy: {
      id: 'desc',
    },
  });
  return threads;
}

/*
 * Gets latest 10 threads.
 */
export async function getLatestThreads(params: {
  boardId: string;
}): Promise<Thread[]> {
  const threads = await prisma.thread.findMany({
    where: {
      boardId: params.boardId,
    },
    orderBy: {
      id: 'desc',
    },
    take: 10,
  });
  return threads;
}

/*
 * Gets one thread.
 */
export async function getThread(
  params: {
    boardId: string;
    threadId: number;
  },
  includeSensitiveData = false
): Promise<Thread | null> {
  const thread = await prisma.thread.findFirst({
    where: { id: params.threadId, boardId: params.boardId },
    include: {
      rootPost: {
        select: includeSensitiveData
          ? { ipAddress: true, ...postSelectParams }
          : postSelectParams,
      },
      posts: {
        orderBy: {
          id: 'asc',
        },
        select: includeSensitiveData
          ? { ipAddress: true, ...postSelectParams }
          : postSelectParams,
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
  params: { threadId: number },
  data: Prisma.ThreadUpdateInput
): Promise<Thread> {
  const thread = await prisma.thread.update({
    where: { id: params.threadId },
    data,
  });

  return thread;
}

/*
 * Adds a new thread.
 */
export async function addThread(
  params: {
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
  // Update stat object to obtain post ID.
  const stat = await prisma.stat.update({
    where: {
      id: 'PostCount',
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

  // Create the root post (and the files).
  const post = (await prisma.post.create({
    data: {
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
    },
    select: {
      id: true,
      thread: {
        select: {
          boardId: true,
        },
      },
    },
  })) as Partial<Post>;

  // Create thread.
  await prisma.thread.create({
    data: {
      id: rootPostId,
      title: params.title,
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

  // If thread count has exceed 100, trim last thread.
  const threads = await prisma.thread.findMany({
    where: {
      boardId: params.boardId,
      archived: false,
    },
    select: {
      id: true,
    },
    orderBy: [
      {
        sticky: 'desc',
      },
      {
        id: 'desc',
      },
    ],
    take: 100,
  });

  // Trim all threads over thread limit.
  const { count } = await prisma.thread.deleteMany({
    where: {
      boardId: params.boardId,
      NOT: {
        id: {
          in: threads.map((thread) => thread.id),
        },
      },
    },
  });

  logger.debug(`Posted new thread; trimmed ${count} others.`);

  return post;
}
