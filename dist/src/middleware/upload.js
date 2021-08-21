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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("../globals");
const sharp_1 = __importDefault(require("sharp"));
const file_type_1 = __importDefault(require("file-type"));
const http_status_codes_1 = require("http-status-codes");
const crypto_1 = __importDefault(require("crypto"));
const is_svg_1 = __importDefault(require("is-svg"));
const multer_1 = __importDefault(require("multer"));
/*
 * Custom storage engine for Multer.
 */
class S3Storage {
    constructor(options) {
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
    _handleFile(req, file, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ipAddress = req.ip;
                // TODO: check banned
                const chunks = [];
                // Prepare the hash.
                const hash = crypto_1.default.createHash(this.hashAlgorithm).setEncoding('hex');
                // Push chunks onto the hash as they arrive.
                file.stream.on('data', (chunk) => {
                    chunks.push(chunk);
                    hash.update(chunk);
                });
                // End hash when file stream ends.
                const checksum = yield new Promise((resolve) => {
                    file.stream.on('end', () => __awaiter(this, void 0, void 0, function* () {
                        hash.end();
                        // Read checksum.
                        resolve(hash.read());
                    }));
                });
                // Determine file type.
                const buffer = Buffer.concat(chunks);
                const mimetype = (yield this.getContentType(buffer)) || 'foo';
                if (!this.allowedMimeTypes.includes(mimetype)) {
                    return callback(new globals_1.SafeError(`Content type '${mimetype}' not allowed`, http_status_codes_1.StatusCodes.BAD_REQUEST));
                }
                let fileData = {
                    id: checksum,
                    filename: file.originalname,
                    mimetype,
                    size: Buffer.byteLength(buffer),
                    nsfw: yield isNsfw(buffer),
                    exists: false,
                };
                // If file already exists, skip upload.
                const exists = yield globals_1.prisma.file.findUnique({
                    where: { id: checksum },
                });
                if (exists) {
                    fileData.exists = true;
                    return callback(null, fileData);
                }
                if (mimetype.startsWith('image')) {
                    fileData = yield this.processImage(buffer, fileData);
                }
                else {
                    fileData = yield this.processFile(buffer, fileData);
                }
                callback(null, fileData);
            }
            catch (error) {
                callback(error);
            }
        });
    }
    /*
     * Multer removal handler.
     */
    _removeFile(req, file, callback) {
        if (!file.id || file.exists) {
            return callback(null);
        }
        const bucket = this.bucket;
        function remove(key) {
            return __awaiter(this, void 0, void 0, function* () {
                globals_1.logger.info(`Removing file at ${key}`);
                const params = { Bucket: bucket, Key: key };
                return globals_1.s3.deleteObject(params).promise();
            });
        }
        Promise.all([remove(`thumbs/${file.id}`), remove(`files/${file.id}`)])
            .then(() => callback(null))
            .catch(callback);
    }
    /*
     * Determines the content type of the uploaded buffer.
     */
    getContentType(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const typeData = yield file_type_1.default.fromBuffer(buffer);
            let contentType;
            if (typeData === null || typeData === void 0 ? void 0 : typeData.mime) {
                contentType = typeData.mime;
            }
            else if (is_svg_1.default(buffer)) {
                contentType = 'image/svg+xml';
            }
            else {
                contentType = 'application/octet-stream';
            }
            return contentType;
        });
    }
    /*
     * Uploads the given file to S3.
     */
    uploadFile(buffer, path, mimetype) {
        return __awaiter(this, void 0, void 0, function* () {
            globals_1.logger.info(`Uploading new file to ${this.bucket}/${path}`);
            const params = {
                Body: buffer,
                Key: path,
                ContentType: mimetype,
                Bucket: this.bucket,
                ACL: this.acl,
                StorageClass: this.storageClass,
                // CacheControl: this.cacheControl,
                // ServerSideEncryption: this.serverSideEncryption,
                // SSEKMSKeyId: this.sseKmsKeyId
            };
            const upload = globals_1.s3.upload(params);
            return new Promise((resolve, reject) => {
                upload.send((error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        globals_1.logger.info(`Uploaded successfully to ${this.bucket}/${path}`);
                        resolve(result);
                    }
                });
            });
        });
    }
    /*
     * Processes a generic file.
     */
    processFile(buffer, file) {
        return this.uploadFile(buffer, `files/${file.id}`, file.mimetype).then(() => file);
    }
    /*
     * Processes an image file.
     */
    processImage(buffer, file) {
        const pipeline = sharp_1.default(buffer);
        pipeline.on('error', (error) => {
            throw error;
        });
        const width = 200;
        const height = 200;
        const streamFullsize = pipeline.clone().jpeg(); // TODO: Add editing
        const streamThumbnail = pipeline
            .clone()
            .resize(width, height, { fit: sharp_1.default.fit.inside })
            .jpeg();
        return pipeline
            .clone()
            .metadata()
            .then(({ width, height }) => {
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
                this.uploadFile(streamFullsize, `files/${file.id}`, file.mimetype),
                this.uploadFile(streamThumbnail, `thumbs/${file.id}`, file.mimetype),
            ]).then(() => file);
        });
    }
}
/*
 * File upload handler.
 */
exports.default = multer_1.default({
    storage: new S3Storage({
        bucket: process.env.S3_BUCKET,
    }),
    limits: {
        fileSize: 2000000,
        files: 4,
    },
}).array('files', 4);
// TODO: Note: changes to config here will require server restart
/*
 * Uses AWS Rekognition to check whether an image should be tagged NSFW.
 * https://docs.aws.amazon.com/rekognition/latest/dg/moderation.html#moderation-api
 */
function isNsfw(buffer) {
    return new Promise((resolve) => {
        const nsfwLabels = ['Explicit Nudity', 'Graphic Violence Or Gore'];
        globals_1.rekognition.detectModerationLabels({
            Image: {
                Bytes: buffer,
            },
            MinConfidence: 50,
        }, (error, data) => {
            if (error) {
                globals_1.logger.error(error);
            }
            else {
                if (data.ModerationLabels) {
                    for (const label of data.ModerationLabels) {
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
