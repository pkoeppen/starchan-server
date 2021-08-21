"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var render_1 = __importDefault(require("./render"));
var str = ">greentext\n<redtext";
var rendered = render_1["default"](str).rendered;
console.log('rendered:', rendered);
//# sourceMappingURL=test.js.map