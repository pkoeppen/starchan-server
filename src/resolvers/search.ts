import * as helpers from '../helpers';
import { Post } from '@prisma/client';
import { SearchOptions } from '../types';
import { redis } from '../globals';

/*
 * Gets multiple threads.
 */
export async function search(
  query: string,
  skip: number,
  searchOptions: SearchOptions
): Promise<{ total: number; results?: Partial<Post>[] }> {
  const queryArgs = [`@bodyText:${query}`];

  if (searchOptions.boardId) {
    queryArgs.push(`@boardId:{${searchOptions.boardId}}`);
  }
  if (searchOptions.threadId) {
    queryArgs.push(`@threadId:{${searchOptions.threadId}}`);
  }

  const args = ['idx:post', `${queryArgs.join(' ')}`, 'LIMIT', skip, 10];

  if (searchOptions.sort) {
    args.push('SORTBY', 'id', searchOptions.sort);
  } else {
    // Default to descending sort.
    args.push('SORTBY', 'id', 'DESC');
  }

  // Execute the search.
  const [resultCount, ...results] = await redis.send_command(
    'FT.SEARCH',
    ...args
  );

  if (!resultCount) {
    return { total: 0, results: [] };
  }

  // Format the search results.
  const posts = helpers.parsePostSearchResults(results);

  return { total: resultCount, results: posts };
}
