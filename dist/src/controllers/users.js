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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers = __importStar(require("../helpers"));
const resolvers = __importStar(require("../resolvers"));
const globals_1 = require("../globals");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const express_1 = require("express");
const http_status_codes_1 = require("http-status-codes");
const lodash_1 = __importDefault(require("lodash"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const router = express_1.Router();
/*
 * Logs a user in.
 */
router.post('/login', auth_1.recaptcha, logIn);
async function logIn(req, res, next) {
    passport_1.default.authenticate('local', async (error, user, message, status) => {
        if (error) {
            return next(error);
        }
        if (!user) {
            return next(new globals_1.SafeError(message || 'Unknown error', status || http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        req.login(user, { session: false }, async (error) => {
            if (error) {
                return next(error);
            }
            const userClean = lodash_1.default.pick(user, ['id', 'username', 'email', 'roles']);
            const duration = 4 * 60 * 60 * 1000; // 4 hours.
            const expires = Date.now() + duration;
            const token = jsonwebtoken_1.default.sign({ expires, user: userClean }, process.env.JWT_SECRET);
            const cookieOptions = {
                httpOnly: false,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                domain: 'local.starchan.org',
                path: '/',
                maxAge: duration,
            };
            // Set cookies.
            res.cookie('token', token, cookieOptions);
            res.cookie('expires', expires.toString(), cookieOptions);
            res.cookie('user', JSON.stringify(userClean), cookieOptions);
            res.status(http_status_codes_1.StatusCodes.OK).send({ token, expires, user: userClean });
            // Add log entry.
            await helpers.log('Logged in', req.user?.id, null);
        });
    })(req, res, next);
}
/*
 * Logs a user out.
 */
router.post('/logout', auth_1.auth, logout);
async function logout(req, res, next) {
    try {
        const jwt = req.headers.jwt;
        const tokenExpiry = req.user?.expires;
        await helpers.blacklistJwt(jwt, tokenExpiry);
        req.logout();
        res.status(http_status_codes_1.StatusCodes.OK).end();
    }
    catch (error) {
        next(error);
    }
}
/*
 * Gets all users.
 */
router.get('/', auth_1.auth, getUsers);
async function getUsers(req, res, next) {
    try {
        // Get users.
        const users = await resolvers.getUsers();
        res.json(users);
    }
    catch (error) {
        next(error);
    }
}
/*
 * Updates a user by ID.
 */
router.post('/:userId', auth_1.auth, updateUser);
async function updateUser(req, res, next) {
    try {
        const userId = req.params.userId;
        const username = req.body.username
            ? helpers.validateUsername(req.body.username)
            : null;
        if (!username) {
            throw new globals_1.SafeError('Nothing to update', http_status_codes_1.StatusCodes.BAD_REQUEST);
        }
        if (username) {
            // Assert that the new username is available.
            const usernameTaken = !!(await globals_1.prisma.user.findUnique({
                where: {
                    username,
                },
            }));
            if (usernameTaken) {
                throw new globals_1.SafeError('Username taken', http_status_codes_1.StatusCodes.CONFLICT);
            }
        }
        // Update the user.
        const params = { userId, username };
        // Check permissions.
        const reqUserId = req.user?.id;
        if (userId !== reqUserId) {
            await helpers.checkPermissions(reqUserId, params, null, {
                default: client_1.PermissionLevel.OWNER,
            });
        }
        // Update the user.
        await resolvers.updateUser(params);
        res.status(200).end();
        // Add log entry.
        await helpers.log('Updated user', reqUserId, params);
    }
    catch (error) {
        next(error);
    }
}
exports.default = router;
