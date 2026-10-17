import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { User, LibrarySettings } from '../../src/types';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../auth';

const router = Router();

// GET /api/settings - Get settings
router.get('/', (req: Request, res: Response) => {
  return res.json(db.getData().settings);
});

// PUT /api/settings - Update library settings
router.put(
  '/',
  authMiddleware,
  requireRoles('superadmin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    data.settings = {
      ...data.settings,
      ...req.body
    };

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'SETTINGS',
      action: 'UPDATE',
      description: 'Memperbarui konfigurasi sistem dan parameter perpustakaan',
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'Pengaturan perpustakaan berhasil disimpan.', settings: data.settings });
  }
);

// GET /api/settings/users - List users with member info & statistics
router.get(
  '/users',
  authMiddleware,
  requireRoles('superadmin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const members = data.members || [];
    
    // Enrich users with member profile if linked
    const users = data.users.map(({ passwordHash: _, ...u }) => {
      const member = members.find(
        (m) => (u.memberId && m.id === u.memberId) || m.identityNumber === u.username || (m.email && m.email.toLowerCase() === u.email.toLowerCase())
      );
      return {
        ...u,
        memberInfo: member
          ? {
              id: member.id,
              identityNumber: member.identityNumber,
              type: member.type,
              classGrade: member.classGrade,
              subject: member.subject,
              phone: member.phone,
              gender: member.gender,
              status: member.status
            }
          : undefined
      };
    });

    // Count students without user account
    const studentMembers = members.filter((m) => m.type?.toUpperCase() === 'SISWA');
    const existingUserIdentities = new Set(data.users.map((u) => u.username.toLowerCase()));
    const existingUserMemberIds = new Set(data.users.filter((u) => u.memberId).map((u) => u.memberId));
    const unregisteredStudents = studentMembers.filter(
      (m) => !existingUserIdentities.has(m.identityNumber.toLowerCase()) && !existingUserMemberIds.has(m.id)
    );

    return res.json({
      total: users.length,
      users,
      stats: {
        totalUsers: users.length,
        superadmins: users.filter((u) => u.role === 'superadmin').length,
        admins: users.filter((u) => u.role === 'admin').length,
        librarians: users.filter((u) => u.role === 'pustakawan').length,
        teachers: users.filter((u) => u.role === 'guru').length,
        students: users.filter((u) => u.role === 'siswa').length,
        activeUsers: users.filter((u) => u.isActive !== false).length,
        totalStudentMembers: studentMembers.length,
        unregisteredStudentsCount: unregisteredStudents.length
      }
    });
  }
);

// GET /api/settings/users/students-preview - Preview students without accounts before auto generation
router.get(
  '/users/students-preview',
  authMiddleware,
  requireRoles('superadmin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const members = data.members || [];
    const studentMembers = members.filter((m) => m.type?.toUpperCase() === 'SISWA');
    
    const existingUserIdentities = new Set(data.users.map((u) => u.username.toLowerCase()));
    const existingUserMemberIds = new Set(data.users.filter((u) => u.memberId).map((u) => u.memberId));

    const unregisteredStudents = studentMembers.filter(
      (m) => !existingUserIdentities.has(m.identityNumber.toLowerCase()) && !existingUserMemberIds.has(m.id)
    );

    const registeredStudents = studentMembers.filter(
      (m) => existingUserIdentities.has(m.identityNumber.toLowerCase()) || existingUserMemberIds.has(m.id)
    );

    return res.json({
      totalStudents: studentMembers.length,
      unregisteredCount: unregisteredStudents.length,
      registeredCount: registeredStudents.length,
      unregisteredStudents,
      registeredStudents
    });
  }
);

