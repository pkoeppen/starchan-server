import * as helpers from '../helpers';
import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { SafeError, logger, prisma } from '../globals';
import { attach, recaptcha } from '../middleware/auth';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import trip from 'tripcode';
import uploadMiddleware from '../middleware/upload';

const router = Router();

/*
 * Gets all chat messages to or from the requester's IP.
 */
router.get('/', attach, getChatMessages);
async function getChatMessages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ipAddress = req.ip;
    const data = await prisma.chatRoom.findMany({
      where: {
        participants: {
          has: ipAddress,
        },
      },
      include: {
        messages: true,
      },
    });

    // Send the response.
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export default router;
