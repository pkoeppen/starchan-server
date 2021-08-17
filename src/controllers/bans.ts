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
 * Gets multiple bans.
 */
router.get('/', auth, getBans);
async function getBans(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = req.query.boardId as string;
    const ipAddress = req.query.ipAddress as string;

    // Fetch the bans.
    const bans = await resolvers.getBans({ boardId, ipAddress });

    // Send the response.
    res.status(200).json(bans);
  } catch (error) {
    next(error);
  }
}

/*
 * Adds a new ban.
 */
router.put('/', auth, addBan);
async function addBan(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate IP address.
    const ipAddress = helpers.validateIpAddress(req.body.ipAddress);

    // Validate ban duration.
    const duration = parseInt(req.body.duration || 0);
    if (isNaN(duration)) {
      throw new SafeError('Invalid ban duration', StatusCodes.BAD_REQUEST);
    }
    if (duration < 0) {
      throw new SafeError(
        'Ban duration must be greater than zero',
        StatusCodes.BAD_REQUEST
      );
    }
    if (duration > 365) {
      throw new SafeError(
        'Ban duration must be less than one year',
        StatusCodes.BAD_REQUEST
      );
    }

    // Validate ban reason.
    const reason = req.body.reason || null;
    if (reason && typeof reason !== 'string') {
      throw new SafeError('Invalid ban reason', StatusCodes.BAD_REQUEST);
    }
    if (reason.length > 100) {
      throw new SafeError(
        'Ban reason must be less than 100 characters long',
        StatusCodes.BAD_REQUEST
      );
    }

    // Validate post ID.
    const postId = req.body.postId
      ? helpers.validatePostId(req.body.postId)
      : null;

    // Validate board ID.
    const boardId = req.body.boardId
      ? helpers.validateBoardId(req.body.boardId)
      : null;

    // Get other fields.
    const universal = Boolean(req.body.universal);
    const deletePost = Boolean(req.body.deletePost);
    const deleteOnBoard = Boolean(req.body.deleteOnBoard);
    const deleteOnAllBoards = Boolean(req.body.deleteOnAllBoards);

    if (!universal && !boardId) {
      throw new SafeError(
        'Non-universal bans must specify a board ID',
        StatusCodes.BAD_REQUEST
      );
    }

    if (deleteOnBoard && !boardId) {
      throw new SafeError(
        '"Delete on board" option must specify a board ID',
        StatusCodes.BAD_REQUEST
      );
    }

    if (deletePost && !postId) {
      throw new SafeError(
        '"Delete post" option must specify a post ID',
        StatusCodes.BAD_REQUEST
      );
    }

    // Build params.
    const params = {
      userId: req.user?.id as string,
      ipAddress,
      duration,
      reason,
      postId,
      boardId,
      universal,
      deletePost,
      deleteOnBoard,
      deleteOnAllBoards,
    };

    // Check permissions.
    await helpers.checkPermissions(params.userId, params, boardId, {
      default: PermissionLevel.MODERATOR,
      deletePost: PermissionLevel.MODERATOR,
      deleteOnBoard: PermissionLevel.MODERATOR,
      deleteOnAllBoards: PermissionLevel.ADMIN,
      universal: PermissionLevel.ADMIN,
    });

    // Add the ban.
    await resolvers.addBan(params);

    // Send the response.
    res.status(201).end();

    // Add log entry.
    await helpers.log('Banned IP', req.user?.id, params);
  } catch (error) {
    next(error);
  }
}

/*
 * Deletes a ban by ID.
 */
router.delete('/:banId', auth, deleteBan);
async function deleteBan(req: Request, res: Response, next: NextFunction) {
  try {
    const banId = helpers.validateBanId(req.params.banId);

    // Find the ban.
    const ban = await prisma.ban.findUnique({
      where: {
        id: banId,
      },
    });

    if (!ban) {
      throw new SafeError('Ban not found', StatusCodes.NOT_FOUND);
    }

    // Check permissions.
    const userId = req.user?.id;
    const params = {
      liftUniversalBan: ban.universal,
    };
    // Any admin can lift a universal ban. If the ban is not universal, the user
    // must be at least a moderator on the board for which the ban was created.
    const boardId = params.liftUniversalBan ? null : ban.boardId;
    await helpers.checkPermissions(userId, params, boardId, {
      default: PermissionLevel.MODERATOR,
      liftUniversalBan: PermissionLevel.ADMIN,
    });

    // Delete the ban.
    const deletedBan = await resolvers.deleteBan({ banId });

    // Send the response.
    res.status(StatusCodes.NO_CONTENT).end();

    // Add log entry.
    await helpers.log('Lifted ban', req.user?.id, deletedBan);
  } catch (error) {
    next(error);
  }
}

export default router;
