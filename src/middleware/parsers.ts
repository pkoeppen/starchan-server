import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const boolParser = require('express-query-boolean');

export const json = express.json();
export const urlencoded = express.urlencoded({ extended: true });
export const boolparser = boolParser();
export const cookie = cookieParser();
export const body = bodyParser.json();
