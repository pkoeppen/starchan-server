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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var helpers = __importStar(require("../helpers"));
var resolvers = __importStar(require("../resolvers"));
var globals_1 = require("../globals");
var auth_1 = require("../middleware/auth");
var client_1 = require("@prisma/client");
var express_1 = require("express");
var http_status_codes_1 = require("http-status-codes");
var lodash_1 = __importDefault(require("lodash"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var passport_1 = __importDefault(require("passport"));
var router = express_1.Router();
/*
 * Logs a user in.
 */
router.post('/login', auth_1.recaptcha, logIn);
function logIn(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            passport_1["default"].authenticate('local', function (error, user, message, status) { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    if (error) {
                        return [2 /*return*/, next(error)];
                    }
                    if (!user) {
                        return [2 /*return*/, next(new globals_1.SafeError(message || 'Unknown error', status || http_status_codes_1.StatusCodes.UNAUTHORIZED))];
                    }
                    req.login(user, { session: false }, function (error) { return __awaiter(_this, void 0, void 0, function () {
                        var userClean, duration, expires, token, cookieOptions;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    if (error) {
                                        return [2 /*return*/, next(error)];
                                    }
                                    userClean = lodash_1["default"].pick(user, ['id', 'username', 'email', 'roles']);
                                    duration = 4 * 60 * 60 * 1000;
                                    expires = Date.now() + duration;
                                    token = jsonwebtoken_1["default"].sign({ expires: expires, user: userClean }, process.env.JWT_SECRET);
                                    cookieOptions = {
                                        httpOnly: false,
                                        sameSite: 'lax',
                                        secure: process.env.NODE_ENV === 'production',
                                        domain: 'local.starchan.org',
                                        path: '/',
                                        maxAge: duration
                                    };
                                    // Set cookies.
                                    res.cookie('token', token, cookieOptions);
                                    res.cookie('expires', expires.toString(), cookieOptions);
                                    res.cookie('user', JSON.stringify(userClean), cookieOptions);
                                    res.status(http_status_codes_1.StatusCodes.OK).send({ token: token, expires: expires, user: userClean });
                                    // Add log entry.
                                    return [4 /*yield*/, helpers.log('Logged in', (_a = req.user) === null || _a === void 0 ? void 0 : _a.id, null)];
                                case 1:
                                    // Add log entry.
                                    _b.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
                });
            }); })(req, res, next);
            return [2 /*return*/];
        });
    });
}
/*
 * Logs a user out.
 */
router.post('/logout', auth_1.auth, logout);
function logout(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var jwt_1, tokenExpiry, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    jwt_1 = req.headers.jwt;
                    tokenExpiry = (_a = req.user) === null || _a === void 0 ? void 0 : _a.expires;
                    return [4 /*yield*/, helpers.blacklistJwt(jwt_1, tokenExpiry)];
                case 1:
                    _b.sent();
                    req.logout();
                    res.status(http_status_codes_1.StatusCodes.OK).end();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _b.sent();
                    next(error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/*
 * Gets all users.
 */
router.get('/', auth_1.auth, getUsers);
function getUsers(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var users, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, resolvers.getUsers()];
                case 1:
                    users = _a.sent();
                    res.json(users);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    next(error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/*
 * Updates a user by ID.
 */
router.post('/:userId', auth_1.auth, updateUser);
function updateUser(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var userId, username, usernameTaken, params, reqUserId, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 7, , 8]);
                    userId = req.params.userId;
                    username = req.body.username
                        ? helpers.validateUsername(req.body.username)
                        : null;
                    if (!username) {
                        throw new globals_1.SafeError('Nothing to update', http_status_codes_1.StatusCodes.BAD_REQUEST);
                    }
                    if (!username) return [3 /*break*/, 2];
                    return [4 /*yield*/, globals_1.prisma.user.findUnique({
                            where: {
                                username: username
                            }
                        })];
                case 1:
                    usernameTaken = !!(_b.sent());
                    if (usernameTaken) {
                        throw new globals_1.SafeError('Username taken', http_status_codes_1.StatusCodes.CONFLICT);
                    }
                    _b.label = 2;
                case 2:
                    params = { userId: userId, username: username };
                    reqUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                    if (!(userId !== reqUserId)) return [3 /*break*/, 4];
                    return [4 /*yield*/, helpers.checkPermissions(reqUserId, params, null, {
                            "default": client_1.PermissionLevel.OWNER
                        })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4: 
                // Update the user.
                return [4 /*yield*/, resolvers.updateUser(params)];
                case 5:
                    // Update the user.
                    _b.sent();
                    res.status(200).end();
                    // Add log entry.
                    return [4 /*yield*/, helpers.log('Updated user', reqUserId, params)];
                case 6:
                    // Add log entry.
                    _b.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_3 = _b.sent();
                    next(error_3);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
exports["default"] = router;
//# sourceMappingURL=users.js.map