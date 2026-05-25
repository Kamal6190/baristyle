import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prismaClient';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../mailer';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

console.log('⚠️ Auth routes loaded - reset-password endpoint is available');

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: role || 'CUSTOMER'
      }
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
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
        created_at: true
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
    const { name, email, password } = req.body;

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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true
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

export default router;
