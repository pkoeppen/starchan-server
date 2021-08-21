"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.deleteBan = exports.addBan = exports.getBans = void 0;
var globals_1 = require("../globals");
/*
 * Gets multiple bans.
 */
function getBans(params) {
    return __awaiter(this, void 0, void 0, function () {
        var query;
        return __generator(this, function (_a) {
            query = {
                orderBy: {
                    createdAt: 'desc'
                }
            };
            if (params.boardId) {
                query.where = { boardId: params.boardId };
            }
            if (params.ipAddress) {
                query.where = __assign(__assign({}, query.where), { ipAddress: params.ipAddress });
            }
            // Fetch the bans.
            return [2 /*return*/, globals_1.prisma.ban.findMany(query)];
        });
    });
}
exports.getBans = getBans;
/*
 * Adds a new ban.
 */
function addBan(params) {
    return __awaiter(this, void 0, void 0, function () {
        var ban;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, globals_1.prisma.ban.create({
                        data: {
                            userId: params.userId,
                            ipAddress: params.ipAddress,
                            duration: params.duration,
                            reason: params.reason,
                            postId: params.postId,
                            boardId: params.boardId,
                            universal: params.universal
                        }
                    })];
                case 1:
                    ban = _a.sent();
                    globals_1.logger.debug("Created ban " + ban.id + " for IP " + ban.ipAddress);
                    if (!params.deleteOnAllBoards) return [3 /*break*/, 3];
                    // Delete all posts by this IP across all boards.
                    return [4 /*yield*/, globals_1.prisma.post.deleteMany({
                            where: {
                                ipAddress: params.ipAddress
                            }
                        })];
                case 2:
                    // Delete all posts by this IP across all boards.
                    _a.sent();
                    globals_1.logger.debug("Deleted all posts by " + params.ipAddress);
                    return [3 /*break*/, 9];
                case 3:
                    if (!(params.deleteOnBoard && params.boardId)) return [3 /*break*/, 5];
                    // Delete all posts by this IP on the given board.
                    return [4 /*yield*/, globals_1.prisma.post.deleteMany({
                            where: {
                                ipAddress: params.ipAddress,
                                boardId: params.boardId
                            }
                        })];
                case 4:
                    // Delete all posts by this IP on the given board.
                    _a.sent();
                    globals_1.logger.debug("Deleted all posts by " + params.ipAddress + " on /" + params.boardId + "/");
                    return [3 /*break*/, 9];
                case 5:
                    if (!(params.deletePost && params.postId)) return [3 /*break*/, 7];
                    // Delete one post.
                    return [4 /*yield*/, globals_1.prisma.post["delete"]({
                            where: {
                                id: params.postId
                            }
                        })];
                case 6:
                    // Delete one post.
                    _a.sent();
                    globals_1.logger.debug("Deleted post " + params.postId);
                    return [3 /*break*/, 9];
                case 7:
                    if (!params.postId) return [3 /*break*/, 9];
                    // Mark post as "banned for this post".
                    return [4 /*yield*/, globals_1.prisma.post.update({
                            where: {
                                id: params.postId
                            },
                            data: {
                                bannedForThisPost: true
                            }
                        })];
                case 8:
                    // Mark post as "banned for this post".
                    _a.sent();
                    globals_1.logger.debug("Marked post " + params.postId + " as \"banned for this post\"");
                    _a.label = 9;
                case 9: return [2 /*return*/];
            }
        });
    });
}
exports.addBan = addBan;
/*
 * Deletes a ban.
 */
function deleteBan(params) {
    return __awaiter(this, void 0, void 0, function () {
        var deletedBan;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, globals_1.prisma.ban["delete"]({
                        where: {
                            id: params.banId
                        }
                    })];
                case 1:
                    deletedBan = _a.sent();
                    globals_1.logger.debug("Deleted ban " + deletedBan.id);
                    return [2 /*return*/, deletedBan];
            }
        });
    });
}
exports.deleteBan = deleteBan;
//# sourceMappingURL=bans.js.map