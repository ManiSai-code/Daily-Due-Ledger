import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { User, UserRole } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

const tokenFor = (user: { _id: unknown }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured.');
  return jwt.sign({ role: (user as { role?: UserRole }).role }, secret, {
    subject: String(user._id),
    expiresIn: '7d',
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ success: false, error: 'Email and password are required.' });
    return;
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ success: false, error: 'Invalid email or password.' });
    return;
  }
  res.json({
    success: true,
    data: {
      token: tokenFor(user),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        assignedPersonIds: user.assignedPersonIds,
      },
    },
  });
};

export const me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }
  res.json({ success: true, data: user });
};

export const listUsers = async (_req: Request, res: Response): Promise<void> => {
  const users = await User.find().select('email name role assignedPersonIds active createdAt');
  res.json({
    success: true,
    data: users.map((user) => ({
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      assignedPersonIds: user.assignedPersonIds.map(String),
      active: user.active,
      createdAt: user.createdAt,
    })),
  });
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password, name, role = UserRole.READ_ONLY } = req.body as {
    email?: string; password?: string; name?: string; role?: UserRole;
  };
  if (!email || !password || password.length < 8 || !name || !Object.values(UserRole).includes(role)) {
    res.status(400).json({ success: false, error: 'Name, email, password, and valid role are required.' });
    return;
  }
  const user = await User.create({
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash: await bcrypt.hash(password, 12),
    role,
    assignedPersonIds: [],
  });
  res.status(201).json({ success: true, data: { id: user._id, email: user.email, name: user.name, role: user.role } });
};

export const assignBorrowers = async (req: Request, res: Response): Promise<void> => {
  const { personIds } = req.body as { personIds?: string[] };
  if (!Array.isArray(personIds)) {
    res.status(400).json({ success: false, error: 'personIds must be an array.' });
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { assignedPersonIds: personIds },
    { new: true }
  );
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found.' });
    return;
  }
  res.json({ success: true, data: { id: user._id, assignedPersonIds: user.assignedPersonIds } });
};
