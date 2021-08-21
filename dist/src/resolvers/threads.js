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
exports.addThread = exports.updateThread = exports.getThread = exports.getLatestThreads = exports.getStickyThreads = exports.getAllThreadsByPage = exports.getThreadsByPage = void 0;
var helpers = __importStar(require("../helpers"));
var client_1 = require("@prisma/client");
var globals_1 = require("../globals");
var crypto_1 = __importDefault(require("crypto"));
/*
 * Gets multiple threads.
 */
function getThreadsByPage(params, includeSensitiveData) {
    if (includeSensitiveData === void 0) { includeSensitiveData = false; }
    return __awaiter(this, void 0, void 0, function () {
        var skip, postSelectParams, threads;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    skip = (params.page - 1) * 10;
                    postSelectParams = getPostSelectParams(includeSensitiveData, params.boardId);
                    return [4 /*yield*/, globals_1.prisma.thread.findMany({
                            where: { boardId: params.boardId },
                            orderBy: [
                                {
                                    sticky: 'desc'
                                },
                                {
                                    bumpedAt: 'desc'
                                },
                            ],
                            skip: skip,
                            take: 10,
                            include: {
                                rootPost: {
                                    select: postSelectParams
                                },
                                _count: {
                                    select: { posts: true }
                                }
                            }
                        })];
                case 1:
                    threads = _a.sent();
                    return [2 /*return*/, threads];
            }
        });
    });
}
exports.getThreadsByPage = getThreadsByPage;
/*
 * Gets mix of threads from all boards.
 */
function getAllThreadsByPage(params, includeSensitiveData) {
    if (includeSensitiveData === void 0) { includeSensitiveData = false; }
    return __awaiter(this, void 0, void 0, function () {
        var skip, postSelectParams, threads;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    skip = (params.page - 1) * 10;
                    postSelectParams = getPostSelectParams(includeSensitiveData);
                    return [4 /*yield*/, globals_1.prisma.thread.findMany({
                            orderBy: {
                                bumpedAt: 'desc'
                            },
                            skip: skip,
                            take: 10,
                            include: {
                                rootPost: {
                                    select: postSelectParams
                                },
                                _count: {
                                    select: { posts: true }
                                }
                            }
                        })];
                case 1:
                    threads = _a.sent();
                    return [2 /*return*/, threads];
            }
        });
    });
}
exports.getAllThreadsByPage = getAllThreadsByPage;
/*
 * Gets all sticky threads.
 */
function getStickyThreads(params) {
    return __awaiter(this, void 0, void 0, function () {
        var threads;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, globals_1.prisma.thread.findMany({
                        where: {
                            boardId: params.boardId,
                            sticky: true
                        },
                        orderBy: {
                            id: 'desc'
                        }
                    })];
                case 1:
                    threads = _a.sent();
                    return [2 /*return*/, threads];
            }
        });
    });
}
exports.getStickyThreads = getStickyThreads;
/*
 * Gets latest 10 threads.
 */
function getLatestThreads(params) {
    return __awaiter(this, void 0, void 0, function () {
        var threads;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, globals_1.prisma.thread.findMany({
                        where: {
                            boardId: params.boardId
                        },
                        orderBy: {
                            bumpedAt: 'desc'
                        },
                        take: 10
                    })];
                case 1:
                    threads = _a.sent();
                    return [2 /*return*/, threads];
            }
        });
    });
}
exports.getLatestThreads = getLatestThreads;
/*
 * Gets one thread.
 */
function getThread(params, includeSensitiveData) {
    if (includeSensitiveData === void 0) { includeSensitiveData = false; }
    return __awaiter(this, void 0, void 0, function () {
        var postSelectParams, thread;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postSelectParams = getPostSelectParams(includeSensitiveData, params.boardId);
                    return [4 /*yield*/, globals_1.prisma.thread.findUnique({
                            where: { id: params.threadId },
                            include: {
                                rootPost: {
                                    select: postSelectParams
                                },
                                posts: {
                                    orderBy: {
                                        id: 'asc'
                                    },
                                    select: postSelectParams
                                },
                                _count: {
                                    select: { posts: true }
                                }
                            }
                        })];
                case 1:
                    thread = _a.sent();
                    return [2 /*return*/, thread];
            }
        });
    });
}
exports.getThread = getThread;
/*
 * Updates a thread.
 */
function updateThread(params, data) {
    return __awaiter(this, void 0, void 0, function () {
        var thread;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, globals_1.prisma.thread.update({
                        where: { id: params.threadId },
                        data: data
                    })];
                case 1:
                    thread = _a.sent();
                    globals_1.logger.debug("Updated thread " + params.threadId);
                    return [2 /*return*/, thread];
            }
        });
    });
}
exports.updateThread = updateThread;
/*
 * Adds a new thread.
 */
