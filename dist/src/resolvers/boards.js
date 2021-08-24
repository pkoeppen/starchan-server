"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBoard = exports.getBoards = void 0;
const globals_1 = require("../globals");
/*
 * Gets multiple boards.
 */
async function getBoards() {
    const boards = await globals_1.prisma.board.findMany({
        orderBy: {
            id: 'asc',
        },
        include: {
            _count: {
                select: {
                    posts: true,
                    threads: true,
                },
            },
        },
    });
    return boards;
}
exports.getBoards = getBoards;
/*
 * Updates a board by ID.
 */
async function updateBoard(params) {
    // Build update params.
    const updates = {};
    if (params.newBoardId) {
        updates.id = params.newBoardId;
    }
    if (params.title) {
        updates.title = params.title;
    }
    // Update the board.
    const updatedBoard = await globals_1.prisma.board.update({
        where: {
            id: params.boardId,
        },
        data: updates,
    });
    return updatedBoard;
}
exports.updateBoard = updateBoard;
