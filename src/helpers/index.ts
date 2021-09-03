import * as globals from '../globals';
import {
  LogEntry,
  PermissionLevel,
  Post,
  Prisma,
  ReportReason,
} from '@prisma/client';
import { SafeError, logger, prisma, redis, s3, s3Bucket } from '../globals';
import { StatusCodes } from 'http-status-codes';
import { chunk } from 'lodash';
import crypto from 'crypto';
import fs from 'fs';
import isIp from 'is-ip';

const SIMPLE_ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(globals.SIMPLE_ENCRYPTION_KEY as string)
  .digest('hex')
  .slice(0, 16);

/*
 * Export body-formatting function.
 */
export { default as render } from './render';

/*
 * Adds a new log entry to the database.
 */
export function log(
  message: string,
  userId: string | undefined,
  metadata: any
): Promise<LogEntry> {
  if (!userId) {
    throw new Error('Failed to create log entry. Missing user ID');
  }
  return prisma.logEntry.create({
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
      message,
      metadata,
    },
  });
}

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
  expiry: number // Milliseconds since epoch.
): Promise<void> {
  const jwtKey = `blacklist:jwt:${jwt}`;
  const multi = redis.multi();
  multi.set(jwtKey, 1);
  multi.expireat(jwtKey, Math.ceil(expiry / 1000)); // EXPIREAT takes seconds.
  await multi.exec();
};

/*
 * Ensures that the given ID is a number and returns the parsed value.
 */
export function validateIntId(id: string | number, type: string): bigint {
  if (!id) {
    throw new SafeError(`Missing ${type} ID`, StatusCodes.BAD_REQUEST);
  }
  id = parseInt(id as string);
  if (isNaN(id)) {
    throw new SafeError(`Invalid ${type} ID`, StatusCodes.BAD_REQUEST);
  }
  return BigInt(id);
}

/*
 * Ensures that the given ID is a string and returns the parsed value.
 */
export function validateStringId(id: string, type: string): string {
  if (!id) {
    throw new SafeError(`Missing ${type} ID`, StatusCodes.BAD_REQUEST);
  }
  if (typeof id !== 'string') {
    throw new SafeError(`Invalid ${type} ID`, StatusCodes.BAD_REQUEST);
  }
  return id;
}

/*
 * Ensures that the given postId is valid and returns the parsed value.
 */
export function validatePostId(postId: string | number): bigint {
  return validateIntId(postId, 'post');
}

/*
 * Ensures that the given threadId is valid and returns the parsed value.
 */
export function validateThreadId(threadId: string | number): bigint {
  return validateIntId(threadId, 'thread');
}

/*
 * Ensures that the given boardId value is valid.
 */
export function validateBoardId(boardId: string): string {
  return validateStringId(boardId, 'board');
}

/*
 * Ensures that the given authorId value is valid.
 */
export function validateAuthorId(authorId: string): string {
  return validateStringId(authorId, 'author');
}

/*
 * Ensures that the given reportId is valid and returns the parsed value.
 */
export function validateReportId(reportId: string): string {
  return validateStringId(reportId, 'report');
}

/*
 * Ensures that the given banId is valid and returns the parsed value.
 */
export function validateBanId(banId: string): string {
  return validateStringId(banId, 'ban');
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
 * Ensures that the given report reason is valid.
 */
export function validateReportReason(reason: string): ReportReason {
  switch (reason) {
    case 'spam':
      return ReportReason.SPAM;
    case 'offTopic':
      return ReportReason.OFFTOPIC;
    case 'illegalContent':
      return ReportReason.ILLEGAL;
    default:
      throw new SafeError('Invalid report reason', StatusCodes.BAD_REQUEST);
  }
}

/*
 * Ensures that the given IP address is valid.
 */
export function validateIpAddress(ipAddress: string): string {
  if (!isIp(ipAddress)) {
    throw new SafeError('Invalid IP address', StatusCodes.BAD_REQUEST);
  }
  return ipAddress;
}

/*
 * Ensures that the user has sufficient permissions.
 */
export async function checkPermissions(
  userId: string | undefined,
  params: Record<string, any> | null,
  boardId: string | null,
  conditions: Record<string, PermissionLevel> & { default: PermissionLevel }
): Promise<void> {
  // Fetch this user's roles.
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      roles: {
        select: {
          level: true,
          boardId: true,
        },
      },
    },
  });

  let roles = user?.roles;
  if (!roles) {
    throw new SafeError('Insufficient permissions', StatusCodes.FORBIDDEN);
  }
  if (roles.some((role) => role.level === PermissionLevel.OWNER)) {
    return; // Site owner can do anything.
  }

  // Determine the highest permission level required for this action.
  let highestRequiredLevel: PermissionLevel = conditions.default;
  const enumerated = {
    [PermissionLevel.OWNER]: 4,
    [PermissionLevel.ADMIN]: 3,
    [PermissionLevel.MODERATOR]: 2,
    [PermissionLevel.JANITOR]: 1,
  };

  if (params) {
    for (const key in params) {
      if (!conditions.hasOwnProperty(key) || !params[key]) {
        // If there is no condition for this parameter, or if the
        // parameter is false, skip it.
        continue;
      }
      const level = conditions[key];
      const n = enumerated[level];
      if (n > enumerated[highestRequiredLevel]) {
        highestRequiredLevel = level;
      }
    }
  }

  // If a board ID was given, filter for roles on that board.
  if (boardId) {
    roles = roles.filter((role) => role.boardId === boardId);
  }

  // Determine if the user has permission.
  const hasPermission = roles.some(
    (role) => enumerated[role.level] >= enumerated[highestRequiredLevel]
  );

  if (!hasPermission) {
    throw new SafeError('Insufficient permissions', StatusCodes.FORBIDDEN);
  }
}

