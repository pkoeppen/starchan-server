import * as helpers from '../helpers';
import { PermissionLevel, Post, Prisma, Thread } from '@prisma/client';
import { logger, prisma } from '../globals';
import crypto from 'crypto';

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
  const postSelectParams = getPostSelectParams(
    includeSensitiveData,
    params.boardId
  );

  // Fetch the threads.
  const threads = await prisma.thread.findMany({
    where: { boardId: params.boardId },
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

  return threads;
}

/*
 * Gets mix of threads from all boards.
 */
export async function getAllThreadsByPage(
  params: {
    page: number;
  },
  includeSensitiveData = false
): Promise<Thread[]> {
  const skip = (params.page - 1) * 10;
  const postSelectParams = getPostSelectParams(includeSensitiveData);

  // Fetch the threads.
  const threads = await prisma.thread.findMany({
    orderBy: {
      bumpedAt: 'desc',
    },
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
      bumpedAt: 'desc',
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
  const postSelectParams = getPostSelectParams(
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
  params: { threadId: number },
  data: Prisma.ThreadUpdateInput
): Promise<Thread> {
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
  const post = (await prisma.post.create({
    data,
    select: {
      id: true,
      thread: {
        select: {
          boardId: true,
        },
      },
    },
  })) as Partial<Post>;

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

  logger.debug(`Created new thread ${post.id}`);

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
    const { count } = await prisma.thread.deleteMany({
      where: {
        archived: false,
        sticky: false,
        bumpedAt: {
          lt: lastThread.bumpedAt,
        },
      },
    });
    logger.debug(`Trimmed ${count} threads`);
  }

  return post;
}

/*
 * Builds post select parameters.
 */
function getPostSelectParams(
  includeSensitiveData = false,
  boardId?: string
): Prisma.PostSelect {
  const postSelectParams = {
    id: true,
    sage: true,
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
    user: {
      select: {
        username: true,
      },
    },
  };

  if (includeSensitiveData) {
    (postSelectParams as Prisma.PostSelect).ipAddress = true;
  }

  if (boardId) {
    // If this post was created by a mod of this board, select the roles.
    // This will be used to display the moderator tag on the front end.
    (postSelectParams.user.select as Prisma.UserSelect).roles = {
      where: {
        OR: [{ boardId }, { level: PermissionLevel.OWNER }],
      },
      select: {
        level: true,
        boardId: true,
      },
    };
  }

  return postSelectParams;
}
