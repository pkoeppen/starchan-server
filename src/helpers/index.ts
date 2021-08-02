import { SafeError, prisma, redis } from '../globals';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import fs from 'fs';

const SIMPLE_ENCRYPTION_KEY = crypto
  .createHash('sha256')
  // .update(config.SIMPLE_ENCRYPTION_KEY)
  .update('simplekey') // todo
  .digest('hex')
  .slice(0, 16);

/*
 * Export body-formatting function.
 */
export { default as render } from './render';

/*
 * Get all filenames in a directory, excluding index.js.
 */
export const readdir = function readdir(dirname: string): string[] {
  return fs
    .readdirSync(dirname)
    .map((filename) =>
      /^index\.(js|ts)$/.test(filename)
        ? ''
        : filename.replace(/\.(js|ts)$/g, '')
    )
    .filter((filename) => filename);
};

/*
 * Encrypts a string with a simple encryption key.
 */
export const encrypt = function (str: string): string {
  const cipher = crypto.createCipheriv(
    'aes-128-cbc',
    SIMPLE_ENCRYPTION_KEY,
    SIMPLE_ENCRYPTION_KEY
  );
  const encrypted = cipher.update(str, 'utf8', 'hex');
  return encrypted + cipher.final('hex');
};

/*
 * Decrypts a string with a simple encryption key.
 */
export const decrypt = function (str: string): string {
  const decipher = crypto.createDecipheriv(
    'aes-128-cbc',
    SIMPLE_ENCRYPTION_KEY,
    SIMPLE_ENCRYPTION_KEY
  );
  const decrypted = decipher.update(str, 'hex', 'utf8');
  return decrypted + decipher.final('utf8');
};

/*
 * Blacklists the given JWT and sets an expiry on the key.
 */
export const blacklistJwt = async function (
  jwt: string,
  expiry: number
): Promise<void> {
  const jwtKey = `jwt:${jwt}`;
  const multi = redis.multi();
  multi.set(jwtKey, 1);
  multi.expireat(jwtKey, expiry);
  await multi.exec();
};

/*
 * Ensures that the given threadId is valid and returns the parsed value.
 */
export function validateThreadId(threadId: string | number): number {
  if (!threadId) {
    throw new SafeError('Missing thread ID', StatusCodes.BAD_REQUEST);
  }
  threadId = parseInt(threadId as string);
  if (isNaN(threadId)) {
    throw new SafeError('Invalid thread ID', StatusCodes.BAD_REQUEST);
  }
  return threadId;
}

/*
 * Ensures that the given boardId value is valid.
 */
export function validateBoardId(boardId: string): string {
  if (!boardId) {
    throw new SafeError('Missing board ID', StatusCodes.BAD_REQUEST);
  }
  if (typeof boardId !== 'string') {
    throw new SafeError('Invalid board ID', StatusCodes.BAD_REQUEST);
  }
  return boardId;
}

/*
 * Ensures that the given board exists.
 */
export async function assertBoardExists(boardId: string): Promise<void> {
  const board = await prisma.board.findUnique({
    where: {
      id: boardId,
    },
  });
  if (!board) {
    throw new SafeError('Board does not exist', StatusCodes.NOT_FOUND);
  }
}

/*
 * Ensures that the given postId value is valid.
 */
export function validatePostId(postId: string | number): number {
  if (!postId) {
    throw new SafeError('Missing post ID', StatusCodes.BAD_REQUEST);
  }
  postId = parseInt(postId as string);
  if (isNaN(postId)) {
    throw new SafeError('Invalid post ID', StatusCodes.BAD_REQUEST);
  }
  return postId;
}
