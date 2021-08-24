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
exports.addThread = exports.updateThread = exports.getThread = exports.getLatestThreads = exports.getStickyThreads = exports.getAllThreadsByPage = exports.getThreadsByPage = void 0;
const helpers = __importStar(require("../helpers"));
const client_1 = require("@prisma/client");
const globals_1 = require("../globals");
const crypto_1 = __importDefault(require("crypto"));
/*
 * Gets multiple threads.
 */
async function getThreadsByPage(params, includeSensitiveData = false) {
    const skip = (params.page - 1) * 10;
    const postSelectParams = getPostSelectParams(includeSensitiveData, params.boardId);
    // Fetch the threads.
    const threads = await globals_1.prisma.thread.findMany({
        where: { boardId: params.boardId },
        orderBy: [
            {
                sticky: 'desc',
            },
            {
                bumpedAt: 'desc',
            },
        ],
        skip,
        take: 10,
        include: {
            rootPost: {
                select: postSelectParams,
            },
            _count: {
                select: { posts: true },
            },
        },
    });
    return threads;
}
exports.getThreadsByPage = getThreadsByPage;
/*
 * Gets mix of threads from all boards.
 */
async function getAllThreadsByPage(params, includeSensitiveData = false) {
    const skip = (params.page - 1) * 10;
    const postSelectParams = getPostSelectParams(includeSensitiveData);
    // Fetch the threads.
    const threads = await globals_1.prisma.thread.findMany({
        orderBy: {
            bumpedAt: 'desc',
        },
        skip,
        take: 10,
        include: {
            rootPost: {
                select: postSelectParams,
            },
            _count: {
                select: { posts: true },
            },
        },
    });
    return threads;
}
exports.getAllThreadsByPage = getAllThreadsByPage;
/*
 * Gets all sticky threads.
 */
async function getStickyThreads(params) {
    const threads = await globals_1.prisma.thread.findMany({
        where: {
            boardId: params.boardId,
            sticky: true,
        },
        orderBy: {
            id: 'desc',
        },
    });
    return threads;
}
exports.getStickyThreads = getStickyThreads;
/*
 * Gets latest 10 threads.
 */
async function getLatestThreads(params) {
    const threads = await globals_1.prisma.thread.findMany({
        where: {
            boardId: params.boardId,
        },
        orderBy: {
            bumpedAt: 'desc',
        },
        take: 10,
    });
    return threads;
}
exports.getLatestThreads = getLatestThreads;
/*
 * Gets one thread.
 */
async function getThread(params, includeSensitiveData = false) {
    const postSelectParams = getPostSelectParams(includeSensitiveData, params.boardId);
    // Fetch the thread.
    const thread = await globals_1.prisma.thread.findUnique({
        where: { id: params.threadId },
        include: {
            rootPost: {
                select: postSelectParams,
            },
            posts: {
                orderBy: {
                    id: 'asc',
                },
                select: postSelectParams,
            },
            _count: {
                select: { posts: true },
            },
        },
    });
    return thread;
}
exports.getThread = getThread;
/*
 * Updates a thread.
 */
async function updateThread(params, data) {
    const thread = await globals_1.prisma.thread.update({
        where: { id: params.threadId },
        data,
    });
    globals_1.logger.debug(`Updated thread ${params.threadId}`);
    return thread;
}
exports.updateThread = updateThread;
/*
 * Adds a new thread.
 */
