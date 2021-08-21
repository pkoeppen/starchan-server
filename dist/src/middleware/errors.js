"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const globals_1 = require("../globals");
function register(app) {
    app.use(errorMiddleware);
}
exports.register = register;
/*
 * Logs an error and sends a clean error message to the client.
 */
function errorMiddleware(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }
    let status = 500;
    let message = 'Internal servor error';
    if (error instanceof globals_1.SafeError) {
        if (error.status) {
            status = error.status;
        }
        if (error.message) {
            message = error.message;
        }
    }
    if (status === 500) {
        globals_1.logger.error(error);
    }
    res.status(status).send(message);
}
