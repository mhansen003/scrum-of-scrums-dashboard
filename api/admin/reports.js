import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admin API for managing reports
 * POST /api/admin/reports - Create new report
 * PUT /api/admin/reports?id=X - Update existing report
 * DELETE /api/admin/reports?id=X - Delete report
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'POST':
        return await createReport(req, res);
      case 'PUT':
        return await updateReport(req, res);
      case 'DELETE':
        return await deleteReport(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin API Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create a new report with nested teams and data
 */
async function createReport(req, res) {
  const { periodEndDate, title, published, teams } = req.body;

  if (!periodEndDate || !title || !teams || teams.length === 0) {
    return res.status(400).json({
      error: 'Missing required fields: periodEndDate, title, teams'
    });
  }

  // Check for duplicate date
  const existing = await prisma.report.findUnique({
    where: { periodEndDate: new Date(periodEndDate) }
  });

  if (existing) {
    return res.status(400).json({
      error: 'A report with this period end date already exists'
    });
  }

  // Create report with nested data
  const report = await prisma.report.create({
    data: {
      periodEndDate: new Date(periodEndDate),
      title,
      published: published || false,
      reportTeams: {
        create: teams.map((team, index) => ({
          teamId: team.teamId,
          teamLeadId: team.teamLeadId,
          displayOrder: index,
          accomplishments: {
            create: (team.accomplishments || []).map((item, idx) => ({
              sectionName: item.sectionName || 'General',
              description: item.description,
              ticketId: item.ticketId || null,
              ticketUrl: item.ticketUrl || null,
              displayOrder: idx
            }))
          },
          goals: {
            create: (team.goals || []).map((item, idx) => ({
              sectionName: item.sectionName || 'General',
              description: item.description,
              ticketId: item.ticketId || null,
              ticketUrl: item.ticketUrl || null,
              displayOrder: idx
            }))
          },
          blockers: {
            create: (team.blockers || []).map((item, idx) => ({
              description: item.description,
              ticketId: item.ticketId || null,
              ticketUrl: item.ticketUrl || null,
              workaround: item.workaround || null,
              displayOrder: idx
            }))
          },
          risks: {
            create: (team.risks || []).map((item, idx) => ({
              description: item.description,
              mitigation: item.mitigation || null,
              severity: item.severity || 'medium',
              displayOrder: idx
            }))
          }
        }))
      }
    },
    include: {
      reportTeams: {
        include: {
          team: true,
          teamLead: true,
          accomplishments: true,
          goals: true,
          blockers: true,
          risks: true
        }
      }
    }
  });

  res.status(201).json(report);
}

/**
 * Update an existing report
 */
async function updateReport(req, res) {
  const { id } = req.query;
  const { periodEndDate, title, published, teams } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Report ID required' });
  }

  const reportId = parseInt(id);

  // Check if report exists
  const existing = await prisma.report.findUnique({
    where: { id: reportId }
  });

  if (!existing) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // Delete existing report teams and nested data (cascade will handle children)
  await prisma.reportTeam.deleteMany({
    where: { reportId }
  });

  // Update report with new data
  const report = await prisma.report.update({
    where: { id: reportId },
    data: {
      periodEndDate: periodEndDate ? new Date(periodEndDate) : undefined,
      title: title || undefined,
      published: published !== undefined ? published : undefined,
      reportTeams: teams ? {
        create: teams.map((team, index) => ({
          teamId: team.teamId,
          teamLeadId: team.teamLeadId,
          displayOrder: index,
          accomplishments: {
            create: (team.accomplishments || []).map((item, idx) => ({
              sectionName: item.sectionName || 'General',
              description: item.description,
              ticketId: item.ticketId || null,
              ticketUrl: item.ticketUrl || null,
              displayOrder: idx
            }))
          },
          goals: {
            create: (team.goals || []).map((item, idx) => ({
              sectionName: item.sectionName || 'General',
              description: item.description,
              ticketId: item.ticketId || null,
              ticketUrl: item.ticketUrl || null,
              displayOrder: idx
            }))
          },
          blockers: {
            create: (team.blockers || []).map((item, idx) => ({
              description: item.description,
              ticketId: item.ticketId || null,
              ticketUrl: item.ticketUrl || null,
              workaround: item.workaround || null,
              displayOrder: idx
            }))
          },
          risks: {
            create: (team.risks || []).map((item, idx) => ({
              description: item.description,
              mitigation: item.mitigation || null,
              severity: item.severity || 'medium',
              displayOrder: idx
            }))
          }
        }))
      } : undefined
    },
    include: {
      reportTeams: {
        include: {
          team: true,
          teamLead: true,
          accomplishments: true,
          goals: true,
          blockers: true,
          risks: true
        }
      }
    }
  });

  res.status(200).json(report);
}

/**
 * Delete a report
 */
async function deleteReport(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Report ID required' });
  }

  const reportId = parseInt(id);

  // Check if report exists
  const existing = await prisma.report.findUnique({
    where: { id: reportId }
  });

  if (!existing) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // Delete report (cascade will handle nested data)
  await prisma.report.delete({
    where: { id: reportId }
  });

  res.status(200).json({ success: true, message: 'Report deleted' });
}
