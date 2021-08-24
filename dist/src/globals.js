"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rekognition = exports.s3Bucket = exports.s3 = exports.redis = exports.prisma = exports.SafeError = exports.logger = void 0;
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const pino_1 = __importDefault(require("pino"));
aws_sdk_1.default.config.update({ region: 'us-east-1' });
/*
 * Configures and returns a logger instance.
 */
exports.logger = (function () {
    const pinoPrettyOptions = {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
    };
    const pinoOptions = {
        name: 'starchan-server',
        prettyPrint: process.env.NODE_ENV === 'production' ? false : pinoPrettyOptions,
    };
    const logger = pino_1.default(pinoOptions);
    logger.level = process.env.NODE_ENV === 'production' ? 'error' : 'debug';
    return logger;
})();
/*
 * An error that is safe to display client-side.
 */
class SafeError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
        Object.setPrototypeOf(this, SafeError.prototype);
    }
}
exports.SafeError = SafeError;
/*
 * The global Prisma client.
 */
exports.prisma = new client_1.PrismaClient();
/*
 * The global Redis client.
 */
exports.redis = new ioredis_1.default({
    host: 'redis',
    port: 6379,
});
/*
 * The global S3 client.
 */
exports.s3 = new aws_sdk_1.default.S3();
exports.s3Bucket = process.env.S3_BUCKET;
if (!exports.s3Bucket) {
    exports.logger.error(`Missing required S3_BUCKET environment variable. Terminating process.`);
    process.exit(1);
}
/*
 * The global Rekognition client.
 */
exports.rekognition = new aws_sdk_1.default.Rekognition();
