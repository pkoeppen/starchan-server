import * as helpers from '../helpers';
import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { PermissionLevel, Prisma } from '@prisma/client';
import { SafeError, logger } from '../globals';
import { attach, auth, recaptcha } from '../middleware/auth';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import trip from 'tripcode';
import uploadMiddleware from '../middleware/upload';

const router = Router();

/*
 * Gets mix of threads from all boards.
 */
router.get('/', attach, getThreadsByPage);

/*
 * Gets multiple threads.
 */
router.get('/:boardId', attach, getThreadsByPage);
async function getThreadsByPage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const where: Prisma.ThreadWhereInput = {};

    // Validate 'page' query param.
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    if (!page || page < 1 || page > 10) {
      throw new SafeError('Invalid page number', StatusCodes.BAD_REQUEST);
    }

    // Validate 'boardId' route param.
    const boardId = req.params.boardId
      ? helpers.validateBoardId(req.params.boardId)
      : null;

    if (boardId && boardId !== 'all') {
      await helpers.assertBoardExists(boardId);
      where.boardId = boardId;
    }
    if (typeof req.query.sticky === 'boolean') {
      where.sticky = req.query.sticky;
    }
    if (typeof req.query.archived === 'boolean') {
      where.archived = req.query.archived;
    }

    // Get thread data.
    const includeSensitiveData = !!req.user;
    const data = await resolvers.getThreadsByPage(
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
 * List sticky threads.
 */
router.get('/:boardId/sticky', attach, listStickyThreads);
async function listStickyThreads(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Validate 'boardId' route param.
    const boardId =
      req.params.boardId === 'all'
        ? null
        : helpers.validateBoardId(req.params.boardId);

    // Parse 'take' query param.
    let take = parseInt(req.query.take as string) || 20;
    if (take > 20 || take < 1) {
      take = 20;
    }

    // Get thread data.
    const data = await resolvers.listStickyThreads(boardId, take);

    // Send the response.
    res.json(data);
  } catch (error) {
    next(error);
  }
}

/*
 * List the latest threads.
 */
router.get('/:boardId/latest', attach, listLatestThreads);
async function listLatestThreads(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Validate 'boardId' route param.
    const boardId =
      req.params.boardId === 'all'
        ? null
        : helpers.validateBoardId(req.params.boardId);

    let take = parseInt(req.query.take as string) || 20;
    if (take > 20 || take < 1) {
      take = 20;
    }

    // Get thread data.
    const data = await resolvers.listLatestThreads(boardId, take);

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
    // Validate boardId and threadId.
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
    await resolvers.updateThread(
      { boardId, threadId },
      { views: { increment: 1 } }
    );
    thread.views++;

    // Send the response.
    res.json(thread);
  } catch (error) {
    next(error);
  }
}

/*
 * Updates one thread.
 */
router.post('/:boardId/:threadId', auth, updateThread);
async function updateThread(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = helpers.validateBoardId(req.params.boardId);
    const threadId = helpers.validateThreadId(req.params.threadId);

    const updateParams: Prisma.ThreadUpdateInput = {};

    if (typeof req.body.sticky === 'boolean') {
      updateParams.sticky = req.body.sticky;
    }
    if (typeof req.body.locked === 'boolean') {
      updateParams.locked = req.body.locked;
    }
    if (typeof req.body.anchored === 'boolean') {
      updateParams.anchored = req.body.anchored;
    }
    if (typeof req.body.cycle === 'boolean') {
      updateParams.cycle = req.body.cycle;
    }
    if (typeof req.body.archived === 'boolean') {
      updateParams.archived = req.body.archived;
    }
    if (typeof req.body.willArchive === 'boolean') {
      updateParams.willArchive = req.body.willArchive;
    }

    // Don't do anything if there are no updates.
    if (!Object.keys(updateParams).length) {
      throw new SafeError('No updates to apply', StatusCodes.BAD_REQUEST);
    }

    // Check permissions.
    const userId = req.user?.id;
    await helpers.checkPermissions(userId, null, boardId, {
      default: PermissionLevel.MODERATOR,
    });

    // Update thread view count.
    await resolvers.updateThread({ boardId, threadId }, updateParams);

    // Send the response.
    res.status(StatusCodes.OK).end();

    // Add log entry.
    await helpers.log('Updated thread', userId, {
      boardId,
      threadId,
      updates: updateParams,
    });
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
    // Validate boardId.
    const boardId = helpers.validateBoardId(req.params.boardId);
    await helpers.assertBoardExists(boardId);

    // Validate title and body.
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
    const ipAddress = req.ipAddress;
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
