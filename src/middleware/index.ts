import * as helpers from '../helpers';
import * as parsers from './parsers';
import express from 'express';
import logger from './logger';

export function register(app: express.Express): void {
  app.use(parsers.cors);
  app.use(parsers.json);
  app.use(parsers.urlencoded);
  app.use(parsers.boolparser);
  app.use(parsers.cookie);
  app.use(parsers.body);
  app.use(logger);
  app.use(setOnline);
}

/*
 * Adds an expiring 'online' object whenever a user makes a request.
 */
async function setOnline(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const user = helpers.encrypt(req.ip);
  // Don't await this promise. Just call next.

  // TODO: prisma/redis set online

  next();
}
