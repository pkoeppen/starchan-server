import { Ban, Prisma } from '@prisma/client';
import { SafeError, logger, prisma } from '../globals';
import { StatusCodes } from 'http-status-codes';

/*
 * Gets multiple bans.
 */
export async function getBans(params: {
  boardId: string;
  ipAddress: string;
}): Promise<Ban[]> {
  // Build the query.
  const query = {
    orderBy: {
      createdAt: 'desc',
    },
  } as Prisma.BanFindManyArgs;

  if (params.boardId) {
    query.where = { boardId: params.boardId };
  }
  if (params.ipAddress) {
    query.where = { ...query.where, ipAddress: params.ipAddress };
  }

  // Fetch the bans.
  return prisma.ban.findMany(query);
}

/*
 * Adds a new ban.
 */
export async function addBan(params: {
  userId: string;
  ipAddress: string;
  duration: number;
  reason: string | null;
  postId: bigint | null;
  boardId: string | null;
  universal: boolean;
  deletePost: boolean;
  deleteOnBoard: boolean;
  deleteOnAllBoards: boolean;
}): Promise<void> {
  // Create the ban.
  const ban = await prisma.ban.create({
    data: {
      userId: params.userId,
      ipAddress: params.ipAddress,
      duration: params.duration,
      reason: params.reason,
      postId: params.postId,
      boardId: params.boardId,
      universal: params.universal,
    },
  });
  logger.debug(`Created ban ${ban.id} for IP ${ban.ipAddress}`);

  if (params.deleteOnAllBoards) {
    // Delete all posts by this IP across all boards.
    await prisma.post.deleteMany({
      where: {
        ipAddress: params.ipAddress,
      },
    });
    logger.debug(`Deleted all posts by ${params.ipAddress}`);
  } else if (params.deleteOnBoard && params.boardId) {
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
  } else if (params.deletePost && params.postId) {
    // Delete one post.
    await prisma.post.delete({
      where: {
        id: params.postId,
      },
    });
    logger.debug(`Deleted post ${params.postId}`);
  } else if (params.postId) {
    // Mark post as "banned for this post".
    await prisma.post.update({
      where: {
        id: params.postId,
      },
      data: {
        bannedForThisPost: true,
      },
    });
    logger.debug(`Marked post ${params.postId} as "banned for this post"`);
  }
}

/*
 * Deletes a ban.
 */
export async function deleteBan(params: { banId: string }): Promise<Ban> {
  // Delete the ban.
  const deletedBan = await prisma.ban.delete({
    where: {
      id: params.banId,
    },
  });

  logger.debug(`Deleted ban ${deletedBan.id}`);

  return deletedBan;
}
