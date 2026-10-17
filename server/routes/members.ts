import { Router, Request, Response } from 'express';
import { db } from '../db';
import { Member, MemberType } from '../../src/types';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../auth';

const router = Router();

// Helper to enrich member with loan and fine statistics
function enrichMemberWithStats(member: Member) {
  const loans = db.getData().loans.filter((l) => l.memberId === member.id);
  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const overdueLoans = loans.filter((l) => l.status === 'overdue');
  const fines = db.getData().fines.filter((f) => f.memberId === member.id);
  const unpaidFines = fines.filter((f) => f.status === 'unpaid' || f.status === 'partial');
  const totalUnpaidFineAmount = unpaidFines.reduce((sum, f) => sum + (f.totalFine - f.paidAmount), 0);

  return {
    ...member,
    totalLoansCount: loans.length,
    activeLoansCount: activeLoans.reduce((sum, l) => sum + l.items.length, 0),
    overdueLoansCount: overdueLoans.length,
    unpaidFinesCount: unpaidFines.length,
    totalUnpaidFineAmount,
    activeLoans,
    unpaidFines
  };
}

// Helper to determine Grade level from class name
export function getGradeLevel(classGrade?: string): 'X' | 'XI' | 'XII' | 'OTHER' {
  if (!classGrade) return 'OTHER';
  const c = classGrade.toUpperCase().trim();
  if (c.startsWith('XII') || c.includes('KELAS XII') || c.includes('KELAS 12') || c.startsWith('12')) return 'XII';
  if (c.startsWith('XI') || c.includes('KELAS XI') || c.includes('KELAS 11') || c.startsWith('11')) return 'XI';
  if (c.startsWith('X') || c.includes('KELAS X') || c.includes('KELAS 10') || c.startsWith('10')) return 'X';
  return 'OTHER';
}

// GET /api/members - List members with filters
router.get('/', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { query, q, type, status, grade, classGrade } = req.query as {
    query?: string;
    q?: string;
    type?: string;
    status?: string;
    grade?: string;
    classGrade?: string;
  };
  let members = db.getData().members;

  const searchQuery = (query || q || '').toLowerCase().trim();
  if (searchQuery) {
    members = members.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery) ||
        m.memberCode.toLowerCase().includes(searchQuery) ||
        m.identityNumber.toLowerCase().includes(searchQuery) ||
        (m.nisn && m.nisn.includes(searchQuery)) ||
        (m.classGrade && m.classGrade.toLowerCase().includes(searchQuery)) ||
        (m.subject && m.subject.toLowerCase().includes(searchQuery)) ||
        (m.phone && m.phone.includes(searchQuery))
    );
  }

  if (type && type !== 'all') {
    members = members.filter((m) => m.type.toUpperCase() === type.toUpperCase());
  }

  if (grade && grade !== 'all') {
    members = members.filter((m) => {
      if (m.type !== 'SISWA') return false;
      return getGradeLevel(m.classGrade) === grade;
    });
  }

  if (classGrade && classGrade !== 'all') {
    members = members.filter((m) => {
      if (!m.classGrade) return false;
      return m.classGrade.trim().toLowerCase() === classGrade.trim().toLowerCase();
    });
  }

  if (status && status !== 'all') {
    members = members.filter((m) => m.status === status);
  }

  const enriched = members.map(enrichMemberWithStats);
  return res.json({
    total: enriched.length,
    members: enriched
  });
});

// GET /api/members/by-code/:code and /api/members/code/:code - Lookup for barcode scanning
router.get(['/by-code/:code', '/code/:code'], (req: Request, res: Response) => {
  const code = req.params.code.trim();
  const data = db.getData();
  const member = data.members.find(
    (m) =>
      m.memberCode.toLowerCase() === code.toLowerCase() ||
      m.identityNumber.toLowerCase() === code.toLowerCase() ||
      (m.nisn && m.nisn.toLowerCase() === code.toLowerCase())
  );

  if (!member) {
    return res.status(404).json({ error: `Anggota dengan kode/identitas "${code}" tidak ditemukan.` });
  }

  const enriched = enrichMemberWithStats(member);
  return res.json(enriched);
});

// GET /api/members/:id - Detail member
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const member = db.getData().members.find((m) => m.id === req.params.id);
  if (!member) {
    return res.status(404).json({ error: 'Anggota tidak ditemukan.' });
  }

  const enriched = enrichMemberWithStats(member);
  const loanHistory = db.getData().loans.filter((l) => l.memberId === member.id);
  const fineHistory = db.getData().fines.filter((f) => f.memberId === member.id);

  return res.json({
    member: enriched,
    loanHistory,
    fineHistory
  });
});

