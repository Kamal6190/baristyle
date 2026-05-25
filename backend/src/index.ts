import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import checkoutRoutes from './routes/checkout';
import categoryRoutes from './routes/categories';
import settingsRoutes from './routes/settings';
import reviewRoutes from './routes/reviews';
import bcrypt from 'bcrypt';
import prisma from './prismaClient';

import fs from 'fs';
import path from 'path';

dotenv.config();

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

// Stripe webhook needs raw body — must come BEFORE express.json()
app.use('/api/checkout/webhook', express.raw({ type: 'application/json' }));

// All other routes use JSON body
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);

// Password reset endpoint (temporary test)
app.post('/api/auth/reset-password', async (req, res) => {
  console.log('✅ Direct reset-password endpoint called');
  try {
    const { email, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { email },
      data: { password_hash }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BariStyle API is running smoothly' });
});

app.post('/api/auth/reset-password-test', (req, res) => {
  res.json({ message: 'Test endpoint works' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
