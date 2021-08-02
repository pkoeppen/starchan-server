import { SafeError, logger, prisma, rekognition, s3 } from '../globals';
import sharp, { Sharp } from 'sharp';
import { File } from '@prisma/client';
import FileType from 'file-type';
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import isSvg from 'is-svg';
import multer from 'multer';

type StorageOptions = {
  acl?:
    | 'private'
    | 'public-read'
    | 'public-read-write'
    | 'aws-exec-read'
    | 'authenticated-read'
    | 'bucket-owner-read'
    | 'bucket-owner-full-control'
    | 'log-delivery-write';
  bucket?: string;
  serverSideEncryption?: 'AES256' | 'aws:kms';
  storageClass?:
    | 'STANDARD'
    | 'REDUCED_REDUNDANCY'
    | 'STANDARD_IA'
    | 'ONEZONE_IA'
    | 'INTELLIGENT_TIERING'
    | 'GLACIER'
    | 'DEEP_ARCHIVE'
    | 'OUTPOSTS';
  allowedMimeTypes?: string[];
  hashAlgorithm?: string;
};

type FilePartial = Omit<File, 'createdAt' | 'updatedAt'> & { exists: boolean };

/*
 * Custom storage engine for Multer.
 */
class S3Storage {
  acl: string;
  bucket: string;
  serverSideEncryption: string;
  storageClass: string;
  allowedMimeTypes: string[];
  hashAlgorithm: string;
  constructor(options: StorageOptions) {
    if (!options.bucket) {
      logger.error(
        'S3 bucket parameter is required to initialize the multer storage engine.'
      );
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
  async _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error?: Error | null, fileData?: Record<string, any>) => void
  ) {
    try {
      const ipAddress = req.ip;
      // TODO: check banned

      const chunks: Buffer[] = [];

      // Prepare the hash.
      const hash = crypto.createHash(this.hashAlgorithm).setEncoding('hex');

      // Push chunks onto the hash as they arrive.
      file.stream.on('data', (chunk) => {
        chunks.push(chunk);
        hash.update(chunk);
      });

      // End hash when file stream ends.
      const checksum: string = await new Promise((resolve) => {
        file.stream.on('end', async () => {
          hash.end();
          // Read checksum.
          resolve(hash.read());
        });
      });

      // Determine file type.
      const buffer = Buffer.concat(chunks);
      const mimetype = (await this.getContentType(buffer)) || 'foo';
      if (!this.allowedMimeTypes.includes(mimetype)) {
        return callback(
          new SafeError(
            `Content type '${mimetype}' not allowed`,
            StatusCodes.BAD_REQUEST
          )
        );
      }

      let fileData: FilePartial = {
        id: checksum,
        filename: file.originalname,
        mimetype,
        size: Buffer.byteLength(buffer),
        nsfw: await isNsfw(buffer),
        exists: false,
      };

      // If file already exists, skip upload.
      const exists = await prisma.file.findUnique({
        where: { id: checksum },
      });
      if (exists) {
        fileData.exists = true;
        return callback(null, fileData);
      }

      if (mimetype.startsWith('image')) {
        fileData = await this.processImage(buffer, fileData);
      } else {
        fileData = await this.processFile(buffer, fileData);
      }

      callback(null, fileData);
    } catch (error) {
      callback(error);
    }
  }

  /*
   * Multer removal handler.
   */
  _removeFile(
    req: Express.Request,
    file: Record<string, any>,
    callback: (error: Error | null) => void
  ): void {
    if (!file.id || file.exists) {
      return callback(null);
    }

    const bucket = this.bucket;

    async function remove(key: string) {
      logger.info(`Removing file at ${key}`);
      const params = { Bucket: bucket, Key: key };
      return s3.deleteObject(params).promise();
    }

    Promise.all([remove(`thumbs/${file.id}`), remove(`files/${file.id}`)])
      .then(() => callback(null))
      .catch(callback);
  }

  /*
   * Determines the content type of the uploaded buffer.
   */
  async getContentType(buffer: Buffer): Promise<string> {
    const typeData = await FileType.fromBuffer(buffer);
    let contentType;
    if (typeData?.mime) {
      contentType = typeData.mime;
    } else if (isSvg(buffer)) {
      contentType = 'image/svg+xml';
    } else {
      contentType = 'application/octet-stream';
    }
    return contentType;
  }

  /*
   * Uploads the given file to S3.
   */
  async uploadFile(buffer: Buffer | Sharp, path: string, mimetype: string) {
    logger.info(`Uploading new file to ${this.bucket}/${path}`);

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

    const upload = s3.upload(params);

    return new Promise((resolve, reject) => {
      upload.send((error, result) => {
        if (error) {
          reject(error);
        } else {
          logger.info(`Uploaded successfully to ${this.bucket}/${path}`);
          resolve(result);
        }
      });
    });
  }

  /*
   * Processes a generic file.
   */
  processFile(buffer: Buffer, file: FilePartial) {
    return this.uploadFile(buffer, `files/${file.id}`, file.mimetype).then(
      () => file
    );
  }

  /*
   * Processes an image file.
   */
  processImage(buffer: Buffer, file: FilePartial) {
    const pipeline = sharp(buffer);
    pipeline.on('error', (error) => {
      throw error;
    });

    const width = 200;
    const height = 200;

    const streamFullsize = pipeline.clone().jpeg(); // TODO: Add editing
    const streamThumbnail = pipeline
      .clone()
      .resize(width, height, { fit: sharp.fit.inside })
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
export default multer({
  storage: new S3Storage({
    bucket: process.env.S3_BUCKET,
  }),
  limits: {
    fileSize: 2000000, // 2 MB
    files: 4,
  },
}).array('files', 4);

// TODO: Note: changes to config here will require server restart

/*
 * Uses AWS Rekognition to check whether an image should be tagged NSFW.
 * https://docs.aws.amazon.com/rekognition/latest/dg/moderation.html#moderation-api
 */
function isNsfw(buffer: Buffer): Promise<boolean> {
  return new Promise((resolve) => {
    const nsfwLabels = ['Explicit Nudity', 'Graphic Violence Or Gore'];
    rekognition.detectModerationLabels(
      {
        Image: {
          Bytes: buffer,
        },
        MinConfidence: 50,
      },
      (error, data) => {
        if (error) {
          logger.error(error);
        } else {
          if (data.ModerationLabels) {
            for (const label of data.ModerationLabels) {
              if (label.Name && nsfwLabels.includes(label.Name)) {
                resolve(true);
              }
            }
          }
        }
        resolve(false);
      }
    );
  });
}
