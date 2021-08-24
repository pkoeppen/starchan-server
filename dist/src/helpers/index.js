"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFiles = exports.validateUsername = exports.validateThreadTitle = exports.validatePostBody = exports.validatePostPassword = exports.validatePostName = exports.checkPermissions = exports.validateIpAddress = exports.validateReportReason = exports.assertBoardExists = exports.validateBanId = exports.validateReportId = exports.validateAuthorId = exports.validateBoardId = exports.validateThreadId = exports.validatePostId = exports.validateId = exports.blacklistJwt = exports.decrypt = exports.encrypt = exports.readdir = exports.log = exports.render = void 0;
const client_1 = require("@prisma/client");
const globals_1 = require("../globals");
const http_status_codes_1 = require("http-status-codes");
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const is_ip_1 = __importDefault(require("is-ip"));
const SIMPLE_ENCRYPTION_KEY = crypto_1.default
    .createHash('sha256')
    // .update(config.SIMPLE_ENCRYPTION_KEY)
    .update('starchan') // todo
    .digest('hex')
    .slice(0, 16);
/*
 * Export body-formatting function.
 */
var render_1 = require("./render");
Object.defineProperty(exports, "render", { enumerable: true, get: function () { return __importDefault(render_1).default; } });
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
                    id: userId,
                },
            },
            message,
            metadata,
        },
    });
}
exports.log = log;
/*
 * Get all filenames in a directory, excluding index.js.
 */
const readdir = function readdir(dirname) {
    return fs_1.default
        .readdirSync(dirname)
        .map((filename) => /^index\.(js|ts)$/.test(filename)
        ? ''
        : filename.replace(/\.(js|ts)$/g, ''))
        .filter((filename) => filename);
};
exports.readdir = readdir;
/*
 * Encrypts a string with a simple encryption key.
 */
const encrypt = function (str) {
    const cipher = crypto_1.default.createCipheriv('aes-128-cbc', SIMPLE_ENCRYPTION_KEY, SIMPLE_ENCRYPTION_KEY);
    const encrypted = cipher.update(str, 'utf8', 'hex');
    return encrypted + cipher.final('hex');
};
exports.encrypt = encrypt;
/*
 * Decrypts a string with a simple encryption key.
 */
const decrypt = function (str) {
    const decipher = crypto_1.default.createDecipheriv('aes-128-cbc', SIMPLE_ENCRYPTION_KEY, SIMPLE_ENCRYPTION_KEY);
    const decrypted = decipher.update(str, 'hex', 'utf8');
    return decrypted + decipher.final('utf8');
};
exports.decrypt = decrypt;
/*
 * Blacklists the given JWT and sets an expiry on the key.
 */
const blacklistJwt = async function (jwt, expiry // Milliseconds since epoch.
) {
    const jwtKey = `blacklist:jwt:${jwt}`;
    const multi = globals_1.redis.multi();
    multi.set(jwtKey, 1);
    multi.expireat(jwtKey, Math.ceil(expiry / 1000)); // EXPIREAT takes seconds.
    await multi.exec();
};
exports.blacklistJwt = blacklistJwt;
/*
 * Ensures that the given ID is valid and returns the parsed value.
 */
function validateId(id, type) {
    if (!id) {
        throw new globals_1.SafeError(`Missing ${type} ID`, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    id = parseInt(id);
    if (isNaN(id)) {
        throw new globals_1.SafeError(`Invalid ${type} ID`, http_status_codes_1.StatusCodes.BAD_REQUEST);
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
async function assertBoardExists(boardId) {
    const board = await globals_1.prisma.board.findUnique({
        where: {
            id: boardId,
        },
    });
    if (!board) {
        throw new globals_1.SafeError('Board does not exist', http_status_codes_1.StatusCodes.NOT_FOUND);
    }
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
    if (!is_ip_1.default(ipAddress)) {
        throw new globals_1.SafeError('Invalid IP address', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return ipAddress;
}
exports.validateIpAddress = validateIpAddress;
/*
 * Ensures that the user has sufficient permissions.
 */
async function checkPermissions(userId, params, boardId, conditions) {
    // Fetch this user's roles.
    const user = await globals_1.prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            roles: {
                select: {
                    level: true,
                    boardId: true,
                },
            },
        },
    });
    let roles = user?.roles;
    if (!roles) {
        throw new globals_1.SafeError('Insufficient permissions', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
    if (roles.some((role) => role.level === client_1.PermissionLevel.OWNER)) {
        return; // Site owner can do anything.
    }
    // Determine the highest permission level required for this action.
    let highestRequiredLevel = conditions.default;
    const enumerated = {
        [client_1.PermissionLevel.OWNER]: 4,
        [client_1.PermissionLevel.ADMIN]: 3,
        [client_1.PermissionLevel.MODERATOR]: 2,
        [client_1.PermissionLevel.JANITOR]: 1,
    };
    for (const key in params) {
        if (!conditions.hasOwnProperty(key) || !params[key]) {
            // If there is no condition for this parameter, or if the
            // parameter is false, skip it.
            continue;
        }
        const level = conditions[key];
        const n = enumerated[level];
        if (n > enumerated[highestRequiredLevel]) {
            highestRequiredLevel = level;
        }
    }
    // If a board ID was given, filter for roles on that board.
    if (boardId) {
        roles = roles.filter((role) => role.boardId === boardId);
    }
    // Determine if the user has permission.
    const hasPermission = roles.some((role) => enumerated[role.level] >= enumerated[highestRequiredLevel]);
    if (!hasPermission) {
        throw new globals_1.SafeError('Insufficient permissions', http_status_codes_1.StatusCodes.FORBIDDEN);
    }
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
    const { length: totalLineCount } = body.split(/\r?\n/);
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
async function removeFiles(files) {
    // Only remove files that don't already exist in the database.
    const idArray = files.filter((file) => !file.exists).map((file) => file.id);
    // Delete files from database.
    await globals_1.prisma.file.deleteMany({
        where: {
            id: {
                in: idArray,
            },
        },
    });
    globals_1.logger.debug(`Removed ${idArray.length} ${idArray.length > 1 ? 'files' : 'file'} from the database`);
    // Delete files from S3.
    for (const id of idArray) {
        await globals_1.s3.deleteObject({ Bucket: globals_1.s3Bucket, Key: `files/${id}` }).promise();
        await globals_1.s3.deleteObject({ Bucket: globals_1.s3Bucket, Key: `thumbs/${id}` }).promise();
        globals_1.logger.debug(`Removed file ${id} from S3`);
    }
}
exports.removeFiles = removeFiles;
