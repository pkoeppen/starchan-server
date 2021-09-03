import * as helpers from '../helpers';
import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { PermissionLevel, Prisma } from '@prisma/client';
import { SafeError, logger, prisma } from '../globals';
import { attach, auth, recaptcha } from '../middleware/auth';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import trip from 'tripcode';
import uploadMiddleware from '../middleware/upload';

const router = Router();

/*
 * Resolves the URI of the given post ID.
 */
router.get('/resolve/:postId', resolvePostUri);
async function resolvePostUri(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = helpers.validatePostId(req.params.postId);
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        id: true,
        boardId: true,
        threadId: true,
      },
    });

    if (!post) {
      throw new SafeError('Post not found', StatusCodes.NOT_FOUND);
    }

    // If post.threadId is null, that means this post is a thread root.
    res
      .status(200)
      .send(`/${post.boardId}/thread/${post.threadId || post.id}/#${post.id}`);
  } catch (error) {
    next(error);
  }
}

/*
 * Gets multiple posts.
 */
router.get('/:boardId', attach, getPostsByPage);
async function getPostsByPage(req: Request, res: Response, next: NextFunction) {
  try {
    const where: Prisma.PostWhereInput = {};

    // Validate 'page' query param.
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    if (!page || page < 1 || page > 10) {
      throw new SafeError('Invalid page number', StatusCodes.BAD_REQUEST);
    }

    // Validate 'boardId' query param.
    const boardId = req.query.boardId
      ? helpers.validateBoardId(req.params.boardId)
      : null;

    if (boardId && boardId !== 'all') {
      await helpers.assertBoardExists(boardId);
      where.boardId = boardId;
    }

    // Get post data.
    const includeSensitiveData = !!req.user;
    const data = await resolvers.getPostsByPage(
      page,
      where,
      includeSensitiveData
    );

    // Send the response.
    res.json(data);
  } catch (error) {
    next(error);
  }
}

/*
 * Adds a post reply to the given thread.
 */
router.put('/', recaptcha, uploadMiddleware, attach, addPost);
async function addPost(req: Request, res: Response, next: NextFunction) {
  try {
    const threadId = helpers.validateThreadId(req.body.threadId);
    const body = req.body.body ? helpers.validatePostBody(req.body.body) : null;
    const files = req.files as Express.Multer.File[];

    // Assert that the post has either text or files.
    if (!body && !files?.length) {
      throw new SafeError(
        'Post must have text or files',
        StatusCodes.BAD_REQUEST
      );
    }

    // Assert thread can be posted to.
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });
    if (!thread) {
      throw new SafeError('Thread does not exist', StatusCodes.NOT_FOUND);
    }
    if (thread.archived) {
      throw new SafeError('Thread is archived', StatusCodes.LOCKED);
    }
    if (thread.locked) {
      throw new SafeError('Thread is locked', StatusCodes.LOCKED);
    }

    const userId = req.user?.id;
    // TODO - mod posts still have authorId. If a mod posts, then logs out
    // and posts again from the same IP, the posts will have the same authorId.
    // Is this acceptable?
    const boardId = thread.boardId;

    // Prepare all data.
    const sage = Boolean(req.body.sage);
    const name = req.body.name
      ? helpers.validatePostName(req.body.name)
      : 'Anonymous';
    const ipAddress = req.ipAddress;
    const password = req.body.password
      ? helpers.validatePostPassword(req.body.password)
      : null;
    const tripcode = password ? trip(ipAddress + password) : null;
    const authorId = crypto
      .createHash('sha256')
      .update(ipAddress + threadId)
      .digest('hex');

    // Build params.
    const params = {
      userId,
      threadId,
      boardId,
      sage,
      name,
      ipAddress,
      tripcode,
      authorId,
      body,
    };

    // Add the post.
    const post = await resolvers.addPost(params, files, thread);

    // Send the response.
    res.status(201).json(post);
  } catch (error) {
    // Rollback.
    if (req.files?.length) {
      try {
        await helpers.removeFiles(req.files as Express.Multer.File[]);
      } catch (error) {
        logger.error(`Error during rollback. Could not delete files. ${error}`);
      }
    }
    next(error);
  }
}

/*
 * Deletes a post by ID.
 */
router.delete('/:postId', auth, deletePost);
async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = helpers.validatePostId(req.params.postId);
    const deleteOnBoard = Boolean(req.body.deleteOnBoard);
    const deleteOnAllBoards = Boolean(req.body.deleteOnAllBoards);

    // Find the post.
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new SafeError('Post not found', StatusCodes.NOT_FOUND);
    }

    const { boardId, ipAddress } = post;

    // Build params.
    const params = {
      postId,
      boardId,
      ipAddress,
      deleteOnBoard,
      deleteOnAllBoards,
    };

    // Check permissions.
    const userId = req.user?.id;
    await helpers.checkPermissions(userId, params, boardId, {
      default: PermissionLevel.MODERATOR,
      deleteOnBoard: PermissionLevel.MODERATOR,
      deleteOnAllBoards: PermissionLevel.ADMIN,
    });

    // Delete the post.
    await resolvers.deletePost(params);

    // Send the response.
    res.status(StatusCodes.NO_CONTENT).end();

    // Add log entry.
    await helpers.log('Deleted post', userId, params);
  } catch (error) {
    next(error);
  }
}

export default router;
