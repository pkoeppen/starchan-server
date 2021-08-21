"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.recaptcha = exports.attach = exports.auth = void 0;
var globals_1 = require("../globals");
var http_status_codes_1 = require("http-status-codes");
var axios_1 = __importDefault(require("axios"));
var bcrypt_1 = __importDefault(require("bcrypt"));
var passport_1 = __importDefault(require("passport"));
var passport_anonymous_1 = __importDefault(require("passport-anonymous"));
var passport_jwt_1 = __importDefault(require("passport-jwt"));
var passport_local_1 = __importDefault(require("passport-local"));
passport_1["default"].use(getLocalStrategy());
passport_1["default"].use(getJwtStrategy());
passport_1["default"].use(new passport_anonymous_1["default"].Strategy());
/*
 * Authenticates a user and attaches it to the request.
 * Fails if authorization is invalid or not present.
 */
exports.auth = passport_1["default"].authenticate(['jwt'], { session: false });
/*
 * Authenticates a user and attaches it to the request,
 * but will also permit non-authenticated requests.
 */
exports.attach = passport_1["default"].authenticate(['jwt', 'anonymous'], {
    session: false
});
/*
 * RECAPTCHA middleware.
 */
exports.recaptcha = recaptchaMiddleware;
/*
 * Authenticates with a username and password.
 */
function getLocalStrategy() {
    return new passport_local_1["default"].Strategy({ usernameField: 'username', passwordField: 'password' }, function (username, password, done) {
        return __awaiter(this, void 0, void 0, function () {
            var user, validPassword, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        globals_1.logger.debug("Logging in username " + username);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, globals_1.prisma.user.findUnique({
                                where: { username: username },
                                include: {
                                    roles: {
                                        select: {
                                            level: true,
                                            boardId: true
                                        }
                                    }
                                }
                            })];
                    case 2:
                        user = _a.sent();
                        if (!user) {
                            return [2 /*return*/, this.fail('Invalid credentials', http_status_codes_1.StatusCodes.UNAUTHORIZED)];
                        }
                        return [4 /*yield*/, bcrypt_1["default"].compare(password, user.password)];
                    case 3:
                        validPassword = _a.sent();
                        if (!validPassword) {
                            return [2 /*return*/, this.fail('Invalid credentials', http_status_codes_1.StatusCodes.UNAUTHORIZED)];
                        }
                        return [2 /*return*/, done(null, user)];
                    case 4:
                        error_1 = _a.sent();
                        globals_1.logger.debug("Login failed: " + error_1);
                        return [2 /*return*/, this.fail('Unknown error', http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    });
}
/*
 * Authenticates with a JWT.
 */
function getJwtStrategy() {
    return new passport_jwt_1["default"].Strategy({
        jwtFromRequest: function (req) { return req.headers.jwt; },
        secretOrKey: process.env.JWT_SECRET,
        passReqToCallback: true
    }, function (req, payload, done) {
        return __awaiter(this, void 0, void 0, function () {
            var expires, user, jwt, jwtBlacklistKey, blacklisted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expires = payload.expires, user = payload.user;
                        if (!(Date.now() > expires)) return [3 /*break*/, 1];
                        globals_1.logger.debug('Authentication failed: JWT is expired');
                        return [2 /*return*/, this.fail('JWT expired', http_status_codes_1.StatusCodes.UNAUTHORIZED)];
                    case 1:
                        jwt = req.headers.jwt;
                        jwtBlacklistKey = "blacklist:jwt:" + jwt;
                        return [4 /*yield*/, globals_1.redis.get(jwtBlacklistKey)];
                    case 2:
                        blacklisted = _a.sent();
                        if (blacklisted) {
                            globals_1.logger.debug('Authentication failed: JWT is blacklisted');
                            return [2 /*return*/, this.fail('JWT blacklisted', http_status_codes_1.StatusCodes.UNAUTHORIZED)];
                        }
                        else {
                            return [2 /*return*/, done(null, __assign({ expires: expires }, user))];
                        }
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    });
}
/*
 * Validates RECAPTCHA input.
 */
function recaptchaMiddleware(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var secret, token, url, response, success, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    secret = process.env.RECAPTCHA_KEY;
                    token = req.query.recaptcha;
                    if (!token) {
                        next(new globals_1.SafeError('Missing RECAPTCHA token', http_status_codes_1.StatusCodes.UNAUTHORIZED));
                    }
                    url = "https://www.google.com/recaptcha/api/siteverify?secret=" + secret + "&response=" + token;
                    return [4 /*yield*/, axios_1["default"].post(url)];
                case 1:
                    response = _b.sent();
                    success = (_a = response.data) === null || _a === void 0 ? void 0 : _a.success;
                    if (!success) {
                        next(new globals_1.SafeError('RECAPTCHA validation failed', http_status_codes_1.StatusCodes.UNAUTHORIZED));
                    }
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _b.sent();
                    next(error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=auth.js.map