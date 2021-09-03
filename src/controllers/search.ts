import * as resolvers from '../resolvers';
import { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { SafeError } from '../globals';
import { SearchOptions } from '../types';
import { StatusCodes } from 'http-status-codes';
import { difference } from 'lodash';

const router = Router();

/*
 * Executes a search with the given query.
 */
router.get('/', resolvePostUri);
async function resolvePostUri(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate 'q' query param.
    const q = req.query.q;
    if (!q || typeof q !== 'string') {
      throw new SafeError('Invalid query', StatusCodes.BAD_REQUEST);
    }

    const parts = q.split(/\s+/).filter((str) => !!str);
    const options = parts.filter((str) => /[a-z]+:[a-z0-9]+/.test(str));
    const query = difference(parts, options)
      .join(' ')
      .replace(/[^a-z0-9\s]/gi, '')
      .trim();

    const searchOptions: SearchOptions = {};
    for (const option of options) {
      if (/^sort:(asc|desc)$/.test(option)) {
        searchOptions.sort = option.split(':')[1] as 'asc' | 'desc';
      }
      if (/^board:[a-z0-9]+$/.test(option)) {
        searchOptions.boardId = option.split(':')[1];
      }
      if (/^thread:[0-9]+$/.test(option)) {
        searchOptions.threadId = option.split(':')[1];
      }
    }

    // Validate 'page' query param.
    const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;
    if (isNaN(skip) || skip < 0) {
      throw new SafeError('Invalid skip number', StatusCodes.BAD_REQUEST);
    }

    // Execute the search.
    const results = await resolvers.search(
      query as string,
      skip,
      searchOptions
    );

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
}

export default router;
