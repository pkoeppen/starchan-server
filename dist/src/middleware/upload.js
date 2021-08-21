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
var globals_1 = require("../globals");
var sharp_1 = __importDefault(require("sharp"));
var file_type_1 = __importDefault(require("file-type"));
var http_status_codes_1 = require("http-status-codes");
var crypto_1 = __importDefault(require("crypto"));
var is_svg_1 = __importDefault(require("is-svg"));
var multer_1 = __importDefault(require("multer"));
/*
 * Custom storage engine for Multer.
 */
var S3Storage = /** @class */ (function () {
    function S3Storage(options) {
        if (!options.bucket) {
            globals_1.logger.error('S3 bucket parameter is required to initialize the multer storage engine.');
            process.exit(1);
        }
        this.bucket = options.bucket;
        this.allowedMimeTypes = options.allowedMimeTypes || [
            'application/pdf',
            'application/zip',
            'audio/wav',
            'image/gif',
            'image/jpeg',
            'image/png',
            'text/plain',
            'video/webm',
        ];
        this.bucket = options.bucket;
        this.acl = options.acl || 'public-read';
        this.storageClass = options.storageClass || 'STANDARD';
        this.serverSideEncryption = options.serverSideEncryption || 'AES256';
        this.hashAlgorithm = options.hashAlgorithm || 'MD5';
        // this.cacheControl = options.cacheControl || null;
        // this.contentDisposition = options.contentDisposition;
        // this.sseKmsKeyId = options.sseKmsKeyId || null;
    }
    /*
     * Multer upload handler.
     */
    S3Storage.prototype._handleFile = function (req, file, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var ipAddress, chunks_1, hash_1, checksum, buffer, mimetype, fileData, exists, error_1;
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 9, , 10]);
                        ipAddress = req.ip;
                        chunks_1 = [];
                        hash_1 = crypto_1["default"].createHash(this.hashAlgorithm).setEncoding('hex');
                        // Push chunks onto the hash as they arrive.
                        file.stream.on('data', function (chunk) {
                            chunks_1.push(chunk);
                            hash_1.update(chunk);
                        });
                        return [4 /*yield*/, new Promise(function (resolve) {
                                file.stream.on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        hash_1.end();
                                        // Read checksum.
                                        resolve(hash_1.read());
                                        return [2 /*return*/];
                                    });
                                }); });
                            })];
                    case 1:
                        checksum = _b.sent();
                        buffer = Buffer.concat(chunks_1);
                        return [4 /*yield*/, this.getContentType(buffer)];
                    case 2:
                        mimetype = (_b.sent()) || 'foo';
                        if (!this.allowedMimeTypes.includes(mimetype)) {
                            return [2 /*return*/, callback(new globals_1.SafeError("Content type '" + mimetype + "' not allowed", http_status_codes_1.StatusCodes.BAD_REQUEST))];
                        }
                        _a = {
                            id: checksum,
                            filename: file.originalname,
                            mimetype: mimetype,
                            size: Buffer.byteLength(buffer)
                        };
                        return [4 /*yield*/, isNsfw(buffer)];
                    case 3:
                        fileData = (_a.nsfw = _b.sent(),
                            _a.exists = false,
                            _a);
                        return [4 /*yield*/, globals_1.prisma.file.findUnique({
                                where: { id: checksum }
                            })];
                    case 4:
                        exists = _b.sent();
                        if (exists) {
                            fileData.exists = true;
                            return [2 /*return*/, callback(null, fileData)];
                        }
                        if (!mimetype.startsWith('image')) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.processImage(buffer, fileData)];
                    case 5:
                        fileData = _b.sent();
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, this.processFile(buffer, fileData)];
                    case 7:
                        fileData = _b.sent();
                        _b.label = 8;
                    case 8:
                        callback(null, fileData);
                        return [3 /*break*/, 10];
                    case 9:
                        error_1 = _b.sent();
                        callback(error_1);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /*
     * Multer removal handler.
     */
    S3Storage.prototype._removeFile = function (req, file, callback) {
        if (!file.id || file.exists) {
            return callback(null);
        }
        var bucket = this.bucket;
        function remove(key) {
            return __awaiter(this, void 0, void 0, function () {
                var params;
                return __generator(this, function (_a) {
                    globals_1.logger.info("Removing file at " + key);
                    params = { Bucket: bucket, Key: key };
                    return [2 /*return*/, globals_1.s3.deleteObject(params).promise()];
                });
            });
        }
        Promise.all([remove("thumbs/" + file.id), remove("files/" + file.id)])
            .then(function () { return callback(null); })["catch"](callback);
    };
    /*
     * Determines the content type of the uploaded buffer.
     */
    S3Storage.prototype.getContentType = function (buffer) {
        return __awaiter(this, void 0, void 0, function () {
            var typeData, contentType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, file_type_1["default"].fromBuffer(buffer)];
                    case 1:
                        typeData = _a.sent();
                        if (typeData === null || typeData === void 0 ? void 0 : typeData.mime) {
                            contentType = typeData.mime;
                        }
                        else if (is_svg_1["default"](buffer)) {
                            contentType = 'image/svg+xml';
                        }
                        else {
                            contentType = 'application/octet-stream';
                        }
                        return [2 /*return*/, contentType];
                }
            });
        });
    };
    /*
     * Uploads the given file to S3.
     */
    S3Storage.prototype.uploadFile = function (buffer, path, mimetype) {
        return __awaiter(this, void 0, void 0, function () {
            var params, upload;
            var _this = this;
            return __generator(this, function (_a) {
                globals_1.logger.info("Uploading new file to " + this.bucket + "/" + path);
                params = {
                    Body: buffer,
                    Key: path,
                    ContentType: mimetype,
                    Bucket: this.bucket,
                    ACL: this.acl,
                    StorageClass: this.storageClass
                };
                upload = globals_1.s3.upload(params);
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        upload.send(function (error, result) {
                            if (error) {
                                reject(error);
                            }
                            else {
                                globals_1.logger.info("Uploaded successfully to " + _this.bucket + "/" + path);
                                resolve(result);
                            }
                        });
                    })];
            });
        });
    };
    /*
     * Processes a generic file.
     */
    S3Storage.prototype.processFile = function (buffer, file) {
        return this.uploadFile(buffer, "files/" + file.id, file.mimetype).then(function () { return file; });
    };
    /*
     * Processes an image file.
     */
    S3Storage.prototype.processImage = function (buffer, file) {
        var _this = this;
        var pipeline = sharp_1["default"](buffer);
        pipeline.on('error', function (error) {
            throw error;
        });
        var width = 200;
        var height = 200;
        var streamFullsize = pipeline.clone().jpeg(); // TODO: Add editing
        var streamThumbnail = pipeline
            .clone()
            .resize(width, height, { fit: sharp_1["default"].fit.inside })
            .jpeg();
        return pipeline
            .clone()
            .metadata()
            .then(function (_a) {
            var width = _a.width, height = _a.height;
            /* Metadata example:
              {
                format: 'jpeg',
                size: 42893,
                width: 551,
                height: 310,
                space: 'srgb',
                channels: 3,
                depth: 'uchar',
                chromaSubsampling: '4:2:0',
                isProgressive: true,
                hasProfile: false,
                hasAlpha: false
              }
            */
            return Promise.all([
                _this.uploadFile(streamFullsize, "files/" + file.id, file.mimetype),
                _this.uploadFile(streamThumbnail, "thumbs/" + file.id, file.mimetype),
            ]).then(function () { return file; });
        });
    };
    return S3Storage;
}());
/*
 * File upload handler.
 */
exports["default"] = multer_1["default"]({
    storage: new S3Storage({
        bucket: process.env.S3_BUCKET
    }),
    limits: {
        fileSize: 2000000,
        files: 4
    }
}).array('files', 4);
// TODO: Note: changes to config here will require server restart
/*
 * Uses AWS Rekognition to check whether an image should be tagged NSFW.
 * https://docs.aws.amazon.com/rekognition/latest/dg/moderation.html#moderation-api
 */
function isNsfw(buffer) {
    return new Promise(function (resolve) {
        var nsfwLabels = ['Explicit Nudity', 'Graphic Violence Or Gore'];
        globals_1.rekognition.detectModerationLabels({
            Image: {
                Bytes: buffer
            },
            MinConfidence: 50
        }, function (error, data) {
            if (error) {
                globals_1.logger.error(error);
            }
            else {
                if (data.ModerationLabels) {
                    for (var _i = 0, _a = data.ModerationLabels; _i < _a.length; _i++) {
                        var label = _a[_i];
                        if (label.Name && nsfwLabels.includes(label.Name)) {
                            resolve(true);
                        }
                    }
                }
            }
            resolve(false);
        });
    });
}
//# sourceMappingURL=upload.js.map