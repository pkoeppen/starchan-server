import { Board } from '@prisma/client';
import { prisma } from '../globals';

/*
 * Gets multiple creators.
 */
export async function getBoards(): Promise<
  Omit<Board, 'createdAt' | 'updatedAt'>[]
> {
  const boards = await prisma.board.findMany({
    select: {
      id: true,
      title: true,
    },
  });
  return boards;
}
