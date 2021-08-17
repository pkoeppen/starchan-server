import { Prisma, User } from '@prisma/client';
import { prisma } from '../globals';

/*
 * Gets multiple users.
 */
export async function getUsers(): Promise<Partial<User>[]> {
  const users = await prisma.user.findMany({
    orderBy: {
      username: 'asc',
    },
    select: {
      id: true,
      createdAt: true,
      username: true,
      roles: true,
    },
  });
  return users;
}

/*
 * Updates a user by ID.
 */
export async function updateUser(params: {
  userId: string;
  username: string;
}): Promise<void> {
  // Build update params.
  const updates = {} as Prisma.UserUpdateInput;
  if (params.username) {
    updates.username = params.username;
  }

  // Update the user.
  await prisma.user.update({
    where: {
      id: params.userId,
    },
    data: updates,
  });
}
