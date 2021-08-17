import { Board, Prisma } from '@prisma/client';
import { prisma } from '../globals';

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
  const updatedBoard = await prisma.board.update({
    where: {
      id: params.boardId,
    },
    data: updates,
  });

  return updatedBoard;
}
