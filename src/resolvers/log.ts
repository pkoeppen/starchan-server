import { LogEntry } from '@prisma/client';
import { prisma } from '../globals';

/*
 * Gets multiple log entries.
 */
export async function getLogEntries(): Promise<LogEntry[]> {
  const logEntries = await prisma.logEntry.findMany({
    orderBy: {
      id: 'desc',
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });
  return logEntries;
}
