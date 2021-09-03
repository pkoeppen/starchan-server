import * as helpers from '../helpers';
import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { SafeError, prisma } from '../globals';
import { attach, auth, recaptcha } from '../middleware/auth';
import { PermissionLevel } from '@prisma/client';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

const router = Router();

/*
 * Gets multiple reports.
 */
router.get('/', auth, getReports);
async function getReports(req: Request, res: Response, next: NextFunction) {
  try {
    const boardId = req.query.boardId as string;
    const ipAddress = req.query.ipAddress as string;

    // Fetch the reports.
    const reports = await resolvers.getReports({ boardId, ipAddress });

    // Send the response.
    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
}

/*
 * Adds a new report.
 */
router.put('/', recaptcha, attach, addReport);
async function addReport(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = helpers.validatePostId(req.body.postId);
    const reason = helpers.validateReportReason(req.body.reason);

    // Assert post exists.
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        threadId: true,
        boardId: true,
        rootThread: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!post) {
      throw new SafeError('Post not found', StatusCodes.NOT_FOUND);
    }

    const boardId = post.boardId;
    const threadId = (post.threadId || post.rootThread?.id) as bigint;
    const ipAddress = req.ipAddress;

    // Add the report.
    await resolvers.addReport({ postId, threadId, boardId, reason, ipAddress });

    // Send the response.
    res.status(201).end();
  } catch (error) {
    next(error);
  }
}

/*
 * Deletes a report by ID.
 */
router.delete('/:reportId', auth, deleteReport);
async function deleteReport(req: Request, res: Response, next: NextFunction) {
  try {
    const reportId = helpers.validateReportId(req.params.reportId);

    // Find the report.
    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
      },
      select: {
        boardId: true,
      },
    });

    if (!report) {
      throw new SafeError('Report not found', StatusCodes.NOT_FOUND);
    }

    const { boardId } = report;

    // Check permissions.
    const userId = req.user?.id;
    await helpers.checkPermissions(userId, null, boardId, {
      default: PermissionLevel.MODERATOR,
    });

    // Delete the report.
    const deletedReport = await resolvers.deleteReport({ reportId });

    // Send the response.
    res.status(StatusCodes.NO_CONTENT).end();

    // Add log entry.
    await helpers.log('Dismissed report', userId, deletedReport);
  } catch (error) {
    next(error);
  }
}

export default router;
