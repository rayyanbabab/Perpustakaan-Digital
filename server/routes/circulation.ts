import { Router, Request, Response } from 'express';
import { db } from '../db';
import { Loan, LoanItem, Fine, Reservation, ItemCondition } from '../../src/types';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../auth';

const router = Router();

// GET /api/circulation/loans - List loans with filter (active, overdue, returned)
router.get('/loans', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.syncOverdueLoans();
  const { status, memberId, query } = req.query as { status?: string; memberId?: string; query?: string };
  let loans = db.getData().loans;

  if (status && status !== 'all') {
    loans = loans.filter((l) => l.status === status);
  }

  if (memberId) {
    loans = loans.filter((l) => l.memberId === memberId);
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    loans = loans.filter(
      (l) =>
        l.loanCode.toLowerCase().includes(q) ||
        l.memberName.toLowerCase().includes(q) ||
        l.memberCode.toLowerCase().includes(q) ||
        l.items.some((item) => item.bookTitle.toLowerCase().includes(q) || item.barcode.toLowerCase().includes(q))
    );
  }

  loans.sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());
  return res.json({ total: loans.length, loans });
});

// POST /api/circulation/bulk-loan-import - Bulk Loan Import
router.post(
  '/bulk-loan-import',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const { loans } = req.body;
    if (!loans || !Array.isArray(loans)) {
      return res.status(400).json({ error: 'Data peminjaman tidak valid.' });
    }

    const data = db.getData();
    const results = {
      importedCount: 0,
      errors: [] as string[]
    };

    loans.forEach((loan: any, index: number) => {
      // 1. Validate member
      const member = data.members.find(
        (m) => m.memberCode === loan.memberCode || m.identityNumber === loan.memberCode
      );
      if (!member || member.status !== 'active') {
        results.errors.push(`Baris ${index + 1}: Anggota ${loan.memberCode} tidak ditemukan atau tidak aktif.`);
        return;
      }

      // 2. Validate book
      const item = data.items.find((i) => i.barcode === loan.barcode);
      if (!item || item.status !== 'available') {
        results.errors.push(`Baris ${index + 1}: Buku ${loan.barcode} tidak ditemukan atau tidak tersedia.`);
        return;
      }

      const book = data.books.find((b) => b.id === item.bookId);
      if (!book || book.category !== 'Buku Mata Pelajaran') {
        results.errors.push(`Baris ${index + 1}: Buku ${loan.barcode} bukan merupakan Buku Mata Pelajaran.`);
        return;
      }
      
      // 3. Create Loan Record
      const newLoan: Loan = {
        id: 'loan-' + Date.now() + index,
        loanCode: `PJ-${loan.loanDate.replace(/-/g, '')}-${(data.loans.length + results.importedCount + 1).toString().padStart(4, '0')}`,
        memberId: member.id,
        memberCode: member.memberCode,
        memberName: member.name,
        memberType: member.type,
        officerId: req.user!.id,
        officerName: req.user!.fullName,
        loanDate: loan.loanDate,
        dueDate: loan.dueDate,
        status: 'active',
        extensionCount: 0,
        maxExtensions: 2,
        items: [{
          itemId: item.id,
          bookId: book!.id,
          barcode: item.barcode,
          bookTitle: book!.title,
          author: book!.author,
          callNumber: book!.callNumber,
          coverUrl: book!.coverUrl
        }]
      };

      // Update item status
      item.status = 'borrowed';
      data.loans.unshift(newLoan);
      results.importedCount++;
    });

    db.saveDatabase();
    return res.json({ 
      message: `Berhasil mengimpor ${results.importedCount} data peminjaman.`, 
      importedCount: results.importedCount,
      errors: results.errors 
    });
  }
);