/*
 * Ensures that the given post name is valid.
 */
export function validatePostName(name: string): string {
  if (typeof name !== 'string') {
    throw new SafeError('Invalid name field', StatusCodes.BAD_REQUEST);
  }
  if (name.length > 30) {
    throw new SafeError(
      'Name must be less than 30 characters long',
      StatusCodes.BAD_REQUEST
    );
  }
  // Remove extra whitespace.
  name = name.replace(/\s+/g, ' ').trim();
  if (!name) {
    throw new SafeError('Invalid name field', StatusCodes.BAD_REQUEST);
  }
  return name;
}

/*
 * Ensures that the given post password is valid.
 */
export function validatePostPassword(password: string): string {
  if (typeof password !== 'string') {
    throw new SafeError('Invalid password field', StatusCodes.BAD_REQUEST);
  }
  if (password.length > 128) {
    throw new SafeError(
      'Password must be less than 128 characters long',
      StatusCodes.BAD_REQUEST
    );
  }
  return password;
}

/*
 * Ensures that the given post body is valid.
 */
export function validatePostBody(body: string): string {
  if (typeof body !== 'string') {
    throw new SafeError('Invalid body field', StatusCodes.BAD_REQUEST);
  }
  if (body.length > 600) {
    throw new SafeError(
      'Post body must be less than 600 characters long',
      StatusCodes.BAD_REQUEST
    );
  }
  const { length: totalLineCount } = body.split(/\r?\n/);
  if (totalLineCount > 40) {
    throw new SafeError(
      'Post body must have less than 40 line breaks',
      StatusCodes.BAD_REQUEST
    );
  }
  return body;
}

/*
 * Ensures that the given thread title is valid.
 */
export function validateThreadTitle(title: string): string {
  if (!title) {
    throw new SafeError('Thread must have a title', StatusCodes.BAD_REQUEST);
  }
  if (typeof title !== 'string') {
    throw new SafeError('Invalid thread title', StatusCodes.BAD_REQUEST);
  }
  if (title.length > 30) {
    throw new SafeError(
      'Thread title must be less than 30 characters long',
      StatusCodes.BAD_REQUEST
    );
  }
  // Remove extra whitespace.
  title = title.replace(/\s+/g, ' ').trim();
  if (!title) {
    throw new SafeError('Invalid thread title', StatusCodes.BAD_REQUEST);
  }
  return title;
}

/*
 * Ensures that the given username is valid.
 */
export function validateUsername(username: string): string {
  if (typeof username !== 'string') {
    throw new SafeError('Invalid username', StatusCodes.BAD_REQUEST);
  }
  if (username.length > 16) {
    throw new SafeError(
      'Username must be less than 16 characters long',
      StatusCodes.BAD_REQUEST
    );
  }
  return username;
}

/*
 * Removes all given files from the database and S3.
 */
export async function removeFiles(files: Express.Multer.File[]): Promise<void> {
  // Only remove files that don't already exist in the database.
  const idArray = files.filter((file) => !file.exists).map((file) => file.id);
  // Delete files from database.
  await prisma.file.deleteMany({
    where: {
      id: {
        in: idArray,
      },
    },
  });
  logger.debug(
    `Removed ${idArray.length} ${
      idArray.length > 1 ? 'files' : 'file'
    } from the database`
  );
  // Delete files from S3.
  for (const id of idArray) {
    await s3.deleteObject({ Bucket: s3Bucket, Key: `files/${id}` }).promise();
    await s3.deleteObject({ Bucket: s3Bucket, Key: `thumbs/${id}` }).promise();
    logger.debug(`Removed file ${id} from S3`);
  }
}

/*
 * Builds post select parameters.
 */
export function getPostSelectParams(
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
    threadId: true,
    boardId: true,
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
        // TODO: Would be great if there were a way to do $boardId, where $boardId references
        // the boardId of the parent object (post).
        // Alternatively, remove this "where" and filter after retrieval.
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

/*
 * Transforms raw Redis search results into post objects.
 */
export function parsePostSearchResults(
  results: (string | string[])[]
): Partial<Post>[] {
  const posts: Partial<Post>[] = [];
  const chunks: (string | string[])[][] = chunk(results, 2);
  for (const [key, dataPairs] of chunks) {
    const post: Record<string, unknown> = {};
    for (let i = 0; i < dataPairs.length; i += 2) {
      const prop = dataPairs[i];
      let value: unknown = dataPairs[i + 1];
      if (['sage', 'bannedForThisPost'].includes(prop)) {
        value = value === 'true';
      }
      if (['createdAt', 'updatedAt'].includes(prop)) {
        value = parseInt(value as string);
      }
      post[prop] = value;
    }
    posts.push(post);
  }
  return posts;
}
