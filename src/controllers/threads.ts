import * as helpers from '../helpers';
import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { attach, recaptcha } from '../middleware/auth';
import { Router } from 'express';
import { SafeError } from '../globals';
import { StatusCodes } from 'http-status-codes';
import trip from 'tripcode';
import uploadMiddleware from '../middleware/upload';

const router = Router();

/*
 * Gets multiple threads.
 */
router.get('/:boardId', attach, getThreads);
async function getThreads(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = helpers.validateBoardId(req.params.boardId);
    await helpers.assertBoardExists(boardId);

    let data;
    const sticky = req.query.sticky;
    const latest = req.query.latest;

    if (sticky) {
      // Get all sticky threads.
      data = await resolvers.getStickyThreads({ boardId });
      return res.json(data);
    } else if (latest) {
      // Get latest threads.
      data = await resolvers.getLatestThreads({ boardId });
      return res.json(data);
    }

    // Validate 'page' query param.
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    if (!page || page < 1 || page > 10) {
      throw new SafeError('Invalid page number', StatusCodes.BAD_REQUEST);
    }

    // Get thread data.
    const includeSensitiveData = !!req.user;
    data = await resolvers.getThreadsByPage(
      { boardId, page },
      includeSensitiveData
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
}

/*
 * Gets one thread and its posts.
 */
router.get('/:boardId/:threadId', attach, getThread);
async function getThread(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = helpers.validateBoardId(req.params.boardId);
    const threadId = helpers.validateThreadId(req.params.threadId);

    // Get thread data.
    const includeSensitiveData = !!req.user;
    const thread = await resolvers.getThread(
      { boardId, threadId },
      includeSensitiveData
    );
    if (!thread) {
      throw new SafeError('Thread not found', StatusCodes.NOT_FOUND);
    }

    // Update thread view count.
    await resolvers.updateThread({ threadId }, { views: { increment: 1 } });
    thread.views++;

    res.json(thread);
  } catch (error) {
    next(error);
  }
}

/*
 * Adds a new thread.
 */
router.put('/:boardId', recaptcha, uploadMiddleware, attach, addThread);
async function addThread(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = helpers.validateBoardId(req.params.boardId);
    await helpers.assertBoardExists(boardId);

    // Assert thread has a title.
    const title = req.body.title || '';
    if (!title) {
      throw new SafeError('Thread must have a title', StatusCodes.BAD_REQUEST);
    }

    // TODO: Validate other things, like post body length, etc

    // Assert thread has a post body.
    const body = req.body.body || '';
    if (!body) {
      throw new SafeError('Thread must have a body', StatusCodes.BAD_REQUEST);
    }

    // Assert thread has at least one file.
    const files = req.files;
    if (!files?.length) {
      throw new SafeError(
        'Thread must have at least one file',
        StatusCodes.BAD_REQUEST
      );
    }

    // Prepare the data.
    const name = req.body.name || 'Anonymous';
    const ipAddress = req.ip;
    const password = req.body.password;
    const tripcode = password ? trip(ipAddress + password) : null;

    const params = {
      boardId,
      title,
      name,
      ipAddress,
      tripcode,
      body,
    };

    // Add the thread.
    const includeSensitiveData = !!req.user;
    const post = await resolvers.addThread(
      params,
      files as any,
      includeSensitiveData
    );
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

export default router;
