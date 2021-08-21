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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReport = exports.addReport = exports.getReports = void 0;
const globals_1 = require("../globals");
/*
 * Gets multiple reports.
 */
function getReports(params) {
    return __awaiter(this, void 0, void 0, function* () {
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
            query.where = Object.assign(Object.assign({}, query.where), { ipAddress: params.ipAddress });
        }
        // Fetch the reports.
        return globals_1.prisma.report.findMany(query);
    });
}
exports.getReports = getReports;
/*
 * Adds a new report.
 */
function addReport(params) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create the report.
        const report = yield globals_1.prisma.report.create({
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
    });
}
exports.addReport = addReport;
/*
 * Deletes a report.
 */
function deleteReport(params) {
    return __awaiter(this, void 0, void 0, function* () {
        // Delete the report.
        const deletedReport = yield globals_1.prisma.report.delete({
            where: {
                id: params.reportId,
            },
        });
        globals_1.logger.debug(`Deleted report ${params.reportId}`);
        return deletedReport;
    });
}
exports.deleteReport = deleteReport;
