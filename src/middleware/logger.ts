import express from 'express';
import { logger } from '../globals';

export default loggerMiddleware;

/*
 * Formats and logs request data.
 */
function loggerMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const timer = new Nanotimer();
  res.on('finish', () => {
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;
    const time = timer.end().milleseconds().round(2);
    const size = res.getHeader('Content-Length') || '-';
    const message = `${method} ${url} ${status} ${time} ms - ${size}`;

    const isError = res.statusCode >= 400 && res.statusCode < 600;
    if (isError) {
      logger.error(message);
    } else {
      logger.info(message);
    }
  });
  next();
}

/*
 * A little class to time things in nanoseconds.
 */
class Nanotimer {
  start: [number, number];
  elapsed: number;
  constructor() {
    this.start = process.hrtime();
    this.elapsed = 0;
  }
  public startTimer() {
    this.start = process.hrtime();
    return this;
  }
  public end() {
    const NS_PER_SEC = 1e9;
    const difference = process.hrtime(this.start);
    const nanoseconds = difference[0] * NS_PER_SEC + difference[1];
    this.elapsed = nanoseconds;
    return this;
  }
  public milleseconds() {
    this.elapsed *= 0.000001;
    return this;
  }
  public round(places: number) {
    return places
      ? +(
          Math.round((this.elapsed + `e+${places}`) as unknown as number) +
          `e-${places}`
        )
      : this.elapsed;
  }
}
