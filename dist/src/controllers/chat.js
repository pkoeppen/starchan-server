"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers = __importStar(require("../helpers"));
const globals_1 = require("../globals");
const auth_1 = require("../middleware/auth");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.Router();
const TEN_MINUTES = 60 * 10;
/*
 * Starts a new chat room with the given author ID.
 */
router.put('/', auth_1.recaptcha, auth_1.attach, startChat);
async function startChat(req, res, next) {
    try {
        let ipAddress = req.ip;
        // If this is an address like ::ffff:1.2.3.4, get the IPv4 address.
        if (ipAddress.includes(':')) {
            ipAddress = ipAddress.split(':').pop();
        }
        const authorId = helpers.validateAuthorId(req.body.authorId);
        const threadId = helpers.validateThreadId(req.body.threadId);
        const boardId = helpers.validateBoardId(req.body.boardId);
        const message = req.body.message;
        if (!message) {
            throw new globals_1.SafeError('Missing message content', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        if (typeof message !== 'string') {
            throw new globals_1.SafeError('Invalid message content', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        if (message.length > 250) {
            throw new globals_1.SafeError('Message too long', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        // Get the IP of the other user.
        const post = await globals_1.prisma.post.findFirst({
            where: {
                authorId,
            },
        });
        if (!post?.authorId) {
            throw new globals_1.SafeError('User has not posted in thread', http_status_codes_1.StatusCodes.FORBIDDEN);
        }
        const partnerIpAddress = post.ipAddress;
        if (ipAddress === partnerIpAddress) {
            throw new globals_1.SafeError('Cannot start chat with self', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        const ipHash = helpers.encrypt(ipAddress);
        const partnerIpHash = helpers.encrypt(partnerIpAddress);
        const myAuthorId = crypto_1.default
            .createHash('sha256')
            .update(ipAddress + threadId)
            .digest('hex');
        // Check if a conversation already exists between these two users.
        const roomId = helpers
            .encrypt([authorId, myAuthorId].sort().join(''))
            .slice(-6);
        const exists = await globals_1.redis.exists(`room:${roomId}:data`);
        const multi = globals_1.redis.multi();
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
        }
        else {
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
            globals_1.logger.debug(`Created room ${roomId} between ${ipAddress} and ${partnerIpAddress}`);
        }
        // Send the response.
        res.status(exists ? http_status_codes_1.StatusCodes.OK : http_status_codes_1.StatusCodes.CREATED).json({ roomId });
    }
    catch (error) {
        next(error);
    }
}
exports.default = router;
