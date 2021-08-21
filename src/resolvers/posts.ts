import { Post, Prisma } from '@prisma/client';
import { logger, prisma } from '../globals';
import { render } from '../helpers';

/*
 * Adds a post reply to the given thread.
 */
export async function addPost(
  params: {
    userId: string | undefined;
    threadId: number;
    boardId: string;
    sage: boolean;
    name: string;
    ipAddress: string;
    tripcode: string;
    authorId: string;
    body: string | null;
  },
  files: Express.Multer.File[] | undefined,
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
  let references = null;
  if (params.body) {
    const { original, rendered, metadata } = render(params.body);
    bodyMd = original;
    bodyHtml = rendered;
    if (metadata.references) {
      references = Array.from(metadata.references);
    }
  }

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

  if (!params.sage) {
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

  return post;
}

/*
 * Deletes a post.
 */
export async function deletePost(params: {
  postId: number;
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