// POST /api/settings/users/auto-generate-students - Batch auto-create user accounts for all students
router.post(
  '/users/auto-generate-students',
  authMiddleware,
  requireRoles('superadmin'),
  (req: AuthenticatedRequest, res: Response) => {
    const {
      passwordType = 'nis', // 'nis' | 'custom' | 'siswa123'
      customPassword = '',
      usernameFormat = 'nis', // 'nis' | 'prefix_nis'
      overwriteExisting = false
    } = req.body;

    const data = db.getData();
    const members = data.members || [];
    const studentMembers = members.filter((m) => m.type?.toUpperCase() === 'SISWA');

    if (studentMembers.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data pemustaka bertipe SISWA di dalam database.' });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const generatedList: Array<{
      id: string;
      fullName: string;
      username: string;
      plainPassword: string;
      email: string;
      nis: string;
      classGrade?: string;
      status: 'created' | 'updated' | 'skipped';
    }> = [];

    studentMembers.forEach((student) => {
      const nis = student.identityNumber?.trim() || student.id;
      const targetUsername = usernameFormat === 'prefix_nis' ? `siswa_${nis}` : nis;
      
      // Determine default password
      let plainPassword = 'siswa123';
      if (passwordType === 'nis') {
        plainPassword = nis;
      } else if (passwordType === 'custom' && customPassword.trim().length >= 6) {
        plainPassword = customPassword.trim();
      }

      // Check if user already exists
      const existingUserIndex = data.users.findIndex(
        (u) => u.username.toLowerCase() === targetUsername.toLowerCase() || (u.memberId && u.memberId === student.id)
      );

      if (existingUserIndex !== -1) {
        if (overwriteExisting) {
          // Update existing user with reset password
          data.users[existingUserIndex].passwordHash = bcrypt.hashSync(plainPassword, 10);
          data.users[existingUserIndex].fullName = student.name;
          data.users[existingUserIndex].name = student.name;
          data.users[existingUserIndex].role = 'siswa';
          data.users[existingUserIndex].memberId = student.id;
          data.users[existingUserIndex].isActive = true;

          updatedCount++;
          generatedList.push({
            id: data.users[existingUserIndex].id,
            fullName: student.name,
            username: targetUsername,
            plainPassword,
            email: student.email || `${nis}@sman3nganjuk.sch.id`,
            nis,
            classGrade: student.classGrade,
            status: 'updated'
          });
        } else {
          skippedCount++;
          generatedList.push({
            id: data.users[existingUserIndex].id,
            fullName: student.name,
            username: targetUsername,
            plainPassword: '*** (sudah ada)',
            email: data.users[existingUserIndex].email,
            nis,
            classGrade: student.classGrade,
            status: 'skipped'
          });
        }
      } else {
        // Create new student user
        const newUserId = 'usr-std-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const email = student.email && student.email.includes('@')
          ? student.email.trim().toLowerCase()
          : `${nis}@sman3nganjuk.sch.id`;

        const newStudentUser: User = {
          id: newUserId,
          username: targetUsername,
          email,
          fullName: student.name,
          name: student.name,
          role: 'siswa',
          passwordHash: bcrypt.hashSync(plainPassword, 10),
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}`,
          memberId: student.id,
          isActive: true,
          createdAt: new Date().toISOString()
        };

        data.users.push(newStudentUser);
        createdCount++;
        generatedList.push({
          id: newUserId,
          fullName: student.name,
          username: targetUsername,
          plainPassword,
          email,
          nis,
          classGrade: student.classGrade,
          status: 'created'
        });
      }
    });

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'SETTINGS',
      action: 'CREATE',
      description: `Generasi otomatis akun pengguna siswa: ${createdCount} akun baru dibuat, ${updatedCount} diperbarui, ${skippedCount} dilewati`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: `Berhasil memproses pembuatan akun siswa otomatis (${createdCount} akun baru dibuat, ${updatedCount} diperbarui).`,
      stats: {
        totalStudents: studentMembers.length,
        createdCount,
        updatedCount,
        skippedCount
      },
      generatedList
    });
  }
);

// POST /api/settings/users - Create single user
router.post(
  '/users',
  authMiddleware,
  requireRoles('superadmin'),
  (req: AuthenticatedRequest, res: Response) => {
    const { username, email, fullName, name, role, password, avatarUrl, memberId, isActive = true } = req.body;
    if (!username || !email || (!fullName && !name) || !role || !password) {
      return res.status(400).json({ error: 'Seluruh kolom wajib diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal terdiri dari 6 karakter.' });
    }

    const data = db.getData();
    if (data.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: `Username "${username}" sudah digunakan.` });
    }
    if (data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: `Email "${email}" sudah digunakan.` });
    }

    const finalName = (fullName || name || '').trim();
    const newUser: User = {
      id: 'usr-' + Date.now(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      fullName: finalName,
      name: finalName,
      role,
      passwordHash: bcrypt.hashSync(password, 10),
      avatarUrl: avatarUrl?.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`,
      memberId: memberId || undefined,
      isActive: Boolean(isActive),
      createdAt: new Date().toISOString()
    };

    data.users.push(newUser);
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'SETTINGS',
      action: 'CREATE',
      recordId: newUser.id,
      recordIdentifier: newUser.username,
      description: `Membuat akun pengguna baru: ${newUser.fullName} (${newUser.role})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ message: 'Pengguna baru berhasil ditambahkan.', user: safeUser });
  }
);

// PUT /api/settings/users/:id - Update user details
router.put(
  '/users/:id',
  authMiddleware,
  requireRoles('superadmin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const userIndex = data.users.findIndex((u) => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const user = data.users[userIndex];
    const { fullName, name, username, email, role, isActive, memberId, avatarUrl } = req.body;

    // Check duplicate username if changed
    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const exists = data.users.some((u) => u.id !== user.id && u.username.toLowerCase() === username.trim().toLowerCase());
      if (exists) {
        return res.status(400).json({ error: `Username "${username}" sudah digunakan oleh akun lain.` });
      }
      user.username = username.trim();
    }

    // Check duplicate email if changed
    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const exists = data.users.some((u) => u.id !== user.id && u.email.toLowerCase() === email.trim().toLowerCase());
      if (exists) {
        return res.status(400).json({ error: `Email "${email}" sudah digunakan oleh akun lain.` });
      }
      user.email = email.trim().toLowerCase();
    }

    if (fullName !== undefined || name !== undefined) {
      const newName = (fullName || name || '').trim();
      user.fullName = newName;
      user.name = newName;
    }

    // Protect last superadmin from demoting themselves to a non-admin role
    if (role !== undefined && role !== user.role) {
      if (user.role === 'superadmin' && role !== 'superadmin') {
        const superadminCount = data.users.filter((u) => u.role === 'superadmin' && u.isActive).length;
        if (superadminCount <= 1) {
          return res.status(400).json({ error: 'Tidak dapat mengubah role: Minimal harus ada 1 Superadmin aktif di dalam sistem.' });
        }
      }
      user.role = role;
    }

    if (isActive !== undefined) {
      // Prevent disabling the currently logged-in superadmin
      if (user.id === req.user!.id && !isActive) {
        return res.status(400).json({ error: 'Anda tidak dapat menonaktifkan akun Superadmin Anda sendiri yang sedang aktif.' });
      }
      user.isActive = Boolean(isActive);
    }

    if (memberId !== undefined) {
      user.memberId = memberId ? String(memberId) : undefined;
    }

    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl.trim();
    }

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'SETTINGS',
      action: 'UPDATE',
      recordId: user.id,
      recordIdentifier: user.username,
      description: `Memperbarui profil akun pengguna: ${user.fullName} (${user.role})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ message: 'Data pengguna berhasil diperbarui.', user: safeUser });
  }
);

// POST /api/settings/users/:id/reset-password - Reset password modal action
router.post(
  '/users/:id/reset-password',
  authMiddleware,
  requireRoles('superadmin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const user = data.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const { newPassword, passwordType = 'custom' } = req.body;
    let finalPassword = '';

    if (newPassword && newPassword.trim().length >= 6) {
      finalPassword = newPassword.trim();
    } else if (passwordType === 'nis' && user.memberId) {
      const member = data.members.find((m) => m.id === user.memberId);
      finalPassword = member?.identityNumber || user.username;
    } else if (passwordType === 'role_default') {
      finalPassword = user.role === 'siswa' ? 'siswa123' : user.role === 'guru' ? 'guru123' : 'admin123';
    } else if (passwordType === 'random') {
      finalPassword = 'WP-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '!';
    } else {
      finalPassword = 'password123';
    }

    user.passwordHash = bcrypt.hashSync(finalPassword, 10);
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'SETTINGS',
      action: 'UPDATE',
      recordId: user.id,
      recordIdentifier: user.username,
      description: `Mereset password pengguna: ${user.fullName} (@${user.username})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({
      message: `Password pengguna @${user.username} berhasil direset.`,
      newPassword: finalPassword,
      user: safeUser
    });
  }
);

// POST /api/settings/users/:id/toggle-status - Fast toggle active/inactive status
router.post(
  '/users/:id/toggle-status',
  authMiddleware,
  requireRoles('superadmin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const user = data.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    if (user.id === req.user!.id) {
      return res.status(400).json({ error: 'Anda tidak dapat menonaktifkan akun Superadmin Anda sendiri yang sedang aktif.' });
    }

    user.isActive = !user.isActive;
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'SETTINGS',
      action: 'UPDATE',
      recordId: user.id,
      recordIdentifier: user.username,
      description: `Mengubah status akun pengguna ${user.fullName} menjadi ${user.isActive ? 'AKTIF' : 'NONAKTIF'}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({
      message: `Status akun @${user.username} berhasil diubah menjadi ${user.isActive ? 'Aktif' : 'Nonaktif'}.`,
      user: safeUser
    });
  }
);

