import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/auth/validate
 * Validate auth token
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { authToken } = req.body;

    if (!authToken) {
      return res.status(400).json({
        success: false,
        error: 'Auth token is required'
      });
    }

    // Find user by auth token
    const user = await prisma.user.findUnique({
      where: { authToken: authToken },
      select: {
        id: true,
        email: true,
        name: true,
        tokenExpiry: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid auth token'
      });
    }

    // Check if token is expired
    if (user.tokenExpiry && new Date() > new Date(user.tokenExpiry)) {
      return res.status(401).json({
        success: false,
        error: 'Auth token has expired. Please log in again.'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Validate auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again.'
    });
  } finally {
    await prisma.$disconnect();
  }
}
