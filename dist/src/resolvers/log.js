"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogEntries = void 0;
const globals_1 = require("../globals");
/*
 * Gets multiple log entries.
 */
async function getLogEntries() {
    const logEntries = await globals_1.prisma.logEntry.findMany({
        orderBy: {
            id: 'desc',
        },
        include: {
            user: {
                select: {
                    username: true,
                },
            },
        },
    });
    return logEntries;
}
exports.getLogEntries = getLogEntries;
