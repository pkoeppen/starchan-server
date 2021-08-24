import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import aws from 'aws-sdk';
import pino from 'pino';

aws.config.update({ region: 'us-east-1' });

/*
 * Configures and returns a logger instance.
 */
export const logger = (function () {
  const pinoOptions = {
    name: 'starchan-server',
    prettyPrint: {
      colorize: process.env.NODE_ENV !== 'production',
      translateTime: 'HH:MM:ss.l',
    },
  };
  const logger = pino(pinoOptions);
  //logger.level = process.env.NODE_ENV === 'production' ? 'error' : 'debug';
  logger.level = 'debug';
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
export const redis = new Redis({
  host: 'redis',
  port: 6379,
});

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

/*
 * Set and verify environment variables.
 */
let missingEnvironmentVariable = false;

export const TLD = process.env.TLD;
if (!TLD) {
  logger.error("Fatal error: Missing environment variable 'TLD'");
  missingEnvironmentVariable = true;
}

export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error("Fatal error: Missing environment variable 'JWT_SECRET'");
  missingEnvironmentVariable = true;
}

export const RECAPTCHA_PRIVATE_KEY = process.env.RECAPTCHA_PRIVATE_KEY;
if (!RECAPTCHA_PRIVATE_KEY) {
  logger.error(
    "Fatal error: Missing environment variable 'RECAPTCHA_PRIVATE_KEY'"
  );
  missingEnvironmentVariable = true;
}

export const S3_BUCKET = process.env.S3_BUCKET;
if (!S3_BUCKET) {
  logger.error("Fatal error: Missing environment variable 'S3_BUCKET'");
  missingEnvironmentVariable = true;
}

export const SIMPLE_ENCRYPTION_KEY = process.env.SIMPLE_ENCRYPTION_KEY;
if (!SIMPLE_ENCRYPTION_KEY) {
  logger.error(
    "Fatal error: Missing environment variable 'SIMPLE_ENCRYPTION_KEY'"
  );
  missingEnvironmentVariable = true;
}

if (missingEnvironmentVariable) {
  process.exit(1);
}