// POST /api/circulation/return and /api/circulation/return-by-barcode - Fast Scan-to-Return Transaction
router.post(
  ['/return', '/return-by-barcode'],
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    db.syncOverdueLoans();
    const { barcode, condition = 'good', isDamaged = false, isLost = false, notes } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode buku wajib dipindai.' });
    }

    const data = db.getData();
    const cleanBarcode = barcode.trim();

    // Find active loan containing this barcode
    const loan = data.loans.find(
      (l) =>
        (l.status === 'active' || l.status === 'overdue') &&
        l.items.some((item) => item.barcode.toLowerCase() === cleanBarcode.toLowerCase() && !item.returnedAt)
    );

    if (!loan) {
      return res.status(404).json({
        error: `Tidak ada transaksi peminjaman aktif untuk buku dengan barcode "${cleanBarcode}".`
      });
    }

    const loanItem = loan.items.find(
      (item) => item.barcode.toLowerCase() === cleanBarcode.toLowerCase() && !item.returnedAt
    )!;

    const bookItem = data.items.find((i) => i.id === loanItem.itemId);

    const todayStr = new Date().toISOString().split('T')[0];
    const returnTime = new Date().toISOString();

    // 1. Calculate Overdue Fine
    const dueDate = new Date(loan.dueDate);
    const returnDate = new Date(todayStr);
    const diffTime = returnDate.getTime() - dueDate.getTime();
    const daysLate = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    let overdueFine = 0;
    // apply grace period
    if (daysLate > data.settings.gracePeriodDays) {
      overdueFine = daysLate * data.settings.finePerDay;
    }

    // 2. Calculate Damage/Lost Fine
    let damageFine = 0;
    let lostFine = 0;
    const itemPrice = bookItem?.price || 50000;

    if (isDamaged || condition === 'damaged') {
      damageFine = Math.round((itemPrice * data.settings.fineDamagedPercent) / 100);
    }
    if (isLost) {
      lostFine = Math.round((itemPrice * data.settings.fineLostMultiplier) / 100);
    }

    const totalFine = overdueFine + damageFine + lostFine;
    let createdFine: Fine | null = null;

    if (totalFine > 0) {
      const fineCode = `FN-${todayStr.replace(/-/g, '').slice(0, 6)}-${(data.fines.length + 1).toString().padStart(4, '0')}`;
      let reason: Fine['reason'] = 'Keterlambatan';
      if ((damageFine > 0 || lostFine > 0) && overdueFine > 0) reason = 'Kombinasi';
      else if (damageFine > 0) reason = 'Buku Rusak';
      else if (lostFine > 0) reason = 'Buku Hilang';

      createdFine = {
        id: 'fn-' + Date.now(),
        fineCode,
        loanId: loan.id,
        memberId: loan.memberId,
        memberName: loan.memberName,
        memberCode: loan.memberCode,
        itemId: loanItem.itemId,
        bookTitle: loanItem.bookTitle,
        barcode: loanItem.barcode,
        daysLate,
        finePerDay: data.settings.finePerDay,
        damageFine,
        lostFine,
        totalFine,
        paidAmount: 0,
        status: 'unpaid',
        reason,
        officerId: req.user!.id,
        officerName: req.user!.fullName,
        createdAt: returnTime,
        notes: notes?.trim()
      };
      data.fines.push(createdFine);
    }

    // Update loan item
    loanItem.returnedAt = returnTime;
    loanItem.returnCondition = (isDamaged ? 'damaged' : condition) as ItemCondition;
    loanItem.fineAmount = totalFine;

    // If all items returned, set loan status to returned
    const allReturned = loan.items.every((i) => i.returnedAt);
    if (allReturned) {
      loan.status = 'returned';
      loan.returnDate = todayStr;
    }

    // Update item status in collection
    if (bookItem) {
      if (isLost) {
        bookItem.status = 'lost';
      } else if (isDamaged || condition === 'damaged') {
        bookItem.status = 'damaged';
        bookItem.condition = 'damaged';
      } else {
        // Check if there is a pending reservation for this book
        const pendingReservation = data.reservations.find(
          (r) => r.bookId === bookItem.bookId && r.status === 'waiting'
        );
        if (pendingReservation) {
          bookItem.status = 'reserved';
          pendingReservation.status = 'ready';
          pendingReservation.allocatedBarcode = bookItem.barcode;
        } else {
          bookItem.status = 'available';
        }
      }
    }

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'RETURNS',
      action: 'RETURN',
      recordId: loan.id,
      recordIdentifier: loanItem.barcode,
      description: `Pengembalian buku "${loanItem.bookTitle}" (${loanItem.barcode}) oleh ${loan.memberName}. Terlambat: ${daysLate} hari. Denda: Rp ${totalFine.toLocaleString('id-ID')}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: `Buku "${loanItem.bookTitle}" berhasil dikembalikan.`,
      bookTitle: loanItem.bookTitle,
      loan,
      daysLate,
      fine: createdFine,
      allReturned
    });
  }
);

// POST /api/circulation/extend/:loanId - Extend loan due date
router.post(
  '/extend/:loanId',
  authMiddleware,
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const loan = data.loans.find((l) => l.id === req.params.loanId);
    if (!loan) {
      return res.status(404).json({ error: 'Transaksi peminjaman tidak ditemukan.' });
    }

    if (loan.status === 'returned') {
      return res.status(400).json({ error: 'Peminjaman sudah selesai dikembalikan.' });
    }

    if (loan.extensionCount >= loan.maxExtensions) {
      return res.status(400).json({
        error: `Batas perpanjangan maksimal (${loan.maxExtensions} kali) sudah tercapai.`
      });
    }

    // Check member type loan duration
    const memberTypeKey = loan.memberType.toLowerCase() as 'siswa' | 'guru' | 'tendik';
    const rule = data.settings.loanRules[memberTypeKey] || { loanDurationDays: 7 };

    const currentDue = new Date(loan.dueDate);
    const newDue = new Date(currentDue.getTime() + rule.loanDurationDays * 24 * 60 * 60 * 1000);
    const newDueDateStr = newDue.toISOString().split('T')[0];

    loan.dueDate = newDueDateStr;
    loan.extensionCount += 1;
    loan.status = 'active'; // Reset overdue if it was overdue
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'LOANS',
      action: 'EXTEND',
      recordId: loan.id,
      recordIdentifier: loan.loanCode,
      description: `Perpanjangan peminjaman ${loan.loanCode} (ke-${loan.extensionCount}) hingga ${newDueDateStr}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: `Peminjaman berhasil diperpanjang hingga ${newDueDateStr}.`,
      loan
    });
  }
);

