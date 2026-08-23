import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { AdminUser } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dissof-secret-heartmade-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: AdminUser;
}

export function generateToken(user: AdminUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    return decoded;
  } catch {
    return null;
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Silakan login sebagai admin terlebih dahulu.' });
  }

  const user = verifyToken(token);
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Sesi login tidak valid atau kadaluarsa.' });
  }

  // Ensure user still exists in DB
  const dbUser = db.findUserByUsername(user.username);
  if (!dbUser) {
    return res.status(401).json({ error: 'Pengguna admin tidak ditemukan.' });
  }

  req.user = {
    id: dbUser.id,
    username: dbUser.username,
    name: dbUser.name,
    role: dbUser.role
  };

  next();
}
