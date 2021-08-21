"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
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
exports.__esModule = true;
exports.removeFiles = exports.validateUsername = exports.validateThreadTitle = exports.validatePostBody = exports.validatePostPassword = exports.validatePostName = exports.checkPermissions = exports.validateIpAddress = exports.validateReportReason = exports.assertBoardExists = exports.validateBanId = exports.validateReportId = exports.validateAuthorId = exports.validateBoardId = exports.validateThreadId = exports.validatePostId = exports.validateId = exports.blacklistJwt = exports.decrypt = exports.encrypt = exports.readdir = exports.log = exports.render = void 0;
var client_1 = require("@prisma/client");
var globals_1 = require("../globals");
var http_status_codes_1 = require("http-status-codes");
var crypto_1 = require("crypto");
var fs_1 = require("fs");
var is_ip_1 = require("is-ip");
var SIMPLE_ENCRYPTION_KEY = crypto_1["default"]
    .createHash('sha256')
    // .update(config.SIMPLE_ENCRYPTION_KEY)
    .update('starchan') // todo
    .digest('hex')
    .slice(0, 16);
/*
 * Export body-formatting function.
 */
var render_1 = require("./render");
__createBinding(exports, render_1, "default", "render");
/*
 * Adds a new log entry to the database.
 */
function log(message, userId, metadata) {
    if (!userId) {
        throw new Error('Failed to create log entry. Missing user ID');
    }
    return globals_1.prisma.logEntry.create({
        data: {
            user: {
                connect: {
                    id: userId
                }
            },
            message: message,
            metadata: metadata
        }
    });
}
exports.log = log;
/*
 * Get all filenames in a directory, excluding index.js.
 */
var readdir = function readdir(dirname) {
    return fs_1["default"]
        .readdirSync(dirname)
        .map(function (filename) {
        return /^index\.(js|ts)$/.test(filename)
            ? ''
            : filename.replace(/\.(js|ts)$/g, '');
    })
        .filter(function (filename) { return filename; });
};
exports.readdir = readdir;
/*
 * Encrypts a string with a simple encryption key.
 */
var encrypt = function (str) {
    var cipher = crypto_1["default"].createCipheriv('aes-128-cbc', SIMPLE_ENCRYPTION_KEY, SIMPLE_ENCRYPTION_KEY);
    var encrypted = cipher.update(str, 'utf8', 'hex');
    return encrypted + cipher.final('hex');
};
exports.encrypt = encrypt;
/*
 * Decrypts a string with a simple encryption key.
 */
var decrypt = function (str) {
    var decipher = crypto_1["default"].createDecipheriv('aes-128-cbc', SIMPLE_ENCRYPTION_KEY, SIMPLE_ENCRYPTION_KEY);
    var decrypted = decipher.update(str, 'hex', 'utf8');
    return decrypted + decipher.final('utf8');
};
exports.decrypt = decrypt;
/*
 * Blacklists the given JWT and sets an expiry on the key.
 */
