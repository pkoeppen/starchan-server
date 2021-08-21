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
 * Gets multiple bans.
 */
router.get('/', auth_1.auth, getBans);
function getBans(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var boardId, ipAddress, bans, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    boardId = req.query.boardId;
                    ipAddress = req.query.ipAddress;
                    return [4 /*yield*/, resolvers.getBans({ boardId: boardId, ipAddress: ipAddress })];
                case 1:
                    bans = _a.sent();
                    // Send the response.
                    res.status(200).json(bans);
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
 * Adds a new ban.
 */
router.put('/', auth_1.auth, addBan);
function addBan(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var ipAddress, duration, reason, postId, boardId, universal, deletePost, deleteOnBoard, deleteOnAllBoards, params, error_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    ipAddress = helpers.validateIpAddress(req.body.ipAddress);
                    duration = parseInt(req.body.duration || 0);
                    if (isNaN(duration)) {
                        throw new globals_1.SafeError('Invalid ban duration', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    if (duration < 0) {
                        throw new globals_1.SafeError('Ban duration must be greater than zero', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    if (duration > 365) {
                        throw new globals_1.SafeError('Ban duration must be less than one year', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    reason = req.body.reason || null;
                    if (reason && typeof reason !== 'string') {
                        throw new globals_1.SafeError('Invalid ban reason', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    if (reason.length > 100) {
                        throw new globals_1.SafeError('Ban reason must be less than 100 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    postId = req.body.postId
                        ? helpers.validatePostId(req.body.postId)
                        : null;
                    boardId = req.body.boardId
                        ? helpers.validateBoardId(req.body.boardId)
                        : null;
                    universal = Boolean(req.body.universal);
                    deletePost = Boolean(req.body.deletePost);
                    deleteOnBoard = Boolean(req.body.deleteOnBoard);
                    deleteOnAllBoards = Boolean(req.body.deleteOnAllBoards);
                    if (!universal && !boardId) {
                        throw new globals_1.SafeError('Non-universal bans must specify a board ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    if (deleteOnBoard && !boardId) {
                        throw new globals_1.SafeError('"Delete on board" option must specify a board ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    if (deletePost && !postId) {
                        throw new globals_1.SafeError('"Delete post" option must specify a post ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    params = {
                        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                        ipAddress: ipAddress,
                        duration: duration,
                        reason: reason,
                        postId: postId,
                        boardId: boardId,
                        universal: universal,
                        deletePost: deletePost,
                        deleteOnBoard: deleteOnBoard,
                        deleteOnAllBoards: deleteOnAllBoards
                    };
                    // Check permissions.
                    return [4 /*yield*/, helpers.checkPermissions(params.userId, params, boardId, {
                            "default": client_1.PermissionLevel.MODERATOR,
                            deletePost: client_1.PermissionLevel.MODERATOR,
                            deleteOnBoard: client_1.PermissionLevel.MODERATOR,
                            deleteOnAllBoards: client_1.PermissionLevel.ADMIN,
                            universal: client_1.PermissionLevel.ADMIN
                        })];
                case 1:
                    // Check permissions.
                    _c.sent();
                    // Add the ban.
                    return [4 /*yield*/, resolvers.addBan(params)];
                case 2:
                    // Add the ban.
                    _c.sent();
                    // Send the response.
                    res.status(201).end();
                    // Add log entry.
                    return [4 /*yield*/, helpers.log('Banned IP', (_b = req.user) === null || _b === void 0 ? void 0 : _b.id, params)];
                case 3:
                    // Add log entry.
                    _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _c.sent();
                    next(error_2);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/*
 * Deletes a ban by ID.
 */
router["delete"]('/:banId', auth_1.auth, deleteBan);
function deleteBan(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var banId, ban, userId, params, boardId, deletedBan, error_3;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    banId = helpers.validateBanId(req.params.banId);
                    return [4 /*yield*/, globals_1.prisma.ban.findUnique({
                            where: {
                                id: banId
                            }
                        })];
                case 1:
                    ban = _c.sent();
                    if (!ban) {
                        throw new globals_1.SafeError('Ban not found', http_status_codes_1.StatusCodes.NOT_FOUND);
                    }
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    params = {
                        liftUniversalBan: ban.universal
                    };
                    boardId = params.liftUniversalBan ? null : ban.boardId;
                    return [4 /*yield*/, helpers.checkPermissions(userId, params, boardId, {
                            "default": client_1.PermissionLevel.MODERATOR,
                            liftUniversalBan: client_1.PermissionLevel.ADMIN
                        })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, resolvers.deleteBan({ banId: banId })];
                case 3:
                    deletedBan = _c.sent();
                    // Send the response.
                    res.status(http_status_codes_1.StatusCodes.NO_CONTENT).end();
                    // Add log entry.
                    return [4 /*yield*/, helpers.log('Lifted ban', (_b = req.user) === null || _b === void 0 ? void 0 : _b.id, deletedBan)];
                case 4:
                    // Add log entry.
                    _c.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_3 = _c.sent();
                    next(error_3);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports["default"] = router;
//# sourceMappingURL=bans.js.map