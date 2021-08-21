"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBoard = exports.getBoards = void 0;
const globals_1 = require("../globals");
/*
 * Gets multiple boards.
 */
function getBoards() {
    return __awaiter(this, void 0, void 0, function* () {
        const boards = yield globals_1.prisma.board.findMany({
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
    });
}
exports.getBoards = getBoards;
/*
 * Updates a board by ID.
 */
function updateBoard(params) {
    return __awaiter(this, void 0, void 0, function* () {
        // Build update params.
        const updates = {};
        if (params.newBoardId) {
            updates.id = params.newBoardId;
        }
        if (params.title) {
            updates.title = params.title;
        }
        // Update the board.
        const updatedBoard = yield globals_1.prisma.board.update({
            where: {
                id: params.boardId,
            },
            data: updates,
        });
        return updatedBoard;
    });
}
exports.updateBoard = updateBoard;
