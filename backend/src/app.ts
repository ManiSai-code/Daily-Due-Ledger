import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import personRoutes from './routes/personRoutes';
import transactionRoutes from './routes/transactionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authRoutes from './routes/authRoutes';
import bcrypt from 'bcryptjs';
import { User, UserRole } from './models/User';

dotenv.config();

const app: Application = express();

// Middleware
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: configuredOrigins.length > 0 ? configuredOrigins : true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/people', personRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Daily Due System API is operational',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
    if (!existingAdmin) {
      await User.create({
        email: process.env.ADMIN_EMAIL.toLowerCase(),
        name: process.env.ADMIN_NAME || 'Administrator',
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
        role: UserRole.ADMIN,
        assignedPersonIds: [],
      });
      console.log(`✅ Initial administrator created: ${process.env.ADMIN_EMAIL}`);
    } else if (process.env.ADMIN_RESET_PASSWORD === 'true') {
      existingAdmin.passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      existingAdmin.role = UserRole.ADMIN;
      existingAdmin.active = true;
      await existingAdmin.save();
      console.log(`✅ Administrator password reset: ${process.env.ADMIN_EMAIL}`);
    }
  }
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

export default app;