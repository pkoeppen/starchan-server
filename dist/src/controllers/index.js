"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.register = void 0;
var globals_1 = require("../globals");
var path_1 = __importDefault(require("path"));
var helpers_1 = require("../helpers");
function register(app) {
    /*
     * Register routes by filename in this directory.
     */
    var routes = helpers_1.readdir(__dirname);
    for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
        var route = routes_1[_i];
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        var module_1 = require(path_1["default"].join(__dirname, route));
        app.use("/" + route, module_1["default"]);
        globals_1.logger.debug("Registered route /" + route);
    }
}
exports.register = register;
//# sourceMappingURL=index.js.map