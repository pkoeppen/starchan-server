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
var auth_1 = require("../middleware/auth");
var client_1 = require("@prisma/client");
var express_1 = require("express");
var http_status_codes_1 = require("http-status-codes");
var router = express_1.Router();
/*
 * Gets multiple reports.
 */
router.get('/', auth_1.auth, getReports);
function getReports(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var boardId, ipAddress, reports, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    boardId = req.query.boardId;
                    ipAddress = req.query.ipAddress;
                    return [4 /*yield*/, resolvers.getReports({ boardId: boardId, ipAddress: ipAddress })];
                case 1:
                    reports = _a.sent();
                    // Send the response.
                    res.status(200).json(reports);
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
 * Adds a new report.
 */
router.put('/', auth_1.recaptcha, auth_1.attach, addReport);
function addReport(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var postId, reason, post, boardId, threadId, ipAddress, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    postId = helpers.validatePostId(req.body.postId);
                    reason = helpers.validateReportReason(req.body.reason);
                    return [4 /*yield*/, globals_1.prisma.post.findUnique({
                            where: {
                                id: postId
                            },
                            select: {
                                threadId: true,
                                boardId: true,
                                rootThread: {
                                    select: {
                                        id: true
                                    }
                                }
                            }
                        })];
                case 1:
                    post = _b.sent();
                    if (!post) {
                        throw new globals_1.SafeError('Post not found', http_status_codes_1.StatusCodes.NOT_FOUND);
                    }
                    boardId = post.boardId;
                    threadId = (post.threadId || ((_a = post.rootThread) === null || _a === void 0 ? void 0 : _a.id));
                    ipAddress = req.ip;
                    // Add the report.
                    return [4 /*yield*/, resolvers.addReport({ postId: postId, threadId: threadId, boardId: boardId, reason: reason, ipAddress: ipAddress })];
                case 2:
                    // Add the report.
                    _b.sent();
                    // Send the response.
                    res.status(201).end();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _b.sent();
                    next(error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/*
 * Deletes a report by ID.
 */
router["delete"]('/:reportId', auth_1.auth, deleteReport);
function deleteReport(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var reportId, report, boardId, params, userId, deletedReport, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    reportId = helpers.validateReportId(req.params.reportId);
                    return [4 /*yield*/, globals_1.prisma.report.findUnique({
                            where: {
                                id: reportId
                            },
                            select: {
                                boardId: true
                            }
                        })];
                case 1:
                    report = _b.sent();
                    if (!report) {
                        throw new globals_1.SafeError('Report not found', http_status_codes_1.StatusCodes.NOT_FOUND);
                    }
                    boardId = report.boardId;
                    params = {
                        reportId: reportId
                    };
                    userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    return [4 /*yield*/, helpers.checkPermissions(userId, params, boardId, {
                            "default": client_1.PermissionLevel.MODERATOR
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, resolvers.deleteReport({ reportId: reportId })];
                case 3:
                    deletedReport = _b.sent();
                    // Send the response.
                    res.status(http_status_codes_1.StatusCodes.NO_CONTENT).end();
                    // Add log entry.
                    return [4 /*yield*/, helpers.log('Dismissed report', userId, deletedReport)];
                case 4:
                    // Add log entry.
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_3 = _b.sent();
                    next(error_3);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports["default"] = router;
//# sourceMappingURL=reports.js.map