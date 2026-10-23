import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, UserRole } from '../models/User';

const getSecret = (): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return process.env.JWT_SECRET;
};

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    assignedPersonIds: string[];
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    const payload = jwt.verify(token, getSecret());
    if (typeof payload !== 'object' || !payload.sub) {
      res.status(401).json({ success: false, error: 'Invalid authentication token.' });
      return;
    }

    const user = await User.findById(payload.sub).select('+passwordHash');
    if (!user || !user.active) {
      res.status(401).json({ success: false, error: 'User account is inactive or missing.' });
      return;
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      assignedPersonIds: user.assignedPersonIds.map(String),
    };
    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Authentication failed.';
    res.status(401).json({ success: false, error: message });
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({ success: false, error: 'Administrator access required.' });
    return;
  }
  next();
};

export const requirePersonAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const rawPersonId = req.params.personId || req.params.id;
  const personId = Array.isArray(rawPersonId) ? rawPersonId[0] : rawPersonId;
  if (!personId || !Types.ObjectId.isValid(personId)) {
    res.status(400).json({ success: false, error: 'Valid person ID is required.' });
    return;
  }
  if (req.user?.role === UserRole.ADMIN || req.user?.assignedPersonIds.includes(personId)) {
    next();
    return;
  }
  res.status(403).json({ success: false, error: 'You are not assigned to this borrower.' });
};
