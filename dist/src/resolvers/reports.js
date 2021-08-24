"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReport = exports.addReport = exports.getReports = void 0;
const globals_1 = require("../globals");
/*
 * Gets multiple reports.
 */
async function getReports(params) {
    // Build the query.
    const query = {
        orderBy: {
            createdAt: 'desc',
        },
    };
    if (params.boardId) {
        query.where = { boardId: params.boardId };
    }
    if (params.ipAddress) {
        query.where = { ...query.where, ipAddress: params.ipAddress };
    }
    // Fetch the reports.
    return globals_1.prisma.report.findMany(query);
}
exports.getReports = getReports;
/*
 * Adds a new report.
 */
async function addReport(params) {
    // Create the report.
    const report = await globals_1.prisma.report.create({
        data: {
            reason: params.reason,
            ipAddress: params.ipAddress,
            post: {
                connect: {
                    id: params.postId,
                },
            },
            thread: {
                connect: {
                    id: params.threadId,
                },
            },
            board: {
                connect: {
                    id: params.boardId,
                },
            },
        },
    });
    globals_1.logger.debug(`Created report ${report.id} on post ${report.postId}`);
}
exports.addReport = addReport;
/*
 * Deletes a report.
 */
async function deleteReport(params) {
    // Delete the report.
    const deletedReport = await globals_1.prisma.report.delete({
        where: {
            id: params.reportId,
        },
    });
    globals_1.logger.debug(`Deleted report ${params.reportId}`);
    return deletedReport;
}
exports.deleteReport = deleteReport;
