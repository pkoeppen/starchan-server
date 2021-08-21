"use strict";
exports.__esModule = true;
exports.body = exports.cookie = exports.boolparser = exports.urlencoded = exports.json = exports.cors = exports.origins = void 0;
var cors_1 = require("cors");
var body_parser_1 = require("body-parser");
var cookie_parser_1 = require("cookie-parser");
var express_1 = require("express");
// eslint-disable-next-line @typescript-eslint/no-var-requires
var boolParser = require('express-query-boolean');
exports.origins = [
    'http://localhost:3000',
    'http://mod.localhost:3000',
    'http://local.starchan.org:3000',
    'http://mod.local.starchan.org:3000',
];
exports.cors = cors_1["default"]({
    origin: exports.origins,
    credentials: true
}); // todo
exports.json = express_1["default"].json();
exports.urlencoded = express_1["default"].urlencoded({ extended: true });
exports.boolparser = boolParser();
exports.cookie = cookie_parser_1["default"]();
exports.body = body_parser_1["default"].json();
