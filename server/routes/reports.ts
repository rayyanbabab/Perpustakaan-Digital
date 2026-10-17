import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../auth';
import { VisitorLog } from '../../src/types';

const router = Router();

// GET /api/reports/dashboard-stats - Primary KPI metrics and chart aggregates
router.get('/dashboard-stats', (req: Request, res: Response) => {
  db.syncOverdueLoans();
  const data = db.getData();
  const today = new Date().toISOString().split('T')[0];

  const totalTitles = data.books.length;
  const totalCopies = data.items.length;
  const totalMembers = data.members.length;
  const totalStudents = data.members.filter((m) => m.type === 'SISWA').length;
  const totalTeachers = data.members.filter((m) => m.type === 'GURU').length;
  const totalTendik = data.members.filter((m) => m.type === 'TENDIK').length;

  const availableCopies = data.items.filter((i) => i.status === 'available').length;
  const borrowedCopies = data.items.filter((i) => i.status === 'borrowed').length;
  const reservedCopies = data.items.filter((i) => i.status === 'reserved').length;
  const lostCopies = data.items.filter((i) => i.status === 'lost').length;
  const damagedCopies = data.items.filter((i) => i.status === 'damaged').length;

  const activeLoans = data.loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const overdueLoans = data.loans.filter((l) => l.status === 'overdue');
  const loansToday = data.loans.filter((l) => l.loanDate === today).length;
  const returnsToday = data.loans.filter((l) => l.returnDate === today).length;
  const visitors = (data as any).visitors || (data as any).visitorLogs || [];
  const visitorsToday = visitors.filter((v: any) => (v.visitDate || '').startsWith(today)).length;

  const totalFinesCollected = data.fines
    .filter((f) => f.status === 'paid' || f.status === 'partial')
    .reduce((sum, f) => sum + f.paidAmount, 0);

  const totalUnpaidFines = data.fines
    .filter((f) => f.status === 'unpaid' || f.status === 'partial')
    .reduce((sum, f) => sum + (f.totalFine - f.paidAmount), 0);

  // Category distribution
  const categoryMap: { [key: string]: number } = {};
  data.books.forEach((b) => {
    categoryMap[b.category] = (categoryMap[b.category] || 0) + 1;
  });
  const categoryStats = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

  // Monthly loan trends (last 6 months)
  const monthlyLoans: { [key: string]: { month: string; peminjaman: number; pengembalian: number } } = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlyLoans[key] = { month: label, peminjaman: 0, pengembalian: 0 };
  }

  data.loans.forEach((l) => {
    const loanMonth = l.loanDate.slice(0, 7);
    if (monthlyLoans[loanMonth]) {
      monthlyLoans[loanMonth].peminjaman += l.items.length;
    }
    if (l.returnDate) {
      const returnMonth = l.returnDate.slice(0, 7);
      if (monthlyLoans[returnMonth]) {
        monthlyLoans[returnMonth].pengembalian += l.items.length;
      }
    }
  });

  // Top 10 Most Borrowed Books
  const bookBorrowCount: { [bookId: string]: { id: string; title: string; author: string; count: number; coverUrl: string } } = {};
  data.loans.forEach((l) => {
    l.items.forEach((item) => {
      if (!bookBorrowCount[item.bookId]) {
        bookBorrowCount[item.bookId] = {
          id: item.bookId,
          title: item.bookTitle,
          author: item.author,
          coverUrl: item.coverUrl,
          count: 0
        };
      }
      bookBorrowCount[item.bookId].count += 1;
    });
  });
  const popularBooks = Object.values(bookBorrowCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top 10 Most Active Members
  const memberActivity: { [memberId: string]: { id: string; name: string; memberCode: string; type: string; count: number; photoUrl?: string } } = {};
  data.loans.forEach((l) => {
    if (!memberActivity[l.memberId]) {
      const member = data.members.find((m) => m.id === l.memberId);
      memberActivity[l.memberId] = {
        id: l.memberId,
        name: l.memberName,
        memberCode: l.memberCode,
        type: l.memberType,
        photoUrl: member?.photoUrl,
        count: 0
      };
    }
    memberActivity[l.memberId].count += l.items.length;
  });
  const activeMembers = Object.values(memberActivity)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return res.json({
    kpis: {
      totalTitles,
      totalCopies,
      totalMembers,
      totalStudents,
      totalTeachers,
      totalTendik,
      availableCopies,
      borrowedCopies,
      reservedCopies,
      lostCopies,
      damagedCopies,
      activeLoansCount: activeLoans.length,
      overdueLoansCount: overdueLoans.length,
      loansToday,
      returnsToday,
      visitorsToday,
      totalFinesCollected,
      totalUnpaidFines
    },
    categoryStats,
    monthlyTrends: Object.values(monthlyLoans),
    popularBooks,
    activeMembers,
    recentLoans: data.loans.slice(0, 8),
    recentLogs: data.activityLogs.slice(0, 6)
  });
});

// GET /api/reports/circulation - Filtered Circulation Data
router.get('/circulation', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, status, memberType } = req.query as {
    startDate?: string;
    endDate?: string;
    status?: string;
    memberType?: string;
  };

  let loans = db.getData().loans;

  if (startDate) {
    loans = loans.filter((l) => l.loanDate >= startDate);
  }
  if (endDate) {
    loans = loans.filter((l) => l.loanDate <= endDate);
  }
  if (status && status !== 'all') {
    loans = loans.filter((l) => l.status === status);
  }
  if (memberType && memberType !== 'all') {
    loans = loans.filter((l) => l.memberType.toUpperCase() === memberType.toUpperCase());
  }

  return res.json({
    totalRecords: loans.length,
    totalBooksBorrowed: loans.reduce((sum, l) => sum + l.items.length, 0),
    loans,
    data: loans
  });
});

