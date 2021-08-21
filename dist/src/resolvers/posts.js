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
exports.deletePost = exports.addPost = void 0;
var globals_1 = require("../globals");
var helpers_1 = require("../helpers");
/*
 * Adds a post reply to the given thread.
 */
function addPost(params, files, includeSensitiveData) {
    if (includeSensitiveData === void 0) { includeSensitiveData = false; }
    return __awaiter(this, void 0, void 0, function () {
        var stat, postId, bodyMd, bodyHtml, references, _a, original, rendered, metadata, data, post, _i, references_1, id, error_1;
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
                    postId = stat.value;
                    if (!postId) {
                        throw new Error("Error incrementing post counter. prisma.stat.update() returned " + JSON.stringify(stat));
                    }
                    bodyMd = null;
                    bodyHtml = null;
                    references = null;
                    if (params.body) {
                        _a = helpers_1.render(params.body), original = _a.original, rendered = _a.rendered, metadata = _a.metadata;
                        bodyMd = original;
                        bodyHtml = rendered;
                        if (metadata.references) {
                            references = Array.from(metadata.references);
                        }
                    }
                    data = {
                        id: postId,
                        ipAddress: params.ipAddress,
                        name: params.name,
                        authorId: params.authorId,
                        tripcode: params.tripcode,
                        sage: params.sage,
                        bodyMd: bodyMd,
                        bodyHtml: bodyHtml,
                        bannedForThisPost: false,
                        rootPost: {
                            connect: {
                                id: params.threadId
                            }
                        },
                        thread: {
                            connect: {
                                id: params.threadId
                            }
                        },
                        board: {
                            connect: {
                                id: params.boardId
                            }
                        }
                    };
                    if (files === null || files === void 0 ? void 0 : files.length) {
                        data.files = {
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
                        };
                    }
                    if (params.userId) {
                        data.user = {
                            connect: {
                                id: params.userId
                            }
                        };
                    }
                    return [4 /*yield*/, globals_1.prisma.post.create({
                            data: data,
                            include: {
                                files: true,
                                referencedBy: {
                                    select: {
                                        id: true
                                    }
                                }
                            }
                        })];
                case 2:
                    post = (_b.sent());
                    if (!includeSensitiveData) {
                        // Delete ipAddress field.
                        delete post.ipAddress;
                    }
                    if (!!params.sage) return [3 /*break*/, 4];
                    // Bump the thread.
                    return [4 /*yield*/, globals_1.prisma.thread.update({
                            where: {
                                id: params.threadId
                            },
                            data: {
                                bumpedAt: new Date()
                            }
                        })];
                case 3:
                    // Bump the thread.
                    _b.sent();
                    _b.label = 4;
                case 4:
                    if (!references) return [3 /*break*/, 10];
                    _i = 0, references_1 = references;
                    _b.label = 5;
                case 5:
                    if (!(_i < references_1.length)) return [3 /*break*/, 10];
                    id = references_1[_i];
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 8, , 9]);
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
                case 7:
                    _b.sent();
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _b.sent();
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 5];
                case 10: return [2 /*return*/, post];
            }
        });
    });
}
exports.addPost = addPost;
/*
 * Deletes a post.
 */
function deletePost(params) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!params.deleteOnAllBoards) return [3 /*break*/, 2];
                    // Delete all posts by this IP across all boards.
                    return [4 /*yield*/, globals_1.prisma.post.deleteMany({
                            where: {
                                ipAddress: params.ipAddress
                            }
                        })];
                case 1:
                    // Delete all posts by this IP across all boards.
                    _a.sent();
                    globals_1.logger.debug("Deleted all posts by " + params.ipAddress);
                    return [3 /*break*/, 6];
                case 2:
                    if (!params.deleteOnBoard) return [3 /*break*/, 4];
                    // Delete all posts by this IP on the given board.
                    return [4 /*yield*/, globals_1.prisma.post.deleteMany({
                            where: {
                                ipAddress: params.ipAddress,
                                boardId: params.boardId
                            }
                        })];
                case 3:
                    // Delete all posts by this IP on the given board.
                    _a.sent();
                    globals_1.logger.debug("Deleted all posts by " + params.ipAddress + " on /" + params.boardId + "/");
                    return [3 /*break*/, 6];
                case 4: 
                // Delete one post.
                return [4 /*yield*/, globals_1.prisma.post["delete"]({
                        where: {
                            id: params.postId
                        }
                    })];
                case 5:
                    // Delete one post.
                    _a.sent();
                    globals_1.logger.debug("Deleted post " + params.postId);
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.deletePost = deletePost;
//# sourceMappingURL=posts.js.map