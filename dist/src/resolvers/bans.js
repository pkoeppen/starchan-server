"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBan = exports.addBan = exports.getBans = void 0;
const globals_1 = require("../globals");
/*
 * Gets multiple bans.
 */
async function getBans(params) {
    // Build the query.
    const query = {
        orderBy: {
            createdAt: 'desc',
        },
    };
    if (params.boardId) {
        query.where = { boardId: params.boardId };
    }
    if (params.ipAddress) {
        query.where = { ...query.where, ipAddress: params.ipAddress };
    }
    // Fetch the bans.
    return globals_1.prisma.ban.findMany(query);
}
exports.getBans = getBans;
/*
 * Adds a new ban.
 */
async function addBan(params) {
    // Create the ban.
    const ban = await globals_1.prisma.ban.create({
        data: {
            userId: params.userId,
            ipAddress: params.ipAddress,
            duration: params.duration,
            reason: params.reason,
            postId: params.postId,
            boardId: params.boardId,
            universal: params.universal,
        },
    });
    globals_1.logger.debug(`Created ban ${ban.id} for IP ${ban.ipAddress}`);
    if (params.deleteOnAllBoards) {
        // Delete all posts by this IP across all boards.
        await globals_1.prisma.post.deleteMany({
            where: {
                ipAddress: params.ipAddress,
            },
        });
        globals_1.logger.debug(`Deleted all posts by ${params.ipAddress}`);
    }
    else if (params.deleteOnBoard && params.boardId) {
        // Delete all posts by this IP on the given board.
        await globals_1.prisma.post.deleteMany({
            where: {
                ipAddress: params.ipAddress,
                boardId: params.boardId,
            },
        });
        globals_1.logger.debug(`Deleted all posts by ${params.ipAddress} on /${params.boardId}/`);
    }
    else if (params.deletePost && params.postId) {
        // Delete one post.
        await globals_1.prisma.post.delete({
            where: {
                id: params.postId,
            },
        });
        globals_1.logger.debug(`Deleted post ${params.postId}`);
    }
    else if (params.postId) {
        // Mark post as "banned for this post".
        await globals_1.prisma.post.update({
            where: {
                id: params.postId,
            },
            data: {
                bannedForThisPost: true,
            },
        });
        globals_1.logger.debug(`Marked post ${params.postId} as "banned for this post"`);
    }
}
exports.addBan = addBan;
/*
 * Deletes a ban.
 */
async function deleteBan(params) {
    // Delete the ban.
    const deletedBan = await globals_1.prisma.ban.delete({
        where: {
            id: params.banId,
        },
    });
    globals_1.logger.debug(`Deleted ban ${deletedBan.id}`);
    return deletedBan;
}
exports.deleteBan = deleteBan;
