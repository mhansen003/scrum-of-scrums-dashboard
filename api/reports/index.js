import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/reports
 * List all reports with aggregate statistics
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all published reports with team counts and item counts
    const reports = await prisma.report.findMany({
      where: { published: true },
      orderBy: { periodEndDate: 'desc' },
      include: {
        reportTeams: {
          include: {
            team: true,
            teamLead: true,
            _count: {
              select: {
                accomplishments: true,
                goals: true,
                blockers: true,
                risks: true
              }
            }
          }
        }
      }
    });

    // Transform to include aggregate stats
    const reportsWithStats = reports.map(report => {
      const stats = report.reportTeams.reduce(
        (acc, rt) => ({
          accomplishments: acc.accomplishments + rt._count.accomplishments,
          goals: acc.goals + rt._count.goals,
          blockers: acc.blockers + rt._count.blockers,
          risks: acc.risks + rt._count.risks
        }),
        { accomplishments: 0, goals: 0, blockers: 0, risks: 0 }
      );

      return {
        id: report.id,
        periodEndDate: report.periodEndDate,
        title: report.title,
        teamCount: report.reportTeams.length,
        stats,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      };
    });

    res.status(200).json(reportsWithStats);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  } finally {
    await prisma.$disconnect();
  }
}
