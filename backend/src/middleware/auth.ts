import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Middleware to parse token and attach user to request (does not block unauthenticated users)
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      req.user = decoded;
    } catch (error) {
      // Token invalid, but since it's optional, we just move on
    }
  }
  next();
};

// Middleware to enforce authentication
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  });
};

// Middleware for Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
