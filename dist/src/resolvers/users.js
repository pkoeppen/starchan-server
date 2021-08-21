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
exports.updateUser = exports.getUsers = void 0;
const globals_1 = require("../globals");
/*
 * Gets multiple users.
 */
function getUsers() {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield globals_1.prisma.user.findMany({
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
    });
}
exports.getUsers = getUsers;
/*
 * Updates a user by ID.
 */
function updateUser(params) {
    return __awaiter(this, void 0, void 0, function* () {
        // Build update params.
        const updates = {};
        if (params.username) {
            updates.username = params.username;
        }
        // Update the user.
        yield globals_1.prisma.user.update({
            where: {
                id: params.userId,
            },
            data: updates,
        });
    });
}
exports.updateUser = updateUser;
