import { SafeError, logger } from '../globals';
import express from 'express';

export function register(app: express.Express): void {
  app.use(errorMiddleware);
}

/*
 * Logs an error and sends a clean error message to the client.
 */
function errorMiddleware(
  error: Error | typeof SafeError,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (res.headersSent) {
    return next(error);
  }
  let status = 500;
  let message = 'Internal servor error';
  if (error instanceof SafeError) {
    if (error.status) {
      status = error.status;
    }
    if (error.message) {
      message = error.message;
    }
  }
  if (status === 500) {
    logger.error(error);
  }
  res.status(status).send(message);
}