// POST /api/members - Create member
router.post(
  '/',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const {
      type,
      identityNumber,
      nisn,
      name,
      gender,
      classGrade,
      major,
      subject,
      position,
      entryYear,
      phone,
      email,
      address,
      photoUrl,
      notes
    } = req.body;

    if (!type || !identityNumber || !name) {
      return res.status(400).json({ error: 'Tipe Anggota, Nomor Identitas (NIS/NIP), dan Nama wajib diisi.' });
    }

    const data = db.getData();
    const existing = data.members.find(
      (m) => m.identityNumber.trim() === identityNumber.trim() || m.memberCode.trim() === identityNumber.trim()
    );

    if (existing) {
      return res.status(400).json({
        error: `Nomor identitas ${identityNumber} sudah terdaftar atas nama ${existing.name}.`
      });
    }

    const newMemberId = 'mem-' + type.toLowerCase() + '-' + Date.now();
    const regDate = new Date().toISOString().split('T')[0];
    const expDate = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 years

    const newMember: Member = {
      id: newMemberId,
      memberCode: identityNumber.trim(),
      type: type as MemberType,
      identityNumber: identityNumber.trim(),
      nisn: nisn?.trim(),
      name: name.trim(),
      gender: gender || 'L',
      classGrade: classGrade?.trim(),
      major: major?.trim(),
      subject: subject?.trim(),
      position: position?.trim(),
      entryYear: Number(entryYear) || new Date().getFullYear(),
      phone: phone?.trim() || '-',
      email: email?.trim() || `${identityNumber.trim()}@sman3nganjuk.sch.id`,
      address: address?.trim() || 'Nganjuk, Jawa Timur',
      photoUrl: photoUrl?.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
      status: 'active',
      registeredDate: regDate,
      expiryDate: expDate,
      notes: notes?.trim()
    };

    data.members.unshift(newMember);
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'MEMBERS',
      action: 'CREATE',
      recordId: newMember.id,
      recordIdentifier: newMember.memberCode,
      description: `Menambahkan anggota baru: ${newMember.name} (${newMember.type} - ${newMember.identityNumber})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({
      message: 'Anggota berhasil didaftarkan.',
      member: enrichMemberWithStats(newMember)
    });
  }
);

// PUT /api/members/:id - Update member
router.put(
  '/:id',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const index = data.members.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Anggota tidak ditemukan.' });
    }

    const updated: Member = {
      ...data.members[index],
      ...req.body,
      id: req.params.id
    };

    data.members[index] = updated;
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'MEMBERS',
      action: 'UPDATE',
      recordId: updated.id,
      recordIdentifier: updated.memberCode,
      description: `Memperbarui data anggota: ${updated.name}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: 'Data anggota berhasil diperbarui.',
      member: enrichMemberWithStats(updated)
    });
  }
);

// DELETE /api/members/:id - Delete member
router.delete(
  '/:id',
  authMiddleware,
  requireRoles('superadmin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const member = data.members.find((m) => m.id === req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Anggota tidak ditemukan.' });
    }

    // Check if member has active loans or unpaid fines
    const hasActiveLoans = data.loans.some(
      (l) => l.memberId === member.id && (l.status === 'active' || l.status === 'overdue')
    );
    if (hasActiveLoans) {
      return res.status(400).json({
        error: 'Tidak dapat menghapus anggota karena masih memiliki peminjaman buku yang aktif.'
      });
    }

    data.members = data.members.filter((m) => m.id !== member.id);
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'MEMBERS',
      action: 'DELETE',
      recordId: member.id,
      recordIdentifier: member.memberCode,
      description: `Menghapus anggota: ${member.name} (${member.memberCode})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'Anggota berhasil dihapus.' });
  }
);

// PATCH /api/members/:id/status - Quick toggle / update single member status
router.patch(
  '/:id/status',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const { status, reason, classGrade } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status wajib diisi.' });
    }

    const data = db.getData();
    const member = data.members.find((m) => m.id === req.params.id);
    if (!member) {
      return res.status(404).json({ error: 'Anggota tidak ditemukan.' });
    }

    const oldStatus = member.status;
    member.status = status;
    if (classGrade) {
      member.classGrade = classGrade;
    }

    if (reason) {
      const dateStr = new Date().toLocaleDateString('id-ID');
      member.notes = member.notes
        ? `${member.notes} | [${dateStr}] Ubah status (${oldStatus} -> ${status}): ${reason}`
        : `[${dateStr}] Ubah status (${oldStatus} -> ${status}): ${reason}`;
    }

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'MEMBERS',
      action: 'UPDATE',
      recordId: member.id,
      recordIdentifier: member.memberCode,
      description: `Ubah status anggota ${member.name}: ${oldStatus} -> ${status} (${reason || 'Update status'})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: `Status anggota ${member.name} berhasil diubah menjadi "${status}".`,
      member: enrichMemberWithStats(member)
    });
  }
);

