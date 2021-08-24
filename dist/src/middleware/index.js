"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const helpers = __importStar(require("../helpers"));
const parsers = __importStar(require("./parsers"));
const logger_1 = __importDefault(require("./logger"));
function register(app) {
    app.use(parsers.cors);
    app.use(parsers.json);
    app.use(parsers.urlencoded);
    app.use(parsers.boolparser);
    app.use(parsers.cookie);
    app.use(parsers.body);
    app.use(logger_1.default);
    app.use(setOnline);
}
exports.register = register;
/*
 * Adds an expiring 'online' object whenever a user makes a request.
 */
async function setOnline(req, res, next) {
    const user = helpers.encrypt(req.ip);
    // Don't await this promise. Just call next.
    // TODO: prisma/redis set online
    next();
}
