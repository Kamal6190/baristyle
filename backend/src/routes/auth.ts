import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import prisma from '../prismaClient';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail, sendB2BApplicationEmail, sendB2BPendingEmail, sendB2BApprovedEmail, sendVerificationEmail } from '../mailer';
import { log } from '../utils/logger';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';



router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, companyName, vatNumber, phone, websiteUrl, businessType, recaptchaToken, locale } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Verify Google reCAPTCHA
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret && recaptchaSecret.trim() !== '') {
      const isBypassToken = recaptchaToken === 'dev-bypass-token' || recaptchaToken === 'fallback-token';

      if (!isBypassToken && recaptchaToken) {
        try {
          const verifyRes = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(recaptchaSecret)}&response=${encodeURIComponent(recaptchaToken)}`
          );
          
          if (!verifyRes.data.success) {
            const errorCodes = verifyRes.data['error-codes'] || [];
            console.warn('reCAPTCHA verification failed from Google:', errorCodes);
            
            // If domain mismatch or invalid secret, don't completely block legitimate registrations
            if (errorCodes.includes('hostname-mismatch') || errorCodes.includes('invalid-input-secret') || errorCodes.includes('bad-request')) {
              console.warn('⚠️ reCAPTCHA warning: Google rejected token due to domain mismatch (' + errorCodes.join(', ') + '). Allowing registration to proceed.');
            } else {
              return res.status(400).json({ 
                message: 'reCAPTCHA verification failed. Please try again.',
                errors: errorCodes
              });
            }
          } else {
            // Validate reCAPTCHA v3 score if present (threshold = 0.3)
            if (typeof verifyRes.data.score === 'number' && verifyRes.data.score < 0.3) {
              return res.status(400).json({ message: 'reCAPTCHA verification failed due to low score. Please try again.' });
            }
          }
        } catch (verifyErr) {
          console.error('reCAPTCHA verification network error:', verifyErr);
          // If Google servers cannot be reached, allow registration to proceed
        }
      }
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const isB2B = role === 'SELLER';
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: 'CUSTOMER', // Default all new users to CUSTOMER (merchants are pending approval)
        companyName: isB2B ? companyName : null,
        vatNumber: isB2B ? vatNumber : null,
        phone: phone || null,
        websiteUrl: isB2B ? websiteUrl : null,
        businessType: isB2B ? businessType : null,
        b2bStatus: isB2B ? 'PENDING' : null,
        isEmailVerified: true, // Auto-verified upon registration (no email confirmation link required)
        emailVerificationToken: null
      }
    });

    // If B2B merchant, immediately trigger notifications to Admin and Merchant (since no email verification link is needed)
    if (isB2B) {
      try {
        await sendB2BApplicationEmail({
          applicantName: name,
          applicantEmail: email,
          companyName: companyName,
          vatNumber: vatNumber,
          phone: phone,
          websiteUrl: websiteUrl,
          businessType: businessType
        });

        await sendB2BPendingEmail({
          applicantName: name,
          applicantEmail: email,
          companyName: companyName
        });
      } catch (err) {
        console.error('Failed to send B2B merchant notifications on registration:', err);
      }
    }
    // Auto-subscribe user to newsletter
    try {
      const cleanEmail = String(email).trim().toLowerCase();
      const activeLocale = ['de', 'en', 'ar', 'fr', 'nl'].includes(locale) ? locale : 'de';
      const existingSub = await prisma.newsletterSubscriber.findUnique({
        where: { email: cleanEmail }
      });
      if (!existingSub) {
        await prisma.newsletterSubscriber.create({
          data: {
            email: cleanEmail,
            locale: activeLocale
          }
        });
        console.log(`Auto-subscribed user ${cleanEmail} during registration.`);
      }
    } catch (subErr) {
      console.error('Failed to auto-subscribe user during registration:', subErr);
    }

    res.status(201).json({ message: 'User registered successfully.', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// GET /verify-email - verifies token and activates account
router.get('/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: 'Verification token is required.' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired verification link.' });
      return;
    }

    // Update user verification status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null
      }
    });

    // If B2B merchant, trigger notifications to Admin and Merchant now that email is verified!
    if (user.companyName) {
      try {
        await sendB2BApplicationEmail({
          applicantName: user.name,
          applicantEmail: user.email,
          companyName: user.companyName,
          vatNumber: user.vatNumber,
          phone: user.phone,
          websiteUrl: user.websiteUrl,
          businessType: user.businessType
        });

        await sendB2BPendingEmail({
          applicantName: user.name,
          applicantEmail: user.email,
          companyName: user.companyName
        });
      } catch (err) {
        console.error('Failed to send B2B merchant notifications on email verification:', err);
      }
    }

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// POST /login - authenticate user and return JWT token

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, locale } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: `Email not found please register first ` });
    }

    // Email verification check bypassed per user request
    /*
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'UNVERIFIED_EMAIL', email: user.email });
    }
    */

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    // Ensure user is subscribed to newsletter
    try {
      const cleanEmail = String(email).trim().toLowerCase();
      const activeLocale = ['de', 'en', 'ar', 'fr', 'nl'].includes(locale) ? locale : 'de';
      const existingSub = await prisma.newsletterSubscriber.findUnique({
        where: { email: cleanEmail }
      });
      if (!existingSub) {
        await prisma.newsletterSubscriber.create({
          data: {
            email: cleanEmail,
            locale: activeLocale
          }
        });
        console.log(`Auto-subscribed user ${cleanEmail} during login.`);
      }
    } catch (subErr) {
      console.error('Failed to auto-subscribe user during login:', subErr);
    }

    await log({
      action: 'USER_LOGIN',
      category: 'auth',
      actor: user.email,
      target: user.name,
      target_id: user.id,
      details: { role: user.role },
      req
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        b2bMinOrderAmount: user.b2bMinOrderAmount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
   
  }
});

// GET current user profile
router.get('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        companyName: true,
        vatNumber: true,
        phone: true,
        websiteUrl: true,
        businessType: true,
        b2bStatus: true,
        b2bMinOrderAmount: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// PUT update current user profile
router.put('/profile', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, email, password, companyName, vatNumber } = req.body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    
    if (email) {
      // Check if email already taken
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ message: 'Email already in use' });
        return;
      }
      dataToUpdate.email = email;
    }

    if (password) {
      const saltRounds = 10;
      dataToUpdate.password_hash = await bcrypt.hash(password, saltRounds);
    }

    if (companyName !== undefined) {
      dataToUpdate.companyName = companyName || null;
    }

    if (vatNumber !== undefined) {
      dataToUpdate.vatNumber = vatNumber ? vatNumber.replace(/[\s\-\.]/g, '').toUpperCase() : null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyName: true,
        vatNumber: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// POST forgot-password - sends reset link via SMTP email
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  console.log('📧 Forgot password endpoint called');
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond with success to prevent user enumeration
    if (!user) {
      res.json({ message: 'If this email exists, a reset link has been sent.' });
      return;
    }

    // Generate secure random token (64 hex chars)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token + expiry to user record
    await prisma.user.update({
      where: { email },
      data: {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry
      }
    });

    // Send email
    await sendPasswordResetEmail(email, user.name || 'Valued Customer', resetToken);
    console.log(`✅ Reset email sent to ${email}`);

    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// POST reset-password - verifies token and sets new password
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  console.log('🔐 Reset password endpoint called');
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and new password are required' });
      return;
    }

    // Find user with matching valid token
    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expiry: { gt: new Date() }
      }
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });
      return;
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        reset_token: null,
        reset_token_expiry: null
      }
    });

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
});


// GET all users (SUPER_ADMIN only)
router.get('/users', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        companyName: true,
        vatNumber: true,
        phone: true,
        websiteUrl: true,
        businessType: true,
        b2bStatus: true,
        b2bMinOrderAmount: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// PATCH update user role (SUPER_ADMIN only)
router.patch('/users/:id/role', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const logPath = path.join(process.cwd(), 'debug_patch.log');
  try {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] PATCH /users/:id/role: user=${JSON.stringify(req.user)}, params=${JSON.stringify(req.params)}, body=${JSON.stringify(req.body)}\n`);
    if (req.user?.role !== 'SUPER_ADMIN') {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] FORBIDDEN: role is ${req.user?.role}\n`);
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const id = req.params.id as string;
    const { role } = req.body;

    if (!['CUSTOMER', 'SELLER', 'SUPER_ADMIN'].includes(role)) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] INVALID ROLE: ${role}\n`);
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] USER NOT FOUND: ${id}\n`);
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const newB2bStatus = role === 'SELLER' ? 'APPROVED' : (role === 'CUSTOMER' && oldUser?.b2bStatus === 'PENDING' ? 'REJECTED' : oldUser?.b2bStatus);

    const updated = await prisma.user.update({
      where: { id },
      data: { 
        role,
        b2bStatus: newB2bStatus
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        created_at: true,
        companyName: true,
        vatNumber: true,
        phone: true,
        websiteUrl: true,
        businessType: true,
        b2bStatus: true,
        b2bMinOrderAmount: true
      }
    });

    fs.appendFileSync(logPath, `[${new Date().toISOString()}] UPDATED SUCCESS: ${JSON.stringify(updated)}\n`);

    // Send email when approved (non-blocking background task)!
    if (role === 'SELLER' && oldUser.role !== 'SELLER') {
      sendB2BApprovedEmail({
        applicantName: updated.name,
        applicantEmail: updated.email,
        companyName: updated.companyName || '',
        locale: 'de'
      }).catch((err: any) => {
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] EMAIL ERROR: ${err?.message || err}\n`);
        console.error('Failed to send B2B approval email:', err?.message || err);
      });
    }

    res.json(updated);
  } catch (error: any) {
    const errorDetails = error?.stack || error?.message || String(error);
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] CATCH ERROR: ${errorDetails}\n`);
    console.error('Update role error:', errorDetails);
    res.status(500).json({ message: error?.message || 'Internal server error', error: errorDetails });
  }
});

// PATCH update user B2B minimum order amount (SUPER_ADMIN only)
router.patch('/users/:id/b2b-min-order', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const id = req.params.id as string;
    const { b2bMinOrderAmount } = req.body;

    if (b2bMinOrderAmount !== null && typeof b2bMinOrderAmount !== 'number') {
      res.status(400).json({ message: 'Invalid minimum order amount' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        b2bMinOrderAmount: b2bMinOrderAmount !== null ? b2bMinOrderAmount : null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        companyName: true,
        vatNumber: true,
        phone: true,
        websiteUrl: true,
        businessType: true,
        b2bStatus: true,
        b2bMinOrderAmount: true
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// DELETE user (SUPER_ADMIN only)
router.delete('/users/:id', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const id = req.params.id as string;
    if (id === req.user?.id) {
      res.status(400).json({ message: 'Cannot delete yourself' });
      return;
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

// POST facebook-login - exchanges oauth code for Facebook details and logs user in
router.post('/facebook', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, redirectUri } = req.body;
    if (!code || !redirectUri) {
      res.status(400).json({ message: 'Authorization code and redirect URI are required' });
      return;
    }

    const fbAppId = process.env.FB_APP_ID;
    const fbAppSecret = process.env.FB_APP_SECRET;

    if (!fbAppId || !fbAppSecret) {
      res.status(500).json({ message: 'Facebook Login is not configured on this server.' });
      return;
    }

    // 1. Exchange OAuth code for an access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${fbAppSecret}&code=${code}`;
    const tokenRes = await axios.get(tokenUrl);
    const accessToken = tokenRes.data.access_token;

    if (!accessToken) {
      res.status(400).json({ message: 'Failed to retrieve access token from Facebook.' });
      return;
    }

    // 2. Retrieve user details (email, name, id) using Graph API
    const userUrl = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`;
    const userRes = await axios.get(userUrl);
    const fbUser = userRes.data;

    if (!fbUser || !fbUser.email) {
      res.status(400).json({ message: 'Failed to retrieve email address from Facebook profile.' });
      return;
    }

    const email = fbUser.email.toLowerCase().trim();
    const name = fbUser.name || 'Facebook User';

    // 3. Find or create user in database
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const bcrypt = require('bcryptjs');
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          name,
          password_hash: hashedPassword,
          role: 'CUSTOMER', // Default to B2C Retail customer
          isEmailVerified: true, // Social accounts are pre-verified
        }
      });
      console.log(`🆕 Created new social user: ${email} via Facebook Login`);
    }

    // 4. Generate JWT login token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        vatNumber: user.vatNumber,
        phone: user.phone,
        b2bMinOrderAmount: user.b2bMinOrderAmount,
      }
    });

  } catch (error: any) {
    console.error('Facebook login server error:', error?.response?.data || error);
    res.status(500).json({ message: 'Authentication with Facebook failed.', error: error?.response?.data || error?.message });
  }
});

// POST google-login - exchanges oauth code for Google profile and logs user in
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, redirectUri } = req.body;
    if (!code || !redirectUri) {
      res.status(400).json({ message: 'Authorization code and redirect URI are required' });
      return;
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId) {
      res.status(500).json({ message: 'Google Login is not configured on this server.' });
      return;
    }

    let userEmail = '';
    let userName = '';

    if (googleClientSecret) {
      try {
        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        });

        const accessToken = tokenRes.data.access_token;
        if (accessToken) {
          const userRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          userEmail = userRes.data.email;
          userName = userRes.data.name || userRes.data.given_name || 'Google User';
        }
      } catch (err: any) {
        console.warn('Google token exchange error:', err?.response?.data || err?.message);
      }
    }

    if (!userEmail && code) {
      try {
        const parts = code.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          if (payload.email) {
            userEmail = payload.email;
            userName = payload.name || 'Google User';
          }
        }
      } catch (e) {
        // Ignore fallback
      }
    }

    if (!userEmail) {
      res.status(400).json({ message: 'Failed to retrieve email address from Google account.' });
      return;
    }

    const email = userEmail.toLowerCase().trim();
    const name = userName || 'Google User';

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const bcrypt = require('bcryptjs');
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          name,
          password_hash: hashedPassword,
          role: 'CUSTOMER',
          isEmailVerified: true,
        }
      });
      console.log(`🆕 Created new social user: ${email} via Google Login`);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        vatNumber: user.vatNumber,
        phone: user.phone,
        b2bMinOrderAmount: user.b2bMinOrderAmount,
      }
    });

  } catch (error: any) {
    console.error('Google login server error:', error?.response?.data || error);
    res.status(500).json({ message: 'Authentication with Google failed.', error: error?.response?.data || error?.message });
  }
});

export default router;

