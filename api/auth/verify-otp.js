import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * POST /api/auth/verify-otp
 * Verify OTP and generate auth token
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
    const { email, otp } = req.body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!otp || typeof otp !== 'string' || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Get user with OTP
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        otp: true,
        otpExpiry: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        error: 'No verification code was sent. Please request a new code.'
      });
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new code.'
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code. Please try again.'
      });
    }

    // OTP is valid! Generate auth token
    const authToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Update user with new auth token and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        authToken: authToken,
        tokenExpiry: tokenExpiry,
        lastLoginAt: new Date(),
        otp: null,
        otpExpiry: null
      }
    });

    console.log(`✅ User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      authToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again.'
    });
  } finally {
    await prisma.$disconnect();
  }
}
