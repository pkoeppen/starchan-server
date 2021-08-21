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
const helpers = __importStar(require("../helpers"));
const resolvers = __importStar(require("../resolvers"));
const globals_1 = require("../globals");
const client_1 = require("@prisma/client");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const auth_1 = require("../middleware/auth");
const router = express_1.Router();
/*
 * Gets all boards.
 */
router.get('/', getBoards);
function getBoards(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get board data.
            const data = yield resolvers.getBoards();
            // Send the response.
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    });
}
/*
 * Updates a board by ID.
 */
router.post('/:boardId', auth_1.auth, updateBoard);
function updateBoard(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const boardId = helpers.validateBoardId(req.params.boardId);
            const newBoardId = req.body.newBoardId;
            const title = req.body.title;
            if (!newBoardId && !title) {
                throw new globals_1.SafeError('Nothing to update', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            if (title) {
                // Validate the new board title.
                if (typeof title !== 'string') {
                    throw new globals_1.SafeError('Invalid board title', http_status_codes_1.StatusCodes.BAD_REQUEST);
                }
                if (title.length > 30) {
                    throw new globals_1.SafeError('Board title must be less than 30 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
                }
            }
            if (newBoardId) {
                // Validate the new board ID.
                if (typeof newBoardId !== 'string') {
                    throw new globals_1.SafeError('Invalid board ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
                }
                if (newBoardId.length > 4) {
                    throw new globals_1.SafeError('Board ID must be less than 4 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
                }
                // Assert that the new board ID is available.
                const boardIdTaken = !!(yield globals_1.prisma.board.findUnique({
                    where: {
                        id: newBoardId,
                    },
                }));
                if (boardIdTaken) {
                    throw new globals_1.SafeError('Board ID taken', http_status_codes_1.StatusCodes.CONFLICT);
                }
            }
            // Check permissions.
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const params = {
                updateBoardTitle: Boolean(title),
                updateBoardId: Boolean(newBoardId),
            };
            // Only the site owner can update a board ID. This requires a global logout,
            // since a user's JWT contains role objects pointing at board IDs.
            yield helpers.checkPermissions(userId, params, boardId, {
                default: client_1.PermissionLevel.ADMIN,
                updateBoardTitle: client_1.PermissionLevel.ADMIN,
                updateBoardId: client_1.PermissionLevel.OWNER,
            });
            // Update the board.
            yield resolvers.updateBoard({
                boardId,
                newBoardId,
                title,
            });
            // Send the response.
            res.status(200).end();
            // Add log entry.
            yield helpers.log('Updated board', userId, params);
        }
        catch (error) {
            next(error);
        }
    });
}
exports.default = router;
