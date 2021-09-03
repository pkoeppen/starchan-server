import * as helpers from '../helpers';
import { Board, Prisma } from '@prisma/client';
import { prisma, redis } from '../globals';

/*
 * Gets multiple boards.
 */
export async function getBoards(): Promise<Board[]> {
  const boards = await prisma.board.findMany({
    orderBy: {
      id: 'asc',
    },
    include: {
      _count: {
        select: {
          posts: true,
          threads: true,
        },
      },
    },
  });
  return boards;
}

/*
 * Updates a board by ID.
 */
export async function updateBoard(params: {
  boardId: string;
  newBoardId: string;
  title: string;
}): Promise<Board> {
  // Build update params.
  const updates = {} as Prisma.BoardUpdateInput;
  if (params.newBoardId) {
    updates.id = params.newBoardId;
  }
  if (params.title) {
    updates.title = params.title;
  }

  // Update the board.
  const updatedBoard = await prisma.$transaction(async (prisma) => {
    if (updates.id) {
      const multi = redis.multi();
      // Fetch all Redis post hashes that need to be updated.
      const [resultCount, ...results] = await redis.send_command(
        'FT.SEARCH',
        'idx:post',
        `@boardId:{${params.boardId}}`,
        'RETURN',
        1,
        'id',
        'LIMIT',
        0,
        999999
      );

      // Parse results.
      const posts = helpers.parsePostSearchResults(results);

      for (const post of posts) {
        const key = `post:${post.id}`;
        multi.hset(key, 'boardId', updates.id as string);
      }

      // Execute the multi.
      await multi.exec();
    }

    const board = await prisma.board.update({
      where: {
        id: params.boardId,
      },
      data: updates,
    });

    return board;
  });

  return updatedBoard;
}