async function addThread(params, files, includeSensitiveData = false) {
    // Update stat object to obtain post ID.
    const stat = await globals_1.prisma.stat.update({
        where: {
            key: 'PostCount',
        },
        data: {
            value: {
                increment: 1,
            },
        },
    });
    const rootPostId = stat.value;
    if (!rootPostId) {
        throw new Error(`Error incrementing post counter. prisma.stat.update() returned ${JSON.stringify(stat)}`);
    }
    // Generate author ID.
    const authorId = crypto_1.default
        .createHash('sha256')
        .update(params.ipAddress + rootPostId)
        .digest('hex');
    // Render the post body Markdown.
    const { original: bodyMd, rendered: bodyHtml, metadata, } = helpers.render(params.body);
    // Extract references from Markdown metadata.
    const references = metadata.references
        ? Array.from(metadata.references)
        : null;
    // Prepare the root post data.
    const data = {
        id: rootPostId,
        ipAddress: params.ipAddress,
        name: params.name,
        authorId,
        tripcode: params.tripcode,
        bodyMd,
        bodyHtml,
        bannedForThisPost: false,
        board: {
            connect: {
                id: params.boardId,
            },
        },
        files: {
            connectOrCreate: files.map((file) => {
                return {
                    where: {
                        id: file.id,
                    },
                    create: {
                        id: file.id,
                        size: file.size,
                        filename: file.filename,
                        mimetype: file.mimetype,
                        nsfw: file.nsfw,
                    },
                };
            }),
        },
    };
    if (params.userId) {
        data.user = {
            connect: {
                id: params.userId,
            },
        };
    }
    // Create the root post.
    const post = (await globals_1.prisma.post.create({
        data,
        select: {
            id: true,
            thread: {
                select: {
                    boardId: true,
                },
            },
        },
    }));
    // Create the thread.
    await globals_1.prisma.thread.create({
        data: {
            id: rootPostId,
            title: params.title,
            bumpedAt: new Date(),
            rootPost: {
                connect: {
                    id: rootPostId,
                },
            },
            board: {
                connect: {
                    id: params.boardId,
                },
            },
        },
    });
    if (!includeSensitiveData) {
        // Delete ipAddress field.
        delete post.ipAddress;
    }
    // If there are references, connect them.
    if (references) {
        for (const id of references) {
            try {
                await globals_1.prisma.post.update({
                    where: {
                        id: post.id,
                    },
                    data: {
                        references: {
                            connect: [{ id: id }],
                        },
                    },
                });
            }
            catch (error) {
                // Likely thrown because the referenced ID does not exist.
            }
        }
    }
    globals_1.logger.debug(`Created new thread ${post.id}`);
    // If thread count has exceeded 100, trim threads.
    // This retrieves the last thread, after which all threads should be trimmed.
    const threads = await globals_1.prisma.thread.findMany({
        where: {
            boardId: params.boardId,
            archived: false,
        },
        select: {
            bumpedAt: true,
        },
        orderBy: [
            {
                sticky: 'desc',
            },
            {
                bumpedAt: 'desc',
            },
        ],
        skip: 99,
        take: 1,
    });
    if (threads.length) {
        const lastThread = threads[0];
        const { count } = await globals_1.prisma.thread.deleteMany({
            where: {
                archived: false,
                sticky: false,
                bumpedAt: {
                    lt: lastThread.bumpedAt,
                },
            },
        });
        globals_1.logger.debug(`Trimmed ${count} threads`);
    }
    return post;
}
exports.addThread = addThread;
/*
 * Builds post select parameters.
 */
function getPostSelectParams(includeSensitiveData = false, boardId) {
    const postSelectParams = {
        id: true,
        sage: true,
        name: true,
        authorId: true,
        tripcode: true,
        createdAt: true,
        bodyHtml: true,
        bannedForThisPost: true,
        files: true,
        referencedBy: {
            select: {
                id: true,
            },
        },
        user: {
            select: {
                username: true,
            },
        },
    };
    if (includeSensitiveData) {
        postSelectParams.ipAddress = true;
    }
    if (boardId) {
        // If this post was created by a mod of this board, select the roles.
        // This will be used to display the moderator tag on the front end.
        postSelectParams.user.select.roles = {
            where: {
                OR: [{ boardId }, { level: client_1.PermissionLevel.OWNER }],
            },
            select: {
                level: true,
                boardId: true,
            },
        };
    }
    return postSelectParams;
}
