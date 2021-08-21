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
var express_1 = require("express");
var http_status_codes_1 = require("http-status-codes");
var tripcode_1 = __importDefault(require("tripcode"));
var upload_1 = __importDefault(require("../middleware/upload"));
var router = express_1.Router();
/*
 * Gets mix of threads from all boards.
 */
router.get('/all', auth_1.attach, getAllThreads);
function getAllThreads(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var page, includeSensitiveData, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    page = req.query.page ? parseInt(req.query.page) : 1;
                    if (!page || page < 1 || page > 10) {
                        throw new globals_1.SafeError('Invalid page number', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    includeSensitiveData = !!req.user;
                    return [4 /*yield*/, resolvers.getAllThreadsByPage({ page: page }, includeSensitiveData)];
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
 * Gets multiple threads.
 */
router.get('/:boardId', auth_1.attach, getThreads);
function getThreads(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var boardId, data, sticky, latest, page, includeSensitiveData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    boardId = helpers.validateBoardId(req.params.boardId);
                    return [4 /*yield*/, helpers.assertBoardExists(boardId)];
                case 1:
                    _a.sent();
                    data = void 0;
                    sticky = req.query.sticky;
                    latest = req.query.latest;
                    if (!sticky) return [3 /*break*/, 3];
                    return [4 /*yield*/, resolvers.getStickyThreads({ boardId: boardId })];
                case 2:
                    // Get all sticky threads.
                    data = _a.sent();
                    return [2 /*return*/, res.json(data)];
                case 3:
                    if (!latest) return [3 /*break*/, 5];
                    return [4 /*yield*/, resolvers.getLatestThreads({ boardId: boardId })];
                case 4:
                    // Get latest threads.
                    data = _a.sent();
                    return [2 /*return*/, res.json(data)];
                case 5:
                    page = req.query.page ? parseInt(req.query.page) : 1;
                    if (!page || page < 1 || page > 10) {
                        throw new globals_1.SafeError('Invalid page number', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    includeSensitiveData = !!req.user;
                    return [4 /*yield*/, resolvers.getThreadsByPage({ boardId: boardId, page: page }, includeSensitiveData)];
                case 6:
                    data = _a.sent();
                    // Send the response.
                    res.json(data);
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    next(error_2);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
/*
 * Gets one thread and its posts.
 */
router.get('/:boardId/:threadId', auth_1.attach, getThread);
function getThread(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var boardId, threadId, includeSensitiveData, thread, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    boardId = helpers.validateBoardId(req.params.boardId);
                    threadId = helpers.validateThreadId(req.params.threadId);
                    includeSensitiveData = !!req.user;
                    return [4 /*yield*/, resolvers.getThread({ boardId: boardId, threadId: threadId }, includeSensitiveData)];
                case 1:
                    thread = _a.sent();
                    if (!thread) {
                        throw new globals_1.SafeError('Thread not found', http_status_codes_1.StatusCodes.NOT_FOUND);
                    }
                    // Update thread view count.
                    return [4 /*yield*/, resolvers.updateThread({ threadId: threadId }, { views: { increment: 1 } })];
                case 2:
                    // Update thread view count.
                    _a.sent();
                    thread.views++;
                    // Send the response.
                    res.json(thread);
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    next(error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/*
 * Adds a new thread.
 */
router.put('/:boardId', auth_1.recaptcha, upload_1["default"], auth_1.attach, addThread);
function addThread(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var boardId, title, body, files, ipAddress, userId, name, password, tripcode, params, includeSensitiveData, rootPost, error_4, error_5;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 8]);
                    boardId = helpers.validateBoardId(req.params.boardId);
                    return [4 /*yield*/, helpers.assertBoardExists(boardId)];
                case 1:
                    _c.sent();
                    title = helpers.validateThreadTitle(req.body.title);
                    body = helpers.validatePostBody(req.body.body);
                    if (!body) {
                        throw new globals_1.SafeError('Thread must have a body', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    files = req.files;
                    if (!(files === null || files === void 0 ? void 0 : files.length)) {
                        throw new globals_1.SafeError('Thread must have at least one file', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    ipAddress = req.ip;
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    name = req.body.name
                        ? helpers.validatePostName(req.body.name)
                        : 'Anonymous';
                    password = req.body.password
                        ? helpers.validatePostPassword(req.body.password)
                        : null;
                    tripcode = password ? tripcode_1["default"](ipAddress + password) : null;
                    params = {
                        userId: userId,
                        boardId: boardId,
                        title: title,
                        name: name,
                        ipAddress: ipAddress,
                        tripcode: tripcode,
                        body: body
                    };
                    includeSensitiveData = !!req.user;
                    return [4 /*yield*/, resolvers.addThread(params, files, includeSensitiveData)];
                case 2:
                    rootPost = _c.sent();
                    // Send the response.
                    res.status(201).json(rootPost);
                    return [3 /*break*/, 8];
                case 3:
                    error_4 = _c.sent();
                    if (!((_b = req.files) === null || _b === void 0 ? void 0 : _b.length)) return [3 /*break*/, 7];
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, helpers.removeFiles(req.files)];
                case 5:
                    _c.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_5 = _c.sent();
                    globals_1.logger.error("Error during rollback. Could not delete files. " + error_5);
                    return [3 /*break*/, 7];
                case 7:
                    next(error_4);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports["default"] = router;
//# sourceMappingURL=threads.js.map