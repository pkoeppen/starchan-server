import { SafeError, logger, prisma } from '../globals';
import { Post } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { render } from '../helpers';

/*
 * Adds a post reply to the given thread.
 */
export async function addPost(
  params: {
    threadId: number;
    boardId: string;
    name: string;
    ipAddress: string;
    tripcode: string;
    authorId: string;
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

  const postId = stat.value;
  if (!postId) {
    throw new Error(
      `Error incrementing post counter. prisma.stat.update() returned ${JSON.stringify(
        stat
      )}`
    );
  }

  const {
    original: bodyMd,
    rendered: bodyHtml,
    metadata,
  } = render(params.body);
  const references = metadata.references
    ? Array.from(metadata.references)
    : null;

  // Create the post (and the files).
  const post = (await prisma.post.create({
    data: {
      id: postId,
      ipAddress: params.ipAddress,
      name: params.name,
      authorId: params.authorId,
      tripcode: params.tripcode,
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
  deleteOnBoard: boolean;
  deleteOnAllBoards: boolean;
}): Promise<void> {
  // Update stat object to obtain post ID.
  const post = await prisma.post.findUnique({
    where: {
      id: params.postId,
    },
  });

  if (!post) {
    throw new SafeError('Post not found', StatusCodes.NOT_FOUND);
  }

  const { boardId, ipAddress } = post;

  if (!params.deleteOnBoard && !params.deleteOnAllBoards) {
    // Delete one post.
    console.log(
      await prisma.post.deleteMany({
        where: {
          id: params.postId,
        },
      })
    );
    logger.debug(`Deleted post ${post.id}`);
  } else if (params.deleteOnAllBoards) {
    // Delete all posts by this IP across all boards.
    console.log(
      await prisma.post.deleteMany({
        where: {
          ipAddress,
        },
      })
    );
    logger.debug(`Deleted all posts by ${ipAddress}`);
  } else if (params.deleteOnBoard) {
    // Delete all posts by this IP on the given board.
    console.log(
      await prisma.post.deleteMany({
        where: {
          ipAddress,
          boardId,
        },
      })
    );
    logger.debug(`Deleted all posts by ${ipAddress} on /${boardId}/`);
  }
}
