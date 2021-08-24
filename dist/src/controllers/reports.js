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
Object.defineProperty(exports, "__esModule", { value: true });
const helpers = __importStar(require("../helpers"));
const resolvers = __importStar(require("../resolvers"));
const globals_1 = require("../globals");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const router = express_1.Router();
/*
 * Gets multiple reports.
 */
router.get('/', auth_1.auth, getReports);
async function getReports(req, res, next) {
    try {
        const boardId = req.query.boardId;
        const ipAddress = req.query.ipAddress;
        // Fetch the reports.
        const reports = await resolvers.getReports({ boardId, ipAddress });
        // Send the response.
        res.status(200).json(reports);
    }
    catch (error) {
        next(error);
    }
}
/*
 * Adds a new report.
 */
router.put('/', auth_1.recaptcha, auth_1.attach, addReport);
async function addReport(req, res, next) {
    try {
        const postId = helpers.validatePostId(req.body.postId);
        const reason = helpers.validateReportReason(req.body.reason);
        // Assert post exists.
        const post = await globals_1.prisma.post.findUnique({
            where: {
                id: postId,
            },
            select: {
                threadId: true,
                boardId: true,
                rootThread: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        if (!post) {
            throw new globals_1.SafeError('Post not found', http_status_codes_1.StatusCodes.NOT_FOUND);
        }
        const boardId = post.boardId;
        const threadId = (post.threadId || post.rootThread?.id);
        const ipAddress = req.ip;
        // Add the report.
        await resolvers.addReport({ postId, threadId, boardId, reason, ipAddress });
        // Send the response.
        res.status(201).end();
    }
    catch (error) {
        next(error);
    }
}
/*
 * Deletes a report by ID.
 */
router.delete('/:reportId', auth_1.auth, deleteReport);
async function deleteReport(req, res, next) {
    try {
        const reportId = helpers.validateReportId(req.params.reportId);
        // Find the report.
        const report = await globals_1.prisma.report.findUnique({
            where: {
                id: reportId,
            },
            select: {
                boardId: true,
            },
        });
        if (!report) {
            throw new globals_1.SafeError('Report not found', http_status_codes_1.StatusCodes.NOT_FOUND);
        }
        const { boardId } = report;
        // Build params.
        const params = {
            reportId,
        };
        // Check permissions.
        const userId = req.user?.id;
        await helpers.checkPermissions(userId, params, boardId, {
            default: client_1.PermissionLevel.MODERATOR,
        });
        // Delete the report.
        const deletedReport = await resolvers.deleteReport({ reportId });
        // Send the response.
        res.status(http_status_codes_1.StatusCodes.NO_CONTENT).end();
        // Add log entry.
        await helpers.log('Dismissed report', userId, deletedReport);
    }
    catch (error) {
        next(error);
    }
}
exports.default = router;
