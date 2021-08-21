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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var helpers = __importStar(require("../helpers"));
var resolvers = __importStar(require("../resolvers"));
var globals_1 = require("../globals");
var client_1 = require("@prisma/client");
var express_1 = require("express");
var http_status_codes_1 = require("http-status-codes");
var auth_1 = require("../middleware/auth");
var router = express_1.Router();
/*
 * Gets all boards.
 */
router.get('/', getBoards);
function getBoards(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, resolvers.getBoards()];
                case 1:
                    data = _a.sent();
                    // Send the response.
                    res.json(data);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    next(error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/*
 * Updates a board by ID.
 */
router.post('/:boardId', auth_1.auth, updateBoard);
function updateBoard(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var boardId, newBoardId, title, boardIdTaken, userId, params, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    boardId = helpers.validateBoardId(req.params.boardId);
                    newBoardId = req.body.newBoardId;
                    title = req.body.title;
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
                    if (!newBoardId) return [3 /*break*/, 2];
                    // Validate the new board ID.
                    if (typeof newBoardId !== 'string') {
                        throw new globals_1.SafeError('Invalid board ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    if (newBoardId.length > 4) {
                        throw new globals_1.SafeError('Board ID must be less than 4 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    return [4 /*yield*/, globals_1.prisma.board.findUnique({
                            where: {
                                id: newBoardId
                            }
                        })];
                case 1:
                    boardIdTaken = !!(_b.sent());
                    if (boardIdTaken) {
                        throw new globals_1.SafeError('Board ID taken', http_status_codes_1.StatusCodes.CONFLICT);
                    }
                    _b.label = 2;
                case 2:
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    params = {
                        updateBoardTitle: Boolean(title),
                        updateBoardId: Boolean(newBoardId)
                    };
                    // Only the site owner can update a board ID. This requires a global logout,
                    // since a user's JWT contains role objects pointing at board IDs.
                    return [4 /*yield*/, helpers.checkPermissions(userId, params, boardId, {
                            "default": client_1.PermissionLevel.ADMIN,
                            updateBoardTitle: client_1.PermissionLevel.ADMIN,
                            updateBoardId: client_1.PermissionLevel.OWNER
                        })];
                case 3:
                    // Only the site owner can update a board ID. This requires a global logout,
                    // since a user's JWT contains role objects pointing at board IDs.
                    _b.sent();
                    // Update the board.
                    return [4 /*yield*/, resolvers.updateBoard({
                            boardId: boardId,
                            newBoardId: newBoardId,
                            title: title
                        })];
                case 4:
                    // Update the board.
                    _b.sent();
                    // Send the response.
                    res.status(200).end();
                    // Add log entry.
                    return [4 /*yield*/, helpers.log('Updated board', userId, params)];
                case 5:
                    // Add log entry.
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _b.sent();
                    next(error_2);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports["default"] = router;
//# sourceMappingURL=boards.js.map