import * as helpers from '../helpers';
import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { SafeError, prisma } from '../globals';
import { PermissionLevel } from '@prisma/client';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { auth } from '../middleware/auth';

const router = Router();

/*
 * Gets all boards.
 */
router.get('/', getBoards);
async function getBoards(req: Request, res: Response, next: NextFunction) {
  try {
    // Get board data.
    const data = await resolvers.getBoards();
    // Send the response.
    res.json(data);
  } catch (error) {
    next(error);
  }
}

/*
 * Updates a board by ID.
 */
router.post('/:boardId', auth, updateBoard);
async function updateBoard(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = helpers.validateBoardId(req.params.boardId);
    const newBoardId = req.body.newBoardId;
    const title = req.body.title;

    if (!newBoardId && !title) {
      throw new SafeError('Nothing to update', StatusCodes.BAD_REQUEST);
    }

    if (title) {
      // Validate the new board title.
      if (typeof title !== 'string') {
        throw new SafeError('Invalid board title', StatusCodes.BAD_REQUEST);
      }
      if (title.length > 30) {
        throw new SafeError(
          'Board title must be less than 30 characters long',
          StatusCodes.BAD_REQUEST
        );
      }
    }

    if (newBoardId) {
      // Validate the new board ID.
      if (typeof newBoardId !== 'string') {
        throw new SafeError('Invalid board ID', StatusCodes.BAD_REQUEST);
      }
      if (newBoardId.length > 4) {
        throw new SafeError(
          'Board ID must be less than 4 characters long',
          StatusCodes.BAD_REQUEST
        );
      }

      // Assert that the new board ID is available.
      const boardIdTaken = !!(await prisma.board.findUnique({
        where: {
          id: newBoardId,
        },
      }));
      if (boardIdTaken) {
        throw new SafeError('Board ID taken', StatusCodes.CONFLICT);
      }
    }

    // Check permissions.
    const userId = req.user?.id;
    const params = {
      updateBoardTitle: Boolean(title),
      updateBoardId: Boolean(newBoardId),
    };
    // Only the site owner can update a board ID. This requires a global logout,
    // since a user's JWT contains role objects pointing at board IDs.
    await helpers.checkPermissions(userId, params, boardId, {
      default: PermissionLevel.ADMIN,
      updateBoardTitle: PermissionLevel.ADMIN,
      updateBoardId: PermissionLevel.OWNER,
    });

    // Update the board.
    await resolvers.updateBoard({
      boardId,
      newBoardId,
      title,
    });

    // Send the response.
    res.status(200).end();

    // Add log entry.
    await helpers.log('Updated board', userId, params);
  } catch (error) {
    next(error);
  }
}

export default router;
