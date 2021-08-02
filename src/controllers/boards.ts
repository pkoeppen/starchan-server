import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

/*
 * Gets all boards.
 */
router.get('/', getBoards);
async function getBoards(req: Request, res: Response, next: NextFunction) {
  try {
    // Get board data.
    const data = await resolvers.getBoards();
    res.json(data);
  } catch (error) {
    next(error);
  }
}

export default router;
