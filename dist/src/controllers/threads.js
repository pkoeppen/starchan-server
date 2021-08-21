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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers = __importStar(require("../helpers"));
const resolvers = __importStar(require("../resolvers"));
const globals_1 = require("../globals");
const auth_1 = require("../middleware/auth");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const tripcode_1 = __importDefault(require("tripcode"));
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.Router();
/*
 * Gets mix of threads from all boards.
 */
router.get('/all', auth_1.attach, getAllThreads);
function getAllThreads(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Validate 'page' query param.
            const page = req.query.page ? parseInt(req.query.page) : 1;
            if (!page || page < 1 || page > 10) {
                throw new globals_1.SafeError('Invalid page number', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Get thread data.
            const includeSensitiveData = !!req.user;
            const data = yield resolvers.getAllThreadsByPage({ page }, includeSensitiveData);
            // Send the response.
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    });
}
/*
 * Gets multiple threads.
 */
router.get('/:boardId', auth_1.attach, getThreads);
function getThreads(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const boardId = helpers.validateBoardId(req.params.boardId);
            yield helpers.assertBoardExists(boardId);
            let data;
            const sticky = req.query.sticky;
            const latest = req.query.latest;
            if (sticky) {
                // Get all sticky threads.
                data = yield resolvers.getStickyThreads({ boardId });
                return res.json(data);
            }
            else if (latest) {
                // Get latest threads.
                data = yield resolvers.getLatestThreads({ boardId });
                return res.json(data);
            }
            // Validate 'page' query param.
            const page = req.query.page ? parseInt(req.query.page) : 1;
            if (!page || page < 1 || page > 10) {
                throw new globals_1.SafeError('Invalid page number', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Get thread data.
            const includeSensitiveData = !!req.user;
            data = yield resolvers.getThreadsByPage({ boardId, page }, includeSensitiveData);
            // Send the response.
            res.json(data);
        }
        catch (error) {
            next(error);
        }
    });
}
/*
 * Gets one thread and its posts.
 */
router.get('/:boardId/:threadId', auth_1.attach, getThread);
function getThread(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const boardId = helpers.validateBoardId(req.params.boardId);
            const threadId = helpers.validateThreadId(req.params.threadId);
            // Get thread data.
            const includeSensitiveData = !!req.user;
            const thread = yield resolvers.getThread({ boardId, threadId }, includeSensitiveData);
            if (!thread) {
                throw new globals_1.SafeError('Thread not found', http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            // Update thread view count.
            yield resolvers.updateThread({ threadId }, { views: { increment: 1 } });
            thread.views++;
            // Send the response.
            res.json(thread);
        }
        catch (error) {
            next(error);
        }
    });
}
/*
 * Adds a new thread.
 */
router.put('/:boardId', auth_1.recaptcha, upload_1.default, auth_1.attach, addThread);
function addThread(req, res, next) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const boardId = helpers.validateBoardId(req.params.boardId);
            yield helpers.assertBoardExists(boardId);
            const title = helpers.validateThreadTitle(req.body.title);
            const body = helpers.validatePostBody(req.body.body);
            if (!body) {
                throw new globals_1.SafeError('Thread must have a body', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Assert thread has at least one file.
            const files = req.files;
            if (!(files === null || files === void 0 ? void 0 : files.length)) {
                throw new globals_1.SafeError('Thread must have at least one file', http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            // Prepare the data.
            const ipAddress = req.ip;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const name = req.body.name
                ? helpers.validatePostName(req.body.name)
                : 'Anonymous';
            const password = req.body.password
                ? helpers.validatePostPassword(req.body.password)
                : null;
            const tripcode = password ? tripcode_1.default(ipAddress + password) : null;
            // Build params.
            const params = {
                userId,
                boardId,
                title,
                name,
                ipAddress,
                tripcode,
                body,
            };
            // Add the thread.
            const includeSensitiveData = !!req.user;
            const rootPost = yield resolvers.addThread(params, files, includeSensitiveData);
            // Send the response.
            res.status(201).json(rootPost);
        }
        catch (error) {
            // Rollback.
            if ((_b = req.files) === null || _b === void 0 ? void 0 : _b.length) {
                try {
                    yield helpers.removeFiles(req.files);
                }
                catch (error) {
                    globals_1.logger.error(`Error during rollback. Could not delete files. ${error}`);
                }
            }
            next(error);
        }
    });
}
exports.default = router;