// GET /api/reports/visitors - Get Visitor Presensi Logs
router.get('/visitors', (req: Request, res: Response) => {
  const { startDate, endDate, limit } = req.query as { startDate?: string; endDate?: string; limit?: string };
  const data = db.getData();
  let visitors = (data as any).visitors || (data as any).visitorLogs || [];

  if (startDate) {
    visitors = visitors.filter((v: any) => v.visitDate.slice(0, 10) >= startDate);
  }
  if (endDate) {
    visitors = visitors.filter((v: any) => v.visitDate.slice(0, 10) <= endDate);
  }

  const parsedLimit = limit ? parseInt(limit, 10) : 100;
  const sliced = visitors.slice(0, parsedLimit);

  return res.json({
    total: visitors.length,
    visitors: sliced,
    data: sliced
  });
});

// POST /api/reports/visitors - Record new visitor attendance
router.post('/visitors', (req: Request, res: Response) => {
  const { memberCode, purpose = 'Membaca & Meminjam Buku' } = req.body;
  if (!memberCode) {
    return res.status(400).json({ error: 'Kode anggota / Barcode / NIS / NIP wajib diisi.' });
  }

  const data = db.getData();
  const code = String(memberCode).trim().toLowerCase();
  const member = data.members.find(
    (m) =>
      m.memberCode.toLowerCase() === code ||
      m.identityNumber.toLowerCase() === code ||
      (m.nisn && m.nisn.toLowerCase() === code) ||
      m.name.toLowerCase() === code
  );

  if (!member) {
    return res.status(404).json({ error: `Anggota dengan identitas "${memberCode}" tidak ditemukan.` });
  }

  if (!(data as any).visitors) {
    (data as any).visitors = [];
  }

  const newVisitor: VisitorLog = {
    id: 'vis-' + Date.now(),
    memberId: member.id,
    memberCode: member.memberCode,
    memberName: member.name,
    memberType: member.type,
    classGrade: member.classGrade,
    visitDate: new Date().toISOString(),
    purpose
  };

  (data as any).visitors.unshift(newVisitor);
  db.saveDatabase();

  return res.status(201).json({
    message: `Presensi atas nama ${member.name} berhasil dicatat.`,
    visitor: newVisitor
  });
});

// GET /api/reports/books - Inventory and collection statistics
router.get('/books', (req: Request, res: Response) => {
  const data = db.getData();
  const books = data.books.map((b) => {
    const items = data.items.filter((i) => i.bookId === b.id);
    return {
      ...b,
      totalCopies: items.length,
      availableCopies: items.filter((i) => i.status === 'available').length,
      borrowedCopies: items.filter((i) => i.status === 'borrowed').length,
      damagedCopies: items.filter((i) => i.status === 'damaged').length,
      lostCopies: items.filter((i) => i.status === 'lost').length
    };
  });

  return res.json({
    total: books.length,
    books,
    data: books
  });
});

// GET /api/reports/fines - Filtered Fines Data
router.get('/fines', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, status } = req.query as {
    startDate?: string;
    endDate?: string;
    status?: string;
  };

  let fines = db.getData().fines;

  if (startDate) {
    fines = fines.filter((f) => f.createdAt.slice(0, 10) >= startDate);
  }
  if (endDate) {
    fines = fines.filter((f) => f.createdAt.slice(0, 10) <= endDate);
  }
  if (status && status !== 'all') {
    fines = fines.filter((f) => f.status === status);
  }

  const totalAmount = fines.reduce((sum, f) => sum + f.totalFine, 0);
  const totalPaid = fines.reduce((sum, f) => sum + f.paidAmount, 0);
  const totalPending = totalAmount - totalPaid;

  return res.json({
    totalRecords: fines.length,
    totalAmount,
    totalPaid,
    totalPending,
    fines,
    data: fines
  });
});

// GET /api/reports/recap - Executive report indicators
router.get('/recap', (req: Request, res: Response) => {
  const data = db.getData();
  const totalTitles = data.books.length;
  const totalCopies = data.items.length;
  const totalMembers = data.members.length;
  const totalLoans = data.loans.length;
  const activeLoans = data.loans.filter((l) => l.status === 'active' || l.status === 'overdue').length;

  const recap = [
    {
      indicator: 'Total Judul Buku Koleksi (Bibliografi)',
      value: totalTitles,
      unit: 'Judul',
      notes: 'Memenuhi standar akreditasi perpustakaan sekolah'
    },
    {
      indicator: 'Total Eksemplar Fisik Tersedia',
      value: totalCopies,
      unit: 'Eksemplar',
      notes: `Rasio per siswa ~ ${(totalCopies / Math.max(1, totalMembers)).toFixed(1)} buku/anggota`
    },
    {
      indicator: 'Total Pemustaka Terdaftar (Siswa, Guru, Tendik)',
      value: totalMembers,
      unit: 'Orang',
      notes: 'Keanggotaan aktif terintegrasi NISN & NIP'
    },
    {
      indicator: 'Total Transaksi Sirkulasi Peminjaman',
      value: totalLoans,
      unit: 'Transaksi',
      notes: 'Tercatat dalam sistem otomasi Astra Library'
    },
    {
      indicator: 'Peminjaman Aktif Berjalan',
      value: activeLoans,
      unit: 'Transaksi',
      notes: 'Sirkulasi realtime'
    }
  ];

  return res.json({
    total: recap.length,
    data: recap
  });
});

// GET /api/reports/stats - Alias for stats
router.get('/stats', (req: Request, res: Response) => {
  const data = db.getData();
  return res.json({
    totalTitles: data.books.length,
    totalCopies: data.items.length,
    totalMembers: data.members.length,
    totalLoans: data.loans.length,
    data: []
  });
});

export default router;
