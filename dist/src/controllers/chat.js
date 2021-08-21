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
var globals_1 = require("../globals");
var auth_1 = require("../middleware/auth");
var express_1 = require("express");
var http_status_codes_1 = require("http-status-codes");
var crypto_1 = __importDefault(require("crypto"));
var router = express_1.Router();
var TEN_MINUTES = 60 * 10;
/*
 * Starts a new chat room with the given author ID.
 */
router.put('/', auth_1.recaptcha, auth_1.attach, startChat);
function startChat(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var ipAddress, authorId, threadId, boardId, message, post, partnerIpAddress, ipHash, partnerIpHash, myAuthorId, roomId, exists, multi, now, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    ipAddress = req.ip;
                    authorId = helpers.validateAuthorId(req.body.authorId);
                    threadId = helpers.validateThreadId(req.body.threadId);
                    boardId = helpers.validateBoardId(req.body.boardId);
                    message = req.body.message;
                    if (!message) {
                        throw new globals_1.SafeError('Missing message content', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    if (typeof message !== 'string') {
                        throw new globals_1.SafeError('Invalid message content', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    if (message.length > 250) {
                        throw new globals_1.SafeError('Message too long', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    return [4 /*yield*/, globals_1.prisma.post.findFirst({
                            where: {
                                authorId: authorId
                            }
                        })];
                case 1:
                    post = _a.sent();
                    if (!(post === null || post === void 0 ? void 0 : post.authorId)) {
                        throw new globals_1.SafeError('User has not posted in thread', http_status_codes_1.StatusCodes.FORBIDDEN);
                    }
                    partnerIpAddress = post.ipAddress;
                    if (ipAddress === partnerIpAddress) {
                        throw new globals_1.SafeError('Cannot start chat with self', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    ipHash = helpers.encrypt(ipAddress);
                    partnerIpHash = helpers.encrypt(partnerIpAddress);
                    myAuthorId = crypto_1["default"]
                        .createHash('sha256')
                        .update(ipAddress + threadId)
                        .digest('hex');
                    roomId = helpers
                        .encrypt([authorId, myAuthorId].sort().join(''))
                        .slice(-6);
                    return [4 /*yield*/, globals_1.redis.exists("room:" + roomId + ":data")];
                case 2:
                    exists = _a.sent();
                    multi = globals_1.redis.multi();
                    if (!exists) {
                        // Set room data.
                        multi.hmset("room:" + roomId + ":data", {
                            id: roomId,
                            boardId: boardId,
                            threadId: threadId
                        });
                        // Set my IP data.
                        multi.hmset("room:" + roomId + ":ip:" + ipHash + ":data", {
                            ipHash: ipHash,
                            authorId: myAuthorId
                        });
                        // Set partner's IP data.
                        multi.hmset("room:" + roomId + ":ip:" + partnerIpHash + ":data", {
                            ipHash: partnerIpHash,
                            authorId: authorId
                        });
                        // Set unread messages count.
                        multi.set("room:" + roomId + ":ip:" + ipHash + ":unread", 0);
                        multi.set("room:" + roomId + ":ip:" + partnerIpHash + ":unread", 0);
                    }
                    else {
                        multi.incr("room:" + roomId + ":ip:" + partnerIpHash + ":unread");
                    }
                    now = Date.now();
                    multi.hmset("room:" + roomId + ":message:" + now + ":data", {
                        from: myAuthorId,
                        content: message,
                        createdAt: now
                    });
                    // Expire all keys.
                    multi.expire("room:" + roomId + ":data", TEN_MINUTES);
                    multi.expire("room:" + roomId + ":ip:" + ipHash + ":data", TEN_MINUTES);
                    multi.expire("room:" + roomId + ":ip:" + partnerIpHash + ":data", TEN_MINUTES);
                    multi.expire("room:" + roomId + ":ip:" + ipHash + ":unread", TEN_MINUTES);
                    multi.expire("room:" + roomId + ":ip:" + partnerIpHash + ":unread", TEN_MINUTES);
                    multi.expire("room:" + roomId + ":message:" + now + ":data", TEN_MINUTES);
                    // Execute.
                    return [4 /*yield*/, multi.exec()];
                case 3:
                    // Execute.
                    _a.sent();
                    if (!exists) {
                        globals_1.logger.debug("Created room " + roomId + " between " + ipAddress + " and " + partnerIpAddress);
                    }
                    // Send the response.
                    res.status(exists ? http_status_codes_1.StatusCodes.OK : http_status_codes_1.StatusCodes.CREATED).json({ roomId: roomId });
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    next(error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports["default"] = router;
//# sourceMappingURL=chat.js.map