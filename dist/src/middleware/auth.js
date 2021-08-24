"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recaptcha = exports.attach = exports.auth = void 0;
const globals_1 = require("../globals");
const http_status_codes_1 = require("http-status-codes");
const axios_1 = __importDefault(require("axios"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const passport_1 = __importDefault(require("passport"));
const passport_anonymous_1 = __importDefault(require("passport-anonymous"));
const passport_jwt_1 = __importDefault(require("passport-jwt"));
const passport_local_1 = __importDefault(require("passport-local"));
passport_1.default.use(getLocalStrategy());
passport_1.default.use(getJwtStrategy());
passport_1.default.use(new passport_anonymous_1.default.Strategy());
/*
 * Authenticates a user and attaches it to the request.
 * Fails if authorization is invalid or not present.
 */
exports.auth = passport_1.default.authenticate(['jwt'], { session: false });
/*
 * Authenticates a user and attaches it to the request,
 * but will also permit non-authenticated requests.
 */
exports.attach = passport_1.default.authenticate(['jwt', 'anonymous'], {
    session: false,
});
/*
 * RECAPTCHA middleware.
 */
exports.recaptcha = recaptchaMiddleware;
/*
 * Authenticates with a username and password.
 */
function getLocalStrategy() {
    return new passport_local_1.default.Strategy({ usernameField: 'username', passwordField: 'password' }, async function (username, password, done) {
        globals_1.logger.debug(`Logging in username ${username}`);
        try {
            const user = await globals_1.prisma.user.findUnique({
                where: { username },
                include: {
                    roles: {
                        select: {
                            level: true,
                            boardId: true,
                        },
                    },
                },
            });
            if (!user) {
                return this.fail('Invalid credentials', http_status_codes_1.StatusCodes.UNAUTHORIZED);
            }
            const validPassword = await bcrypt_1.default.compare(password, user.password);
            if (!validPassword) {
                return this.fail('Invalid credentials', http_status_codes_1.StatusCodes.UNAUTHORIZED);
            }
            return done(null, user);
        }
        catch (error) {
            globals_1.logger.debug(`Login failed: ${error}`);
            return this.fail('Unknown error', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        }
    });
}
/*
 * Authenticates with a JWT.
 */
function getJwtStrategy() {
    return new passport_jwt_1.default.Strategy({
        jwtFromRequest: (req) => req.headers.jwt,
        secretOrKey: process.env.JWT_SECRET,
        passReqToCallback: true,
    }, async function (req, payload, done) {
        const { expires, user } = payload;
        if (Date.now() > expires) {
            globals_1.logger.debug('Authentication failed: JWT is expired');
            return this.fail('JWT expired', http_status_codes_1.StatusCodes.UNAUTHORIZED);
        }
        else {
            const jwt = req.headers.jwt;
            const jwtBlacklistKey = `blacklist:jwt:${jwt}`;
            const blacklisted = await globals_1.redis.get(jwtBlacklistKey);
            if (blacklisted) {
                globals_1.logger.debug('Authentication failed: JWT is blacklisted');
                return this.fail('JWT blacklisted', http_status_codes_1.StatusCodes.UNAUTHORIZED);
            }
            else {
                return done(null, { expires, ...user });
            }
        }
    });
}
/*
 * Validates RECAPTCHA input.
 */
async function recaptchaMiddleware(req, res, next) {
    try {
        const secret = process.env.RECAPTCHA_KEY;
        const token = req.query.recaptcha;
        if (!token) {
            next(new globals_1.SafeError('Missing RECAPTCHA token', http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;
        const response = await axios_1.default.post(url);
        const success = response.data?.success;
        if (!success) {
            next(new globals_1.SafeError('RECAPTCHA validation failed', http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
