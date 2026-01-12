import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/auth/send-otp
 * Send OTP to CMG Financial email addresses
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
    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Only allow @cmgfi.com email addresses
    if (!trimmedEmail.endsWith('@cmgfi.com')) {
      return res.status(403).json({
        success: false,
        error: 'Only CMG Financial email addresses (@cmgfi.com) are allowed'
      });
    }

    // Check if user exists, if not create them
    let user = await prisma.user.findUnique({
      where: { email: trimmedEmail }
    });

    if (!user) {
      // Auto-create user for CMG Financial email
      const name = trimmedEmail.split('@')[0].replace(/\./g, ' ');
      user = await prisma.user.create({
        data: {
          email: trimmedEmail,
          name: name
        }
      });
      console.log(`✅ Created new user: ${trimmedEmail}`);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: otp,
        otpExpiry: otpExpiry
      }
    });

    // Log OTP to console (in production, send email via SendGrid/SES)
    console.log(`
╔═══════════════════════════════════════════════╗
║  SCRUM OF SCRUMS - OTP VERIFICATION CODE      ║
╠═══════════════════════════════════════════════╣
║  Email: ${trimmedEmail.padEnd(37)}║
║  Code:  ${otp}                                 ║
║  Expires: ${otpExpiry.toLocaleTimeString().padEnd(33)}║
╚═══════════════════════════════════════════════╝
    `);

    // TODO: In production, send email via SendGrid/AWS SES
    // Example SendGrid implementation:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: user.email,
      from: 'noreply@cmgfinancial.com',
      subject: 'Scrum of Scrums - Login Verification Code',
      text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #14b8a6;">Scrum of Scrums</h2>
          <p>Your verification code is:</p>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 8px; color: #14b8a6; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    await sgMail.send(msg);
    */

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again.'
    });
  } finally {
    await prisma.$disconnect();
  }
}
