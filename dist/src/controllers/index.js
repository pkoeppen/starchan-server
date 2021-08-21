"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const globals_1 = require("../globals");
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../helpers");
function register(app) {
    /*
     * Register routes by filename in this directory.
     */
    const routes = helpers_1.readdir(__dirname);
    for (const route of routes) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const module = require(path_1.default.join(__dirname, route));
        app.use(`/${route}`, module.default);
        globals_1.logger.debug(`Registered route /${route}`);
    }
}
exports.register = register;
