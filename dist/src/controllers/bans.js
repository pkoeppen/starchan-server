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
 * Gets multiple bans.
 */
router.get('/', auth_1.auth, getBans);
function getBans(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const boardId = req.query.boardId;
            const ipAddress = req.query.ipAddress;
            // Fetch the bans.
            const bans = yield resolvers.getBans({ boardId, ipAddress });
            // Send the response.
            res.status(200).json(bans);
        }
        catch (error) {
            next(error);
        }
    });
}
/*
 * Adds a new ban.
 */
router.put('/', auth_1.auth, addBan);
function addBan(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Validate IP address.
            const ipAddress = helpers.validateIpAddress(req.body.ipAddress);
            // Validate ban duration.
            const duration = parseInt(req.body.duration || 0);
            if (isNaN(duration)) {
                throw new globals_1.SafeError('Invalid ban duration', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            if (duration < 0) {
                throw new globals_1.SafeError('Ban duration must be greater than zero', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            if (duration > 365) {
                throw new globals_1.SafeError('Ban duration must be less than one year', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Validate ban reason.
            const reason = req.body.reason || null;
            if (reason && typeof reason !== 'string') {
                throw new globals_1.SafeError('Invalid ban reason', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            if (reason.length > 100) {
                throw new globals_1.SafeError('Ban reason must be less than 100 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Validate post ID.
            const postId = req.body.postId
                ? helpers.validatePostId(req.body.postId)
                : null;
            // Validate board ID.
            const boardId = req.body.boardId
                ? helpers.validateBoardId(req.body.boardId)
                : null;
            // Get other fields.
            const universal = Boolean(req.body.universal);
            const deletePost = Boolean(req.body.deletePost);
            const deleteOnBoard = Boolean(req.body.deleteOnBoard);
            const deleteOnAllBoards = Boolean(req.body.deleteOnAllBoards);
            if (!universal && !boardId) {
                throw new globals_1.SafeError('Non-universal bans must specify a board ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            if (deleteOnBoard && !boardId) {
                throw new globals_1.SafeError('"Delete on board" option must specify a board ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            if (deletePost && !postId) {
                throw new globals_1.SafeError('"Delete post" option must specify a post ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Build params.
            const params = {
                userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                ipAddress,
                duration,
                reason,
                postId,
                boardId,
                universal,
                deletePost,
                deleteOnBoard,
                deleteOnAllBoards,
            };
            // Check permissions.
            yield helpers.checkPermissions(params.userId, params, boardId, {
                default: client_1.PermissionLevel.MODERATOR,
                deletePost: client_1.PermissionLevel.MODERATOR,
                deleteOnBoard: client_1.PermissionLevel.MODERATOR,
                deleteOnAllBoards: client_1.PermissionLevel.ADMIN,
                universal: client_1.PermissionLevel.ADMIN,
            });
            // Add the ban.
            yield resolvers.addBan(params);
            // Send the response.
            res.status(201).end();
            // Add log entry.
            yield helpers.log('Banned IP', (_b = req.user) === null || _b === void 0 ? void 0 : _b.id, params);
        }
        catch (error) {
            next(error);
        }
    });
}
/*
 * Deletes a ban by ID.
 */
router.delete('/:banId', auth_1.auth, deleteBan);
function deleteBan(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const banId = helpers.validateBanId(req.params.banId);
            // Find the ban.
            const ban = yield globals_1.prisma.ban.findUnique({
                where: {
                    id: banId,
                },
            });
            if (!ban) {
                throw new globals_1.SafeError('Ban not found', http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            // Check permissions.
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const params = {
                liftUniversalBan: ban.universal,
            };
            // Any admin can lift a universal ban. If the ban is not universal, the user
            // must be at least a moderator on the board for which the ban was created.
            const boardId = params.liftUniversalBan ? null : ban.boardId;
            yield helpers.checkPermissions(userId, params, boardId, {
                default: client_1.PermissionLevel.MODERATOR,
                liftUniversalBan: client_1.PermissionLevel.ADMIN,
            });
            // Delete the ban.
            const deletedBan = yield resolvers.deleteBan({ banId });
            // Send the response.
            res.status(http_status_codes_1.StatusCodes.NO_CONTENT).end();
            // Add log entry.
            yield helpers.log('Lifted ban', (_b = req.user) === null || _b === void 0 ? void 0 : _b.id, deletedBan);
        }
        catch (error) {
            next(error);
        }
    });
}
exports.default = router;
