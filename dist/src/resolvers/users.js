"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getUsers = void 0;
const globals_1 = require("../globals");
/*
 * Gets multiple users.
 */
async function getUsers() {
    const users = await globals_1.prisma.user.findMany({
        orderBy: {
            username: 'asc',
        },
        select: {
            id: true,
            createdAt: true,
            username: true,
            roles: true,
        },
    });
    return users;
}
exports.getUsers = getUsers;
/*
 * Updates a user by ID.
 */
async function updateUser(params) {
    // Build update params.
    const updates = {};
    if (params.username) {
        updates.username = params.username;
    }
    // Update the user.
    await globals_1.prisma.user.update({
        where: {
            id: params.userId,
        },
        data: updates,
    });
}
exports.updateUser = updateUser;
