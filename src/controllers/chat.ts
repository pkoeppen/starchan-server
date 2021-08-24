import * as helpers from '../helpers';
import { NextFunction, Request, Response } from 'express';
import { SafeError, logger, prisma, redis } from '../globals';
import { attach, recaptcha } from '../middleware/auth';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';

const router = Router();
const TEN_MINUTES = 60 * 10;

/*
 * Starts a new chat room with the given author ID.
 */
router.put('/', recaptcha, attach, startChat);
async function startChat(req: Request, res: Response, next: NextFunction) {
  try {
    let ipAddress = req.ipAddress;
    // If this is an address like ::ffff:1.2.3.4, get the IPv4 address.
    if (ipAddress.includes(':')) {
      ipAddress = ipAddress.split(':').pop() as string;
    }
    const authorId = helpers.validateAuthorId(req.body.authorId);
    const threadId = helpers.validateThreadId(req.body.threadId);
    const boardId = helpers.validateBoardId(req.body.boardId);
    const message = req.body.message;
    if (!message) {
      throw new SafeError('Missing message content', StatusCodes.BAD_REQUEST);
    }
    if (typeof message !== 'string') {
      throw new SafeError('Invalid message content', StatusCodes.BAD_REQUEST);
    }
    if (message.length > 250) {
      throw new SafeError('Message too long', StatusCodes.BAD_REQUEST);
    }

    // Get the IP of the other user.
    const post = await prisma.post.findFirst({
      where: {
        authorId,
      },
    });

    if (!post?.authorId) {
      throw new SafeError(
        'User has not posted in thread',
        StatusCodes.FORBIDDEN
      );
    }

    const partnerIpAddress = post.ipAddress;
    if (ipAddress === partnerIpAddress) {
      throw new SafeError(
        'Cannot start chat with self',
        StatusCodes.BAD_REQUEST
      );
    }

    const ipHash = helpers.encrypt(ipAddress);
    const partnerIpHash = helpers.encrypt(partnerIpAddress);
    const myAuthorId = crypto
      .createHash('sha256')
      .update(ipAddress + threadId)
      .digest('hex');

    // Check if a conversation already exists between these two users.
    const roomId = helpers
      .encrypt([authorId, myAuthorId].sort().join(''))
      .slice(-6);
    const exists = await redis.exists(`room:${roomId}:data`);

    const multi = redis.multi();

    if (!exists) {
      // Set room data.
      multi.hmset(`room:${roomId}:data`, {
        id: roomId,
        boardId,
        threadId,
      });

      // Set my IP data.
      multi.hmset(`room:${roomId}:ip:${ipHash}:data`, {
        ipHash,
        authorId: myAuthorId,
      });

      // Set partner's IP data.
      multi.hmset(`room:${roomId}:ip:${partnerIpHash}:data`, {
        ipHash: partnerIpHash,
        authorId,
      });

      // Set unread messages count.
      multi.set(`room:${roomId}:ip:${ipHash}:unread`, 0);
      multi.set(`room:${roomId}:ip:${partnerIpHash}:unread`, 0);
    } else {
      multi.incr(`room:${roomId}:ip:${partnerIpHash}:unread`);
    }

    // Set message data.
    const now = Date.now();
    multi.hmset(`room:${roomId}:message:${now}:data`, {
      from: myAuthorId,
      content: message,
      createdAt: now,
    });

    // Expire all keys.
    multi.expire(`room:${roomId}:data`, TEN_MINUTES);
    multi.expire(`room:${roomId}:ip:${ipHash}:data`, TEN_MINUTES);
    multi.expire(`room:${roomId}:ip:${partnerIpHash}:data`, TEN_MINUTES);
    multi.expire(`room:${roomId}:ip:${ipHash}:unread`, TEN_MINUTES);
    multi.expire(`room:${roomId}:ip:${partnerIpHash}:unread`, TEN_MINUTES);
    multi.expire(`room:${roomId}:message:${now}:data`, TEN_MINUTES);

    // Execute.
    await multi.exec();
    if (!exists) {
      logger.debug(
        `Created room ${roomId} between ${ipAddress} and ${partnerIpAddress}`
      );
    }

    // Send the response.
    res.status(exists ? StatusCodes.OK : StatusCodes.CREATED).json({ roomId });
  } catch (error) {
    next(error);
  }
}

export default router;
