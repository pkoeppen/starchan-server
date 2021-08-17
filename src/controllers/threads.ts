import * as helpers from '../helpers';
import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { SafeError, logger } from '../globals';
import { attach, recaptcha } from '../middleware/auth';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import trip from 'tripcode';
import uploadMiddleware from '../middleware/upload';

const router = Router();

/*
 * Gets mix of threads from all boards.
 */
router.get('/all', attach, getAllThreads);
async function getAllThreads(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate 'page' query param.
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    if (!page || page < 1 || page > 10) {
      throw new SafeError('Invalid page number', StatusCodes.BAD_REQUEST);
    }

    // Get thread data.
    const includeSensitiveData = !!req.user;
    const data = await resolvers.getAllThreadsByPage(
      { page },
      includeSensitiveData
    );

    // Send the response.
    res.json(data);
  } catch (error) {
    next(error);
  }
}

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

    // Send the response.
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

    // Send the response.
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
    const title = helpers.validateThreadTitle(req.body.title);
    const body = helpers.validatePostBody(req.body.body);
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
    const ipAddress = req.ip;
    const userId = req.user?.id;
    const name = req.body.name
      ? helpers.validatePostName(req.body.name)
      : 'Anonymous';
    const password = req.body.password
      ? helpers.validatePostPassword(req.body.password)
      : null;
    const tripcode = password ? trip(ipAddress + password) : null;

    // Build params.
    const params = {
      userId,
      boardId,
      title,
      name,
      ipAddress,
      tripcode,
      body,
    };

    // Add the thread.
    const includeSensitiveData = !!req.user;
    const rootPost = await resolvers.addThread(
      params,
      files as any,
      includeSensitiveData
    );

    // Send the response.
    res.status(201).json(rootPost);
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

export default router;
