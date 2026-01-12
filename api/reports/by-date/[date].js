import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/reports/by-date/[date]
 * Fetch report by period end date (format: YYYY-MM-DD)
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

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter required (format: YYYY-MM-DD)' });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    const report = await prisma.report.findUnique({
      where: { periodEndDate: new Date(date) },
      include: {
        reportTeams: {
          orderBy: { displayOrder: 'asc' },
          include: {
            team: true,
            teamLead: true,
            accomplishments: {
              orderBy: { displayOrder: 'asc' }
            },
            goals: {
              orderBy: { displayOrder: 'asc' }
            },
            blockers: {
              orderBy: { displayOrder: 'asc' }
            },
            risks: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found for this date' });
    }

    // Check if published (unless admin request)
    if (!report.published) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching report by date:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  } finally {
    await prisma.$disconnect();
  }
}
