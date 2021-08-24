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
const resolvers = __importStar(require("../resolvers"));
const globals_1 = require("../globals");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const crypto_1 = __importDefault(require("crypto"));
const tripcode_1 = __importDefault(require("tripcode"));
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.Router();
/*
 * Resolves the URI of the given post ID.
 */
router.get('/resolve/:postId', resolvePostUri);
async function resolvePostUri(req, res, next) {
    try {
        const postId = helpers.validatePostId(req.params.postId);
        const post = await globals_1.prisma.post.findUnique({
            where: {
                id: postId,
            },
            select: {
                id: true,
                boardId: true,
                threadId: true,
            },
        });
        if (!post) {
            throw new globals_1.SafeError('Post not found', http_status_codes_1.StatusCodes.NOT_FOUND);
        }
        // If post.threadId is null, that means this post is a thread root.
        res
            .status(200)
            .send(`/${post.boardId}/thread/${post.threadId || post.id}/#${post.id}`);
    }
    catch (error) {
        next(error);
    }
}
/*
 * Adds a post reply to the given thread.
 */
router.put('/', auth_1.recaptcha, upload_1.default, auth_1.attach, addPost);
async function addPost(req, res, next) {
    try {
        const threadId = helpers.validateThreadId(req.body.threadId);
        const body = req.body.body ? helpers.validatePostBody(req.body.body) : null;
        const files = req.files;
        // Assert that the post has either text or files.
        if (!body && !files?.length) {
            throw new globals_1.SafeError('Post must have text or files', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        // Assert thread can be posted to.
        const thread = await globals_1.prisma.thread.findUnique({
            where: { id: threadId },
        });
        if (!thread) {
            throw new globals_1.SafeError('Thread does not exist', http_status_codes_1.StatusCodes.NOT_FOUND);
        }
        if (thread.locked) {
            throw new globals_1.SafeError('Thread is locked', http_status_codes_1.StatusCodes.LOCKED);
        }
        const userId = req.user?.id;
        const boardId = thread.boardId;
        // Prepare all data.
        const sage = Boolean(req.body.sage);
        const name = req.body.name
            ? helpers.validatePostName(req.body.name)
            : 'Anonymous';
        const ipAddress = req.ip;
        const password = req.body.password
            ? helpers.validatePostPassword(req.body.password)
            : null;
        const tripcode = password ? tripcode_1.default(ipAddress + password) : null;
        const authorId = crypto_1.default
            .createHash('sha256')
            .update(ipAddress + threadId)
            .digest('hex');
        // Build params.
        const params = {
            userId,
            threadId,
            boardId,
            sage,
            name,
            ipAddress,
            tripcode,
            authorId,
            body,
        };
        // Add the post.
        const post = await resolvers.addPost(params, files);
        // Send the response.
        res.status(201).json(post);
    }
    catch (error) {
        // Rollback.
        if (req.files?.length) {
            try {
                await helpers.removeFiles(req.files);
            }
            catch (error) {
                globals_1.logger.error(`Error during rollback. Could not delete files. ${error}`);
            }
        }
        next(error);
    }
}
/*
 * Deletes a post by ID.
 */
router.delete('/:postId', auth_1.auth, deletePost);
async function deletePost(req, res, next) {
    try {
        const postId = helpers.validatePostId(req.params.postId);
        const deleteOnBoard = Boolean(req.body.deleteOnBoard);
        const deleteOnAllBoards = Boolean(req.body.deleteOnAllBoards);
        // Find the post.
        const post = await globals_1.prisma.post.findUnique({
            where: {
                id: postId,
            },
        });
        if (!post) {
            throw new globals_1.SafeError('Post not found', http_status_codes_1.StatusCodes.NOT_FOUND);
        }
        const { boardId, ipAddress } = post;
        // Build params.
        const params = {
            postId,
            boardId,
            ipAddress,
            deleteOnBoard,
            deleteOnAllBoards,
        };
        // Check permissions.
        const userId = req.user?.id;
        await helpers.checkPermissions(userId, params, boardId, {
            default: client_1.PermissionLevel.MODERATOR,
            deleteOnBoard: client_1.PermissionLevel.MODERATOR,
            deleteOnAllBoards: client_1.PermissionLevel.ADMIN,
        });
        // Delete the post.
        await resolvers.deletePost(params);
        // Send the response.
        res.status(http_status_codes_1.StatusCodes.NO_CONTENT).end();
        // Add log entry.
        await helpers.log('Deleted post', userId, params);
    }
    catch (error) {
        next(error);
    }
}
exports.default = router;
