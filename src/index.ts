// eslint-disable-next-line
require('dotenv').config();

import * as controllers from './controllers';
import * as errors from './middleware/errors';
import * as middleware from './middleware';
import express from 'express';

const app = express();

middleware.register(app);
controllers.register(app);
errors.register(app); // Must be registered last.

const port = 3001;
app.listen(port, async () => {
  console.log(`Listening on port ${port}`);
});