// POST /api/members/bulk-status - Bulk update member status (e.g. graduation, mass deactivation/activation)
router.post(
  '/bulk-status',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const { memberIds, criteria, targetStatus, reason } = req.body;
    if (!targetStatus) {
      return res.status(400).json({ error: 'Status target wajib dipilih.' });
    }

    const data = db.getData();
    let targetMembers: Member[] = [];

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      targetMembers = data.members.filter((m) => memberIds.includes(m.id));
    } else if (criteria) {
      targetMembers = data.members.filter((m) => {
        if (criteria.type && criteria.type !== 'all' && m.type.toUpperCase() !== criteria.type.toUpperCase()) {
          return false;
        }
        if (criteria.grade && criteria.grade !== 'all') {
          const mGrade = getGradeLevel(m.classGrade);
          if (mGrade !== criteria.grade) return false;
        }
        if (criteria.classGrade && criteria.classGrade !== 'all' && m.classGrade !== criteria.classGrade) {
          return false;
        }
        if (criteria.currentStatus && criteria.currentStatus !== 'all' && m.status !== criteria.currentStatus) {
          return false;
        }
        return true;
      });
    }

    if (targetMembers.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data siswa/anggota yang sesuai dengan kriteria yang dipilih.' });
    }

    const warnings: string[] = [];
    let updatedCount = 0;
    const dateStr = new Date().toLocaleDateString('id-ID');

    targetMembers.forEach((member) => {
      // Check active loans if deactivating
      if (targetStatus !== 'active') {
        const hasActiveLoan = data.loans.some(
          (l) => l.memberId === member.id && (l.status === 'active' || l.status === 'overdue')
        );
        if (hasActiveLoan) {
          warnings.push(`${member.name} (${member.identityNumber}) masih memiliki peminjaman buku aktif.`);
        }
      }

      const oldStatus = member.status;
      member.status = targetStatus;
      if (reason) {
        member.notes = member.notes
          ? `${member.notes} | [${dateStr}] Massal (${oldStatus}->${targetStatus}): ${reason}`
          : `[${dateStr}] Massal (${oldStatus}->${targetStatus}): ${reason}`;
      }
      updatedCount++;
    });

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'MEMBERS',
      action: 'UPDATE',
      description: `Ubah status massal ke "${targetStatus}" untuk ${updatedCount} anggota. Alasan: ${reason || '-'}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: `Berhasil memperbarui status ${updatedCount} anggota menjadi "${targetStatus}".`,
      count: updatedCount,
      warnings
    });
  }
);

// POST /api/members/bulk-import - Bulk import members from CSV
router.post(
  '/bulk-import',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Data anggota kosong atau tidak valid.' });
    }

    const data = db.getData();
    let importedCount = 0;
    const errors: string[] = [];

    members.forEach((m: any, index: number) => {
      if (!m.name || !m.identityNumber) {
        errors.push(`Baris ${index + 1}: Nama dan Nomor Identitas (NIS/NIP) wajib diisi.`);
        return;
      }

      if (data.members.some((existing) => existing.identityNumber.trim() === m.identityNumber.trim())) {
        errors.push(`Baris ${index + 1}: Nomor identitas ${m.identityNumber} sudah terdaftar.`);
        return;
      }

      const type: MemberType = (m.type?.toUpperCase() === 'GURU' ? 'GURU' : m.type?.toUpperCase() === 'TENDIK' ? 'TENDIK' : 'SISWA');
      const newMember: Member = {
        id: 'mem-imp-' + Date.now() + '-' + index,
        memberCode: m.identityNumber.trim(),
        type,
        identityNumber: m.identityNumber.trim(),
        nisn: m.nisn?.trim(),
        name: m.name.trim(),
        gender: m.gender === 'P' ? 'P' : 'L',
        classGrade: m.classGrade?.trim(),
        major: m.major?.trim(),
        subject: m.subject?.trim(),
        position: m.position?.trim(),
        entryYear: Number(m.entryYear) || new Date().getFullYear(),
        phone: m.phone?.trim() || '-',
        email: m.email?.trim() || `${m.identityNumber.trim()}@sman3nganjuk.sch.id`,
        address: m.address?.trim() || 'Nganjuk, Jawa Timur',
        photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name.trim())}`,
        status: 'active',
        registeredDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      data.members.push(newMember);
      importedCount++;
    });

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'MEMBERS',
      action: 'IMPORT',
      description: `Import massal anggota: ${importedCount} berhasil, ${errors.length} gagal`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: `Import anggota selesai. ${importedCount} data berhasil diimpor.`,
      importedCount,
      errors
    });
  }
);

export default router;
