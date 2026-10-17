import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../auth';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email dan Password wajib diisi.' });
  }

  const data = db.getData();
  const user = data.users.find(
    (u) => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) && u.isActive
  );

  if (!user) {
    return res.status(401).json({ error: 'Username atau Password salah.' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Username atau Password salah.' });
  }

  user.lastLogin = new Date().toISOString();
  db.saveDatabase();

  db.logActivity({
    userId: user.id,
    username: user.username,
    role: user.role,
    module: 'AUTH',
    action: 'LOGIN',
    description: `Pengguna ${user.fullName} (${user.role}) berhasil masuk ke sistem`,
    ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1'
  });

  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;

  return res.json({
    token,
    user: safeUser,
    settings: data.settings
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }
  const { passwordHash: _, ...safeUser } = req.user;
  return res.json({
    user: safeUser,
    settings: db.getData().settings
  });
});

// POST /api/auth/demo-login - Convenient switcher for test/evaluating different roles easily
router.post('/demo-login', (req: Request, res: Response) => {
  const { role } = req.body;
  const data = db.getData();
  const user = data.users.find((u) => u.role === role && u.isActive);

  if (!user) {
    return res.status(404).json({ error: `Pengguna untuk role ${role} tidak ditemukan.` });
  }

  user.lastLogin = new Date().toISOString();
  db.saveDatabase();

  db.logActivity({
    userId: user.id,
    username: user.username,
    role: user.role,
    module: 'AUTH',
    action: 'LOGIN',
    description: `Login cepat simulasi akun: ${user.fullName} (${user.role})`,
    ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1'
  });

  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;

  return res.json({
    token,
    user: safeUser,
    settings: data.settings
  });
});

// PUT /api/auth/profile - Update current user profile details
router.put('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  const { fullName, email, avatarUrl, name } = req.body;
  const user = req.user;

  if (fullName !== undefined) user.fullName = String(fullName).trim();
  if (name !== undefined) user.name = String(name).trim() || user.fullName;
  if (email !== undefined) {
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Format email tidak valid.' });
    }
    user.email = String(email).trim().toLowerCase();
  }
  if (avatarUrl !== undefined) user.avatarUrl = String(avatarUrl).trim();

  // Find and update in database users array
  const dbData = db.getData();
  const dbUserIndex = dbData.users.findIndex((u) => u.id === user.id);
  if (dbUserIndex !== -1) {
    dbData.users[dbUserIndex] = { ...dbData.users[dbUserIndex], ...user };
  }

  db.saveDatabase();

  db.logActivity({
    userId: user.id,
    username: user.username,
    role: user.role,
    module: 'AUTH',
    action: 'UPDATE',
    description: `Pengguna ${user.fullName || user.username} memperbarui profil akun`,
    ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1'
  });

  const { passwordHash: _, ...safeUser } = user;
  return res.json({
    message: 'Profil akun berhasil diperbarui.',
    user: safeUser
  });
});

// GET /api/auth/my-logs - Retrieve activity logs for the current user
router.get('/my-logs', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }

  const user = req.user;
  const { module, q, limit = '100' } = req.query;

  const dbData = db.getData();
  let userLogs = dbData.activityLogs.filter(
    (log) => log.userId === user.id || log.username?.toLowerCase() === user.username.toLowerCase()
  );

  if (module && module !== 'all') {
    userLogs = userLogs.filter((log) => log.module?.toUpperCase() === String(module).toUpperCase());
  }

  if (q) {
    const term = String(q).toLowerCase();
    userLogs = userLogs.filter(
      (log) =>
        log.description?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.module?.toLowerCase().includes(term)
    );
  }

  const parsedLimit = parseInt(String(limit), 10) || 100;
  const paginatedLogs = userLogs.slice(0, parsedLimit);

  return res.json({
    logs: paginatedLogs,
    total: userLogs.length
  });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Password lama dan password baru wajib diisi.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
  }

  const user = req.user!;
  if (!bcrypt.compareSync(oldPassword, user.passwordHash)) {
    return res.status(400).json({ error: 'Password lama tidak cocok.' });
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);

  // Update in database users array
  const dbData = db.getData();
  const dbUserIndex = dbData.users.findIndex((u) => u.id === user.id);
  if (dbUserIndex !== -1) {
    dbData.users[dbUserIndex].passwordHash = user.passwordHash;
  }

  db.saveDatabase();

  db.logActivity({
    userId: user.id,
    username: user.username,
    role: user.role,
    module: 'AUTH',
    action: 'UPDATE',
    description: `Pengguna ${user.fullName || user.username} memperbarui password akun`,
    ipAddress: req.ip || '127.0.0.1'
  });

  return res.json({ message: 'Password berhasil diubah.' });
});

export default router;