// DELETE /api/settings/users/:id - Delete user with guard
router.delete(
  '/users/:id',
  authMiddleware,
  requireRoles('superadmin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const user = data.users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    if (user.id === req.user!.id) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' });
    }

    if (user.role === 'superadmin') {
      const superadminCount = data.users.filter((u) => u.role === 'superadmin').length;
      if (superadminCount <= 1) {
        return res.status(400).json({ error: 'Tidak dapat menghapus: Minimal harus ada 1 akun Superadmin tersisa di sistem.' });
      }
    }

    data.users = data.users.filter((u) => u.id !== user.id);
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'SETTINGS',
      action: 'DELETE',
      recordId: user.id,
      recordIdentifier: user.username,
      description: `Menghapus akun pengguna: ${user.fullName} (@${user.username})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: `Pengguna ${user.fullName} (@${user.username}) berhasil dihapus.` });
  }
);

// GET /api/settings/logs and /api/settings/activity-logs - System activity audit trail
router.get(
  ['/logs', '/activity-logs'],
  authMiddleware,
  (req: AuthenticatedRequest, res: Response) => {
    const { module, action, query } = req.query as { module?: string; action?: string; query?: string };
    let logs = db.getData().activityLogs;

    if (module && module !== 'all') {
      logs = logs.filter((l) => l.module === module);
    }
    if (action && action !== 'all') {
      logs = logs.filter((l) => l.action === action);
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      logs = logs.filter(
        (l) =>
          l.description.toLowerCase().includes(q) ||
          l.username.toLowerCase().includes(q) ||
          (l.recordIdentifier && l.recordIdentifier.toLowerCase().includes(q))
      );
    }

    return res.json({ total: logs.length, logs });
  }
);

// GET /api/settings/backup and /api/settings/backups/download - Download full database JSON
router.get(
  ['/backup', '/backups/download'],
  authMiddleware,
  requireRoles('superadmin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    return res.json(data);
  }
);

// POST /api/settings/gas-sync - Sync database to Google Apps Script Web App
router.post(
  '/gas-sync',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = db.getData();
      const settings = data.settings;
      const gasUrl = req.body.gasWebAppUrl || settings.gasWebAppUrl;

      if (!gasUrl) {
        return res.status(400).json({
          error: 'URL Web App Google Apps Script belum diisi. Silakan masukkan URL Web App yang telah disebarkan (deploy).'
        });
      }

      const payload = {
        action: 'SYNC_ALL',
        timestamp: new Date().toISOString(),
        spreadsheetId: settings.googleSpreadsheetId || '1VlKdmIhyMOIQtdgGu5SebRy4wP216THGt9dMPuQfyOA',
        driveFolderId: settings.googleDriveFolderId || '1KpUK7yn2CZeTQGKAjdvQWdC662dkOna3',
        data: {
          books: data.books.map((b) => ({
            ID: b.id,
            ISBN: b.isbn || '-',
            Judul: b.title,
            Pengarang: b.author,
            Penerbit: b.publisher,
            Tahun: b.publishYear,
            Kategori: b.category,
            No_Panggil: b.callNumber,
            Total_Eksemplar: b.totalCopies || 0,
            Tersedia: b.availableCopies || 0
          })),
          members: data.members.map((m) => ({
            ID: m.id,
            Kode_Anggota: m.memberCode,
            Nama: m.name,
            Tipe: m.type,
            NIS_NIP: m.identityNumber,
            Kelas: m.classGrade || '-',
            Status: m.status,
            Email: m.email
          })),
          loans: data.loans.map((l) => ({
            Kode_Pinjam: l.loanCode,
            Member: l.memberName,
            Member_Code: l.memberCode,
            Tgl_Pinjam: l.loanDate,
            Tgl_Jatuh_Tempo: l.dueDate,
            Tgl_Kembali: l.returnDate || '-',
            Status: l.status,
            Jumlah_Buku: l.items.length
          })),
          fines: data.fines.map((f) => ({
            ID: f.id,
            Kode_Denda: f.fineCode || f.id,
            Anggota: f.memberName,
            Buku: f.bookTitle,
            Total_Denda: f.totalFine,
            Dibayar: f.paidAmount,
            Status: f.status
          })),
          visitors:
            (data as any).visitors?.map((v: any) => ({
              ID: v.id,
              Nama: v.memberName,
              Kode: v.memberCode,
              Tipe: v.memberType,
              Tgl_Kunjung: v.visitDate,
              Tujuan: v.purpose
            })) || []
        }
      };

      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resultText = await response.text();
      let resultJson;
      try {
        resultJson = JSON.parse(resultText);
      } catch (e) {
        resultJson = { raw: resultText };
      }

      return res.json({
        message: 'Sinkronisasi ke Google Spreadsheet & Drive berhasil dikirim.',
        status: response.status,
        result: resultJson
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Gagal melakukan sinkronisasi: ' + err.message });
    }
  }
);

// POST /api/settings/restore and /api/settings/backups/restore - Restore database from JSON
router.post(
  ['/restore', '/backups/restore'],
  authMiddleware,
  requireRoles('superadmin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const databaseContent = req.body.data || req.body.databaseContent || req.body;
    if (!databaseContent || !databaseContent.books || !databaseContent.users) {
      return res.status(400).json({ error: 'File data backup tidak valid atau struktur tidak cocok.' });
    }

    db.saveDatabase(databaseContent);

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'BACKUP',
      action: 'BACKUP_RESTORE',
      description: 'Melakukan pemulihan (Restore) penuh database sistem dari file cadangan',
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'Database berhasil dipulihkan dari cadangan.' });
  }
);

// GET /api/settings/backups - List backups
router.get(
  '/backups',
  authMiddleware,
  requireRoles('superadmin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const backups = db.getData().backups;
    return res.json({ total: backups.length, backups });
  }
);

// POST /api/settings/backups - Create new database backup snapshot
router.post(
  '/backups',
  authMiddleware,
  requireRoles('superadmin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const { notes } = req.body;
    const data = db.getData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_sman3nganjuk_${timestamp}.json`;
    const jsonString = JSON.stringify(data, null, 2);
    const fileSizeKb = Math.round(Buffer.byteLength(jsonString, 'utf8') / 1024) || 1;

    const backup = {
      id: 'bak-' + Date.now(),
      filename,
      createdAt: new Date().toISOString(),
      createdBy: req.user!.fullName,
      fileSizeKb,
      itemCount: data.items.length,
      status: 'success' as const,
      notes: notes || 'Backup database sistem'
    };

    data.backups.unshift(backup);
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'BACKUP',
      action: 'BACKUP_CREATE',
      recordId: backup.id,
      recordIdentifier: backup.filename,
      description: `Membuat file snapshot backup database (${backup.fileSizeKb} KB)`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ message: 'Backup database berhasil dibuat.', backup });
  }
);