var blacklistJwt = function (jwt, expiry // Milliseconds since epoch.
) {
    return __awaiter(this, void 0, void 0, function () {
        var jwtKey, multi;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jwtKey = "blacklist:jwt:" + jwt;
                    multi = globals_1.redis.multi();
                    multi.set(jwtKey, 1);
                    multi.expireat(jwtKey, Math.ceil(expiry / 1000)); // EXPIREAT takes seconds.
                    return [4 /*yield*/, multi.exec()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
exports.blacklistJwt = blacklistJwt;
/*
 * Ensures that the given ID is valid and returns the parsed value.
 */
function validateId(id, type) {
    if (!id) {
        throw new globals_1.SafeError("Missing " + type + " ID", http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    id = parseInt(id);
    if (isNaN(id)) {
        throw new globals_1.SafeError("Invalid " + type + " ID", http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return id;
}
exports.validateId = validateId;
/*
 * Ensures that the given postId is valid and returns the parsed value.
 */
function validatePostId(postId) {
    return validateId(postId, 'post');
}
exports.validatePostId = validatePostId;
/*
 * Ensures that the given threadId is valid and returns the parsed value.
 */
function validateThreadId(threadId) {
    return validateId(threadId, 'thread');
}
exports.validateThreadId = validateThreadId;
/*
 * Ensures that the given boardId value is valid.
 */
function validateBoardId(boardId) {
    if (!boardId) {
        throw new globals_1.SafeError('Missing board ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (typeof boardId !== 'string') {
        throw new globals_1.SafeError('Invalid board ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return boardId;
}
exports.validateBoardId = validateBoardId;
/*
 * Ensures that the given authorId value is valid.
 */
function validateAuthorId(authorId) {
    if (!authorId) {
        throw new globals_1.SafeError('Missing author ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (typeof authorId !== 'string') {
        throw new globals_1.SafeError('Invalid author ID', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return authorId;
}
exports.validateAuthorId = validateAuthorId;
/*
 * Ensures that the given reportId is valid and returns the parsed value.
 */
function validateReportId(reportId) {
    return validateId(reportId, 'report');
}
exports.validateReportId = validateReportId;
/*
 * Ensures that the given banId is valid and returns the parsed value.
 */
function validateBanId(banId) {
    return validateId(banId, 'ban');
}
exports.validateBanId = validateBanId;
/*
 * Ensures that the given board exists.
 */
function assertBoardExists(boardId) {
    return __awaiter(this, void 0, void 0, function () {
        var board;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, globals_1.prisma.board.findUnique({
                        where: {
                            id: boardId
                        }
                    })];
                case 1:
                    board = _a.sent();
                    if (!board) {
                        throw new globals_1.SafeError('Board does not exist', http_status_codes_1.StatusCodes.NOT_FOUND);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.assertBoardExists = assertBoardExists;
/*
 * Ensures that the given report reason is valid.
 */
function validateReportReason(reason) {
    switch (reason) {
        case 'spam':
            return client_1.ReportReason.SPAM;
        case 'offTopic':
            return client_1.ReportReason.OFFTOPIC;
        case 'illegalContent':
            return client_1.ReportReason.ILLEGAL;
        default:
            throw new globals_1.SafeError('Invalid report reason', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
}
exports.validateReportReason = validateReportReason;
/*
 * Ensures that the given IP address is valid.
 */
function validateIpAddress(ipAddress) {
    if (!is_ip_1["default"](ipAddress)) {
        throw new globals_1.SafeError('Invalid IP address', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return ipAddress;
}
exports.validateIpAddress = validateIpAddress;
/*
 * Ensures that the user has sufficient permissions.
 */
function checkPermissions(userId, params, boardId, conditions) {
    return __awaiter(this, void 0, void 0, function () {
        var user, roles, highestRequiredLevel, enumerated, key, level, n, hasPermission;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, globals_1.prisma.user.findUnique({
                        where: {
                            id: userId
                        },
                        include: {
                            roles: {
                                select: {
                                    level: true,
                                    boardId: true
                                }
                            }
                        }
                    })];
                case 1:
                    user = _b.sent();
                    roles = user === null || user === void 0 ? void 0 : user.roles;
                    if (!roles) {
                        throw new globals_1.SafeError('Insufficient permissions', http_status_codes_1.StatusCodes.FORBIDDEN);
                    }
                    if (roles.some(function (role) { return role.level === client_1.PermissionLevel.OWNER; })) {
                        return [2 /*return*/]; // Site owner can do anything.
                    }
                    highestRequiredLevel = conditions["default"];
                    enumerated = (_a = {},
                        _a[client_1.PermissionLevel.OWNER] = 4,
                        _a[client_1.PermissionLevel.ADMIN] = 3,
                        _a[client_1.PermissionLevel.MODERATOR] = 2,
                        _a[client_1.PermissionLevel.JANITOR] = 1,
                        _a);
                    for (key in params) {
                        if (!conditions.hasOwnProperty(key) || !params[key]) {
                            // If there is no condition for this parameter, or if the
                            // parameter is false, skip it.
                            continue;
                        }
                        level = conditions[key];
                        n = enumerated[level];
                        if (n > enumerated[highestRequiredLevel]) {
                            highestRequiredLevel = level;
                        }
                    }
                    // If a board ID was given, filter for roles on that board.
                    if (boardId) {
                        roles = roles.filter(function (role) { return role.boardId === boardId; });
                    }
                    hasPermission = roles.some(function (role) { return enumerated[role.level] >= enumerated[highestRequiredLevel]; });
                    if (!hasPermission) {
                        throw new globals_1.SafeError('Insufficient permissions', http_status_codes_1.StatusCodes.FORBIDDEN);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.checkPermissions = checkPermissions;
/*
 * Ensures that the given post name is valid.
 */
function validatePostName(name) {
    if (typeof name !== 'string') {
        throw new globals_1.SafeError('Invalid name field', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (name.length > 30) {
        throw new globals_1.SafeError('Name must be less than 30 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Remove extra whitespace.
    name = name.replace(/\s+/g, ' ').trim();
    if (!name) {
        throw new globals_1.SafeError('Invalid name field', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return name;
}
exports.validatePostName = validatePostName;
/*
 * Ensures that the given post password is valid.
 */
function validatePostPassword(password) {
    if (typeof password !== 'string') {
        throw new globals_1.SafeError('Invalid password field', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (password.length > 128) {
        throw new globals_1.SafeError('Password must be less than 128 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return password;
}
exports.validatePostPassword = validatePostPassword;
/*
 * Ensures that the given post body is valid.
 */
function validatePostBody(body) {
    if (typeof body !== 'string') {
        throw new globals_1.SafeError('Invalid body field', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (body.length > 600) {
        throw new globals_1.SafeError('Post body must be less than 600 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    var totalLineCount = body.split(/\r?\n/).length;
    if (totalLineCount > 40) {
        throw new globals_1.SafeError('Post body must have less than 40 line breaks', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return body;
}
exports.validatePostBody = validatePostBody;
/*
 * Ensures that the given thread title is valid.
 */
function validateThreadTitle(title) {
    if (!title) {
        throw new globals_1.SafeError('Thread must have a title', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (typeof title !== 'string') {
        throw new globals_1.SafeError('Invalid thread title', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (title.length > 30) {
        throw new globals_1.SafeError('Thread title must be less than 30 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Remove extra whitespace.
    title = title.replace(/\s+/g, ' ').trim();
    if (!title) {
        throw new globals_1.SafeError('Invalid thread title', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return title;
}
exports.validateThreadTitle = validateThreadTitle;
/*
 * Ensures that the given username is valid.
 */
function validateUsername(username) {
    if (typeof username !== 'string') {
        throw new globals_1.SafeError('Invalid username', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (username.length > 16) {
        throw new globals_1.SafeError('Username must be less than 16 characters long', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return username;
}
exports.validateUsername = validateUsername;
/*
 * Removes all given files from the database and S3.
 */
function removeFiles(files) {
    return __awaiter(this, void 0, void 0, function () {
        var idArray, _i, idArray_1, id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    idArray = files.filter(function (file) { return !file.exists; }).map(function (file) { return file.id; });
                    // Delete files from database.
                    return [4 /*yield*/, globals_1.prisma.file.deleteMany({
                            where: {
                                id: {
                                    "in": idArray
                                }
                            }
                        })];
                case 1:
                    // Delete files from database.
                    _a.sent();
                    globals_1.logger.debug("Removed " + idArray.length + " " + (idArray.length > 1 ? 'files' : 'file') + " from the database");
                    _i = 0, idArray_1 = idArray;
                    _a.label = 2;
                case 2:
                    if (!(_i < idArray_1.length)) return [3 /*break*/, 6];
                    id = idArray_1[_i];
                    return [4 /*yield*/, globals_1.s3.deleteObject({ Bucket: globals_1.s3Bucket, Key: "files/" + id }).promise()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, globals_1.s3.deleteObject({ Bucket: globals_1.s3Bucket, Key: "thumbs/" + id }).promise()];
                case 4:
                    _a.sent();
                    globals_1.logger.debug("Removed file " + id + " from S3");
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.removeFiles = removeFiles;
