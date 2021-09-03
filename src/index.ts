// Prisma messes up hot-reloading for some reason, and this is necessary.
process.on('SIGTERM', () => {
  process.exit();
});

// eslint-disable-next-line
require('dotenv').config();

import * as controllers from './controllers';
import * as errors from './middleware/errors';
import * as middleware from './middleware';
import express from 'express';
import { logger } from './globals';

const app = express();

middleware.register(app);
controllers.register(app);
errors.register(app); // Must be registered last.

const PORT = 3001;
app.listen(PORT, async () => {
  logger.info(`Listening at http://localhost:${PORT}`);
});
