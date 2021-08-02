import * as helpers from '../helpers';
import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { SafeError, prisma } from '../globals';
import { attach, auth, recaptcha } from '../middleware/auth';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import trip from 'tripcode';
import uploadMiddleware from '../middleware/upload';

const router = Router();

/*
 * Adds a post reply to the given thread.
 */
router.put('/', recaptcha, uploadMiddleware, attach, addPost);
async function addPost(req: Request, res: Response, next: NextFunction) {
  try {
    const threadId = helpers.validateThreadId(req.body.threadId);
    const boardId = helpers.validateBoardId(req.body.boardId);

    const body = req.body.body || '';
    const files = req.files;

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
    if (thread.locked) {
      throw new SafeError('Thread is locked', StatusCodes.NOT_FOUND);
    }

    // Prepare all data.
    const name = req.body.name || 'Anonymous';
    const ipAddress = req.ip;
    const password = req.body.password;
    const tripcode = password ? trip(ipAddress + password) : null;
    const authorId = crypto
      .createHash('sha256')
      .update(ipAddress + threadId)
      .digest('hex');

    const params = {
      threadId,
      boardId,
      name,
      ipAddress,
      tripcode,
      authorId,
      body,
    };

    // Add the post.
    const post = await resolvers.addPost(params, files as any);

    res.status(201).json(post);
  } catch (error) {
    // TODO: add rollback to delete files
    // or make a "chron job" to clean up orphaned files
    // 1. clean up files by S3 keys that have no match in the database
    // 2. clean up files by orphaned database File objects

    if (req.files?.length) {
      // for (const file of req.files) {
      //   // remove from s3
      // }
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

    // Delete the post.
    await resolvers.deletePost({ postId, deleteOnBoard, deleteOnAllBoards });

    res.status(StatusCodes.NO_CONTENT).end();
  } catch (error) {
    next(error);
  }
}

export default router;
