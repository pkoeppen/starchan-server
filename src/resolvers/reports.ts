import { Prisma, Report, ReportReason } from '@prisma/client';
import { logger, prisma } from '../globals';

/*
 * Gets multiple reports.
 */
export async function getReports(params: {
  boardId: string;
  ipAddress: string;
}): Promise<Report[]> {
  // Build the query.
  const query = {
    orderBy: {
      createdAt: 'desc',
    },
  } as Prisma.ReportFindManyArgs;

  if (params.boardId) {
    query.where = { boardId: params.boardId };
  }
  if (params.ipAddress) {
    query.where = { ...query.where, ipAddress: params.ipAddress };
  }

  // Fetch the reports.
  return prisma.report.findMany(query);
}

/*
 * Adds a new report.
 */
export async function addReport(params: {
  postId: bigint;
  threadId: bigint;
  boardId: string;
  reason: ReportReason;
  ipAddress: string;
}): Promise<void> {
  // Create the report.
  const report = await prisma.report.create({
    data: {
      reason: params.reason,
      ipAddress: params.ipAddress,
      post: {
        connect: {
          id: params.postId,
        },
      },
      thread: {
        connect: {
          id: params.threadId,
        },
      },
      board: {
        connect: {
          id: params.boardId,
        },
      },
    },
  });
  logger.debug(`Created report ${report.id} on post ${report.postId}`);
}

/*
 * Deletes a report.
 */
export async function deleteReport(params: {
  reportId: string;
}): Promise<Report> {
  // Delete the report.
  const deletedReport = await prisma.report.delete({
    where: {
      id: params.reportId,
    },
  });

  logger.debug(`Deleted report ${params.reportId}`);

  return deletedReport;
}
