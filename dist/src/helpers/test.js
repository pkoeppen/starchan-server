"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const render_1 = __importDefault(require("./render"));
const str = `>greentext\n<redtext`;
const { rendered } = render_1.default(str);
console.log('rendered:', rendered);
