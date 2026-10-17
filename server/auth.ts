import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../src/types';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'widya-pustaka-sman3-nganjuk-super-secret-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const users = db.getData().users;
    const user = users.find((u) => u.id === decoded.id && u.isActive);

    if (!user) {
      return res.status(401).json({ error: 'Sesi kedaluwarsa atau pengguna tidak aktif.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token autentikasi tidak valid atau telah kedaluwarsa.' });
  }
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan.' });
    }

    if (allowedRoles.includes(req.user.role) || req.user.role === 'superadmin') {
      return next();
    }

    return res.status(403).json({
      error: `Akses ditolak: Hak akses [${allowedRoles.join(', ')}] diperlukan untuk tindakan ini.`
    });
  };
}
