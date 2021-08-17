import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import aws from 'aws-sdk';
import pino from 'pino';

aws.config.update({ region: 'us-east-1' });

/*
 * Configures and returns a logger instance.
 */
export const logger = (function () {
  const pinoPrettyOptions = {
    colorize: true,
    translateTime: 'HH:MM:ss.l',
  };
  const pinoOptions = {
    name: 'starchan-server',
    prettyPrint:
      process.env.NODE_ENV === 'production' ? false : pinoPrettyOptions,
  };
  const logger = pino(pinoOptions);
  logger.level = process.env.NODE_ENV === 'production' ? 'error' : 'debug';
  return logger;
})();

/*
 * An error that is safe to display client-side.
 */
export class SafeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, SafeError.prototype);
  }
}

/*
 * The global Prisma client.
 */
export const prisma = new PrismaClient();

/*
 * The global Redis client.
 */
export const redis = new Redis();

/*
 * The global S3 client.
 */
export const s3 = new aws.S3();
export const s3Bucket = process.env.S3_BUCKET as string;
if (!s3Bucket) {
  logger.error(
    `Missing required S3_BUCKET environment variable. Terminating process.`
  );
  process.exit(1);
}

/*
 * The global Rekognition client.
 */
export const rekognition = new aws.Rekognition();