// Master Data Endpoints: Categories, Locations, Publishers, Authors, Serials
router.get('/master', (req: Request, res: Response) => {
  const data = db.getData();
  const categoryNames = data.categories.map((c) => (typeof c === 'string' ? c : c.name));
  const locationNames = data.locations.map((l) => (typeof l === 'string' ? l : l.name));

  return res.json({
    categories: categoryNames,
    categoryDetails: data.categories,
    locations: locationNames,
    locationDetails: data.locations,
    publishers: data.publishers,
    authors: data.authors,
    serials: data.serials
  });
});

// POST /api/settings/master - Update master categories and locations
router.post(
  '/master',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const { categories, locations } = req.body;
    const data = db.getData();

    if (Array.isArray(categories)) {
      data.categories = categories.map((c, index) => {
        if (typeof c === 'object' && c !== null) return c;
        const name = String(c);
        const existing = data.categories.find((item) => (typeof item === 'object' ? item.name === name : item === name));
        if (existing && typeof existing === 'object') return existing;
        return {
          id: `cat-${index + 1}-${Date.now()}`,
          code: String(index * 100).padStart(3, '0'),
          name,
          ddcRange: `${index * 100} - ${index * 100 + 99}`
        };
      });
    }

    if (Array.isArray(locations)) {
      data.locations = locations.map((l, index) => {
        if (typeof l === 'object' && l !== null) return l;
        const name = String(l);
        const existing = data.locations.find((item) => (typeof item === 'object' ? item.name === name : item === name));
        if (existing && typeof existing === 'object') return existing;
        return {
          id: `loc-${index + 1}-${Date.now()}`,
          code: `RAK-${index + 1}`,
          name,
          room: 'Ruang Koleksi Utama',
          shelf: `Lantai 1, Baris ${index + 1}`,
          capacity: 150
        };
      });
    }

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'SETTINGS',
      action: 'UPDATE',
      description: 'Memperbarui master data kategori dan rak perpustakaan',
      ipAddress: req.ip || '127.0.0.1'
    });

    const categoryNames = data.categories.map((c) => (typeof c === 'string' ? c : c.name));
    const locationNames = data.locations.map((l) => (typeof l === 'string' ? l : l.name));

    return res.json({
      message: 'Master data berhasil diperbarui.',
      categories: categoryNames,
      locations: locationNames
    });
  }
);

export default router;