// GET /api/circulation/fines - List fines
router.get('/fines', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { status, memberId, query } = req.query as { status?: string; memberId?: string; query?: string };
  let fines = db.getData().fines;

  if (status && status !== 'all') {
    fines = fines.filter((f) => f.status === status);
  }

  if (memberId) {
    fines = fines.filter((f) => f.memberId === memberId);
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    fines = fines.filter(
      (f) =>
        f.fineCode.toLowerCase().includes(q) ||
        f.memberName.toLowerCase().includes(q) ||
        f.memberCode.toLowerCase().includes(q) ||
        f.bookTitle.toLowerCase().includes(q) ||
        f.barcode.toLowerCase().includes(q)
    );
  }

  fines.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ total: fines.length, fines });
});

// POST /api/circulation/fines/:id/pay - Pay or Waive fine
router.post(
  '/fines/:id/pay',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const { amount, action = 'pay', notes } = req.body;
    const data = db.getData();
    const fine = data.fines.find((f) => f.id === req.params.id);

    if (!fine) {
      return res.status(404).json({ error: 'Data denda tidak ditemukan.' });
    }

    if (fine.status === 'paid' || fine.status === 'waived') {
      return res.status(400).json({ error: `Denda ini sudah berstatus ${fine.status.toUpperCase()}.` });
    }

    if (action === 'waive') {
      fine.status = 'waived';
      fine.notes = notes || 'Denda dibebaskan oleh petugas perpustakaan';
      fine.paidAt = new Date().toISOString();

      db.logActivity({
        userId: req.user!.id,
        username: req.user!.username,
        role: req.user!.role,
        module: 'FINES',
        action: 'WAIVE_FINE',
        recordId: fine.id,
        recordIdentifier: fine.fineCode,
        description: `Pembebasan denda ${fine.fineCode} (${fine.memberName}) sebesar Rp ${fine.totalFine.toLocaleString('id-ID')}`,
        ipAddress: req.ip || '127.0.0.1'
      });
    } else {
      const payVal = Number(amount) || fine.totalFine - fine.paidAmount;
      fine.paidAmount += payVal;

      if (fine.paidAmount >= fine.totalFine) {
        fine.status = 'paid';
        fine.paidAt = new Date().toISOString();
      } else {
        fine.status = 'partial';
      }
      fine.notes = notes || fine.notes;

      db.logActivity({
        userId: req.user!.id,
        username: req.user!.username,
        role: req.user!.role,
        module: 'FINES',
        action: 'PAY_FINE',
        recordId: fine.id,
        recordIdentifier: fine.fineCode,
        description: `Pembayaran denda ${fine.fineCode} (${fine.memberName}) sejumlah Rp ${payVal.toLocaleString('id-ID')}`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    db.saveDatabase();
    return res.json({ message: 'Pembayaran denda berhasil dicatat.', fine });
  }
);

// GET /api/circulation/reservations - List reservations
router.get('/reservations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query as { status?: string };
  let reservations = db.getData().reservations;

  if (status && status !== 'all') {
    reservations = reservations.filter((r) => r.status === status);
  }

  reservations.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  return res.json({ total: reservations.length, reservations });
});

// POST /api/circulation/reservations - Create reservation
router.post('/reservations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { bookId, memberId, notes } = req.body;
  if (!bookId) {
    return res.status(400).json({ error: 'Buku wajib dipilih.' });
  }

  const data = db.getData();
  const book = data.books.find((b) => b.id === bookId);
  if (!book) {
    return res.status(404).json({ error: 'Buku tidak ditemukan.' });
  }

  // Determine member: either provided or current logged in user
  let member = data.members.find((m) => m.id === memberId);
  if (!member && req.user?.memberId) {
    member = data.members.find((m) => m.id === req.user?.memberId);
  }
  if (!member) {
    // try finding by username or email
    member = data.members.find(
      (m) => m.email.toLowerCase() === req.user?.email.toLowerCase() || m.name.toLowerCase() === req.user?.fullName.toLowerCase()
    );
  }

  if (!member) {
    return res.status(400).json({ error: 'Data anggota pemohon reservasi tidak valid.' });
  }

  // Check if member already reserved this book
  const existing = data.reservations.find(
    (r) => r.bookId === book.id && r.memberId === member!.id && (r.status === 'waiting' || r.status === 'ready')
  );
  if (existing) {
    return res.status(400).json({ error: 'Anda sudah memiliki antrean reservasi aktif untuk buku ini.' });
  }

  const today = new Date();
  const exp = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const reservation: Reservation = {
    id: 'res-' + Date.now(),
    bookId: book.id,
    bookTitle: book.title,
    coverUrl: book.coverUrl,
    memberId: member.id,
    memberName: member.name,
    memberCode: member.memberCode,
    requestDate: today.toISOString().split('T')[0],
    expiryDate: exp.toISOString().split('T')[0],
    status: 'waiting',
    notes: notes?.trim() || 'Reservasi dibuat mandiri'
  };

  data.reservations.push(reservation);
  db.saveDatabase();

  return res.status(201).json({
    message: `Reservasi buku "${book.title}" berhasil ditempatkan dalam antrean.`,
    reservation
  });
});

// PUT /api/circulation/reservations/:id/status - Update reservation status (ready, collected, cancelled)
router.put(
  '/reservations/:id/status',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const { status } = req.body;
    const data = db.getData();
    const resv = data.reservations.find((r) => r.id === req.params.id);

    if (!resv) {
      return res.status(404).json({ error: 'Reservasi tidak ditemukan.' });
    }

    resv.status = status;
    db.saveDatabase();

    return res.json({ message: 'Status reservasi berhasil diperbarui.', reservation: resv });
  }
);

export default router;
