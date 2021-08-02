import express from 'express';
import { logger } from '../globals';
import path from 'path';
import { readdir } from '../helpers';

export function register(app: express.Express): void {
  /*
   * Register routes by filename in this directory.
   */
  const routes = readdir(__dirname);
  for (const route of routes) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require(path.join(__dirname, route));
    app.use(`/${route}`, module.default);
    logger.debug(`Registered route /${route}`);
  }
}
