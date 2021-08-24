"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("../globals");
exports.default = loggerMiddleware;
/*
 * Formats and logs request data.
 */
function loggerMiddleware(req, res, next) {
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
            globals_1.logger.error(message);
        }
        else {
            globals_1.logger.info(message);
        }
    });
    next();
}
/*
 * A little class to time things in nanoseconds.
 */
class Nanotimer {
    start;
    elapsed;
    constructor() {
        this.start = process.hrtime();
        this.elapsed = 0;
    }
    startTimer() {
        this.start = process.hrtime();
        return this;
    }
    end() {
        const NS_PER_SEC = 1e9;
        const difference = process.hrtime(this.start);
        const nanoseconds = difference[0] * NS_PER_SEC + difference[1];
        this.elapsed = nanoseconds;
        return this;
    }
    milleseconds() {
        this.elapsed *= 0.000001;
        return this;
    }
    round(places) {
        return places
            ? +(Math.round((this.elapsed + `e+${places}`)) +
                `e-${places}`)
            : this.elapsed;
    }
}
