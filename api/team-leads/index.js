import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/team-leads
 * List all team leads (for admin dropdowns)
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return await createTeamLead(req, res);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const leads = await prisma.teamLead.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching team leads:', error);
    res.status(500).json({ error: 'Failed to fetch team leads' });
  } finally {
    await prisma.$disconnect();
  }
}

async function createTeamLead(req, res) {
  try {
    const { name, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Team lead name is required' });
    }

    const lead = await prisma.teamLead.create({
      data: {
        name,
        email: email || null
      }
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating team lead:', error);
    res.status(500).json({ error: 'Failed to create team lead' });
  } finally {
    await prisma.$disconnect();
  }
}
