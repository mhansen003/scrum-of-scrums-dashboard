import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/reports/[id]
 * Fetch full report detail with all nested data
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

  const { id } = req.query;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Valid report ID required' });
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id: parseInt(id) },
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
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if published (unless admin request)
    if (!report.published) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  } finally {
    await prisma.$disconnect();
  }
}
