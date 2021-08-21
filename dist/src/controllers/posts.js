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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var helpers = __importStar(require("../helpers"));
var resolvers = __importStar(require("../resolvers"));
var globals_1 = require("../globals");
var auth_1 = require("../middleware/auth");
var client_1 = require("@prisma/client");
var express_1 = require("express");
var http_status_codes_1 = require("http-status-codes");
var crypto_1 = __importDefault(require("crypto"));
var tripcode_1 = __importDefault(require("tripcode"));
var upload_1 = __importDefault(require("../middleware/upload"));
var router = express_1.Router();
/*
 * Resolves the URI of the given post ID.
 */
router.get('/resolve/:postId', resolvePostUri);
function resolvePostUri(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var postId, post, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    postId = helpers.validatePostId(req.params.postId);
                    return [4 /*yield*/, globals_1.prisma.post.findUnique({
                            where: {
                                id: postId
                            },
                            select: {
                                id: true,
                                boardId: true,
                                threadId: true
                            }
                        })];
                case 1:
                    post = _a.sent();
                    if (!post) {
                        throw new globals_1.SafeError('Post not found', http_status_codes_1.StatusCodes.NOT_FOUND);
                    }
                    // If post.threadId is null, that means this post is a thread root.
                    res
                        .status(200)
                        .send("/" + post.boardId + "/thread/" + (post.threadId || post.id) + "/#" + post.id);
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
 * Adds a post reply to the given thread.
 */
router.put('/', auth_1.recaptcha, upload_1["default"], auth_1.attach, addPost);
function addPost(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var threadId, body, files, thread, userId, boardId, sage, name, ipAddress, password, tripcode, authorId, params, post, error_2, error_3;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 8]);
                    threadId = helpers.validateThreadId(req.body.threadId);
                    body = req.body.body ? helpers.validatePostBody(req.body.body) : null;
                    files = req.files;
                    // Assert that the post has either text or files.
                    if (!body && !(files === null || files === void 0 ? void 0 : files.length)) {
                        throw new globals_1.SafeError('Post must have text or files', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    return [4 /*yield*/, globals_1.prisma.thread.findUnique({
                            where: { id: threadId }
                        })];
                case 1:
                    thread = _c.sent();
                    if (!thread) {
                        throw new globals_1.SafeError('Thread does not exist', http_status_codes_1.StatusCodes.NOT_FOUND);
                    }
                    if (thread.locked) {
                        throw new globals_1.SafeError('Thread is locked', http_status_codes_1.StatusCodes.LOCKED);
                    }
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    boardId = thread.boardId;
                    sage = Boolean(req.body.sage);
                    name = req.body.name
                        ? helpers.validatePostName(req.body.name)
                        : 'Anonymous';
                    ipAddress = req.ip;
                    password = req.body.password
                        ? helpers.validatePostPassword(req.body.password)
                        : null;
                    tripcode = password ? tripcode_1["default"](ipAddress + password) : null;
                    authorId = crypto_1["default"]
                        .createHash('sha256')
                        .update(ipAddress + threadId)
                        .digest('hex');
                    params = {
                        userId: userId,
                        threadId: threadId,
                        boardId: boardId,
                        sage: sage,
                        name: name,
                        ipAddress: ipAddress,
                        tripcode: tripcode,
                        authorId: authorId,
                        body: body
                    };
                    return [4 /*yield*/, resolvers.addPost(params, files)];
                case 2:
                    post = _c.sent();
                    // Send the response.
                    res.status(201).json(post);
                    return [3 /*break*/, 8];
                case 3:
                    error_2 = _c.sent();
                    if (!((_b = req.files) === null || _b === void 0 ? void 0 : _b.length)) return [3 /*break*/, 7];
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, helpers.removeFiles(req.files)];
                case 5:
                    _c.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _c.sent();
                    globals_1.logger.error("Error during rollback. Could not delete files. " + error_3);
                    return [3 /*break*/, 7];
                case 7:
                    next(error_2);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/*
 * Deletes a post by ID.
 */
router["delete"]('/:postId', auth_1.auth, deletePost);
function deletePost(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var postId, deleteOnBoard, deleteOnAllBoards, post, boardId, ipAddress, params, userId, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    postId = helpers.validatePostId(req.params.postId);
                    deleteOnBoard = Boolean(req.body.deleteOnBoard);
                    deleteOnAllBoards = Boolean(req.body.deleteOnAllBoards);
                    return [4 /*yield*/, globals_1.prisma.post.findUnique({
                            where: {
                                id: postId
                            }
                        })];
                case 1:
                    post = _b.sent();
                    if (!post) {
                        throw new globals_1.SafeError('Post not found', http_status_codes_1.StatusCodes.NOT_FOUND);
                    }
                    boardId = post.boardId, ipAddress = post.ipAddress;
                    params = {
                        postId: postId,
                        boardId: boardId,
                        ipAddress: ipAddress,
                        deleteOnBoard: deleteOnBoard,
                        deleteOnAllBoards: deleteOnAllBoards
                    };
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    return [4 /*yield*/, helpers.checkPermissions(userId, params, boardId, {
                            "default": client_1.PermissionLevel.MODERATOR,
                            deleteOnBoard: client_1.PermissionLevel.MODERATOR,
                            deleteOnAllBoards: client_1.PermissionLevel.ADMIN
                        })];
                case 2:
                    _b.sent();
                    // Delete the post.
                    return [4 /*yield*/, resolvers.deletePost(params)];
                case 3:
                    // Delete the post.
                    _b.sent();
                    // Send the response.
                    res.status(http_status_codes_1.StatusCodes.NO_CONTENT).end();
                    // Add log entry.
                    return [4 /*yield*/, helpers.log('Deleted post', userId, params)];
                case 4:
                    // Add log entry.
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _b.sent();
                    next(error_4);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports["default"] = router;
//# sourceMappingURL=posts.js.map