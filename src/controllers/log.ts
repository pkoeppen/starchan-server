import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { auth } from '../middleware/auth';

const router = Router();

/*
 * Gets all log entries.
 */
router.get('/', auth, getLogEntries);
async function getLogEntries(req: Request, res: Response, next: NextFunction) {
  try {
    // Get log entries.
    const logEntries = await resolvers.getLogEntries();
    // Send the response.
    res.json(logEntries);
  } catch (error) {
    next(error);
  }
}

export default router;