function addThread(params, files, includeSensitiveData) {
    if (includeSensitiveData === void 0) { includeSensitiveData = false; }
    return __awaiter(this, void 0, void 0, function () {
        var stat, rootPostId, authorId, _a, bodyMd, bodyHtml, metadata, references, data, post, _i, references_1, id, error_1, threads, lastThread, count;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, globals_1.prisma.stat.update({
                        where: {
                            key: 'PostCount'
                        },
                        data: {
                            value: {
                                increment: 1
                            }
                        }
                    })];
                case 1:
                    stat = _b.sent();
                    rootPostId = stat.value;
                    if (!rootPostId) {
                        throw new Error("Error incrementing post counter. prisma.stat.update() returned " + JSON.stringify(stat));
                    }
                    authorId = crypto_1["default"]
                        .createHash('sha256')
                        .update(params.ipAddress + rootPostId)
                        .digest('hex');
                    _a = helpers.render(params.body), bodyMd = _a.original, bodyHtml = _a.rendered, metadata = _a.metadata;
                    references = metadata.references
                        ? Array.from(metadata.references)
                        : null;
                    data = {
                        id: rootPostId,
                        ipAddress: params.ipAddress,
                        name: params.name,
                        authorId: authorId,
                        tripcode: params.tripcode,
                        bodyMd: bodyMd,
                        bodyHtml: bodyHtml,
                        bannedForThisPost: false,
                        board: {
                            connect: {
                                id: params.boardId
                            }
                        },
                        files: {
                            connectOrCreate: files.map(function (file) {
                                return {
                                    where: {
                                        id: file.id
                                    },
                                    create: {
                                        id: file.id,
                                        size: file.size,
                                        filename: file.filename,
                                        mimetype: file.mimetype,
                                        nsfw: file.nsfw
                                    }
                                };
                            })
                        }
                    };
                    if (params.userId) {
                        data.user = {
                            connect: {
                                id: params.userId
                            }
                        };
                    }
                    return [4 /*yield*/, globals_1.prisma.post.create({
                            data: data,
                            select: {
                                id: true,
                                thread: {
                                    select: {
                                        boardId: true
                                    }
                                }
                            }
                        })];
                case 2:
                    post = (_b.sent());
                    // Create the thread.
                    return [4 /*yield*/, globals_1.prisma.thread.create({
                            data: {
                                id: rootPostId,
                                title: params.title,
                                bumpedAt: new Date(),
                                rootPost: {
                                    connect: {
                                        id: rootPostId
                                    }
                                },
                                board: {
                                    connect: {
                                        id: params.boardId
                                    }
                                }
                            }
                        })];
                case 3:
                    // Create the thread.
                    _b.sent();
                    if (!includeSensitiveData) {
                        // Delete ipAddress field.
                        delete post.ipAddress;
                    }
                    if (!references) return [3 /*break*/, 9];
                    _i = 0, references_1 = references;
                    _b.label = 4;
                case 4:
                    if (!(_i < references_1.length)) return [3 /*break*/, 9];
                    id = references_1[_i];
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, globals_1.prisma.post.update({
                            where: {
                                id: post.id
                            },
                            data: {
                                references: {
                                    connect: [{ id: id }]
                                }
                            }
                        })];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 4];
                case 9:
                    globals_1.logger.debug("Created new thread " + post.id);
                    return [4 /*yield*/, globals_1.prisma.thread.findMany({
                            where: {
                                boardId: params.boardId,
                                archived: false
                            },
                            select: {
                                bumpedAt: true
                            },
                            orderBy: [
                                {
                                    sticky: 'desc'
                                },
                                {
                                    bumpedAt: 'desc'
                                },
                            ],
                            skip: 99,
                            take: 1
                        })];
                case 10:
                    threads = _b.sent();
                    if (!threads.length) return [3 /*break*/, 12];
                    lastThread = threads[0];
                    return [4 /*yield*/, globals_1.prisma.thread.deleteMany({
                            where: {
                                archived: false,
                                sticky: false,
                                bumpedAt: {
                                    lt: lastThread.bumpedAt
                                }
                            }
                        })];
                case 11:
                    count = (_b.sent()).count;
                    globals_1.logger.debug("Trimmed " + count + " threads");
                    _b.label = 12;
                case 12: return [2 /*return*/, post];
            }
        });
    });
}
exports.addThread = addThread;
/*
 * Builds post select parameters.
 */
function getPostSelectParams(includeSensitiveData, boardId) {
    if (includeSensitiveData === void 0) { includeSensitiveData = false; }
    var postSelectParams = {
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
                id: true
            }
        },
        user: {
            select: {
                username: true
            }
        }
    };
    if (includeSensitiveData) {
        postSelectParams.ipAddress = true;
    }
    if (boardId) {
        // If this post was created by a mod of this board, select the roles.
        // This will be used to display the moderator tag on the front end.
        postSelectParams.user.select.roles = {
            where: {
                OR: [{ boardId: boardId }, { level: client_1.PermissionLevel.OWNER }]
            },
            select: {
                level: true,
                boardId: true
            }
        };
    }
    return postSelectParams;
}
//# sourceMappingURL=threads.js.map