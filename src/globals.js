"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.rekognition = exports.s3Bucket = exports.s3 = exports.redis = exports.prisma = exports.SafeError = exports.logger = void 0;
var client_1 = require("@prisma/client");
var ioredis_1 = require("ioredis");
var aws_sdk_1 = require("aws-sdk");
var pino_1 = require("pino");
aws_sdk_1["default"].config.update({ region: 'us-east-1' });
/*
 * Configures and returns a logger instance.
 */
exports.logger = (function () {
    var pinoPrettyOptions = {
        colorize: true,
        translateTime: 'HH:MM:ss.l'
    };
    var pinoOptions = {
        name: 'starchan-server',
        prettyPrint: process.env.NODE_ENV === 'production' ? false : pinoPrettyOptions
    };
    var logger = pino_1["default"](pinoOptions);
    logger.level = process.env.NODE_ENV === 'production' ? 'error' : 'debug';
    return logger;
})();
/*
 * An error that is safe to display client-side.
 */
var SafeError = /** @class */ (function (_super) {
    __extends(SafeError, _super);
    function SafeError(message, status) {
        var _this = _super.call(this, message) || this;
        _this.status = status;
        Object.setPrototypeOf(_this, SafeError.prototype);
        return _this;
    }
    return SafeError;
}(Error));
exports.SafeError = SafeError;
/*
 * The global Prisma client.
 */
exports.prisma = new client_1.PrismaClient();
/*
 * The global Redis client.
 */
exports.redis = new ioredis_1["default"]();
/*
 * The global S3 client.
 */
exports.s3 = new aws_sdk_1["default"].S3();
exports.s3Bucket = process.env.S3_BUCKET;
if (!exports.s3Bucket) {
    exports.logger.error("Missing required S3_BUCKET environment variable. Terminating process.");
    process.exit(1);
}
/*
 * The global Rekognition client.
 */
exports.rekognition = new aws_sdk_1["default"].Rekognition();
