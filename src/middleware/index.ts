import * as parsers from './parsers';
import express from 'express';
import logger from './logger';

export function register(app: express.Express): void {
  app.use((req: express.Request, res, next) => {
    req.ipAddress = (req.headers['x-real-ip'] as string) || req.ipAddress;
    next();
  });
  app.use(parsers.json);
  app.use(parsers.urlencoded);
  app.use(parsers.boolparser);
  app.use(parsers.cookie);
  app.use(parsers.body);
  app.use(logger);
}
