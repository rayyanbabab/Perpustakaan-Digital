import { Router, Request, Response } from 'express';
import { db } from '../db';
import { Loan, LoanItem, Fine, Reservation, ItemCondition } from '../../src/types';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../auth';

const router = Router();

// GET /api/circulation/loans - List loans with filter (active, overdue, returned)
router.get('/loans', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.syncOverdueLoans();
  const { status, memberId, query } = req.query as { status?: string; memberId?: string; query?: string };
  const data = db.getData();
  let loans = data.loans.map((l) => {
    const member = data.members.find((m) => m.id === l.memberId || m.memberCode === l.memberCode);
    return {
      ...l,
      memberPhone: l.memberPhone || member?.phone || '',
      memberEmail: l.memberEmail || member?.email || ''
    };
  });

  if (req.user?.role === 'siswa') {
    const userMemberId = req.user.memberId;
    const userCode = req.user.username?.toLowerCase();
    const userName = req.user.fullName?.toLowerCase();
    loans = loans.filter(
      (l) =>
        (userMemberId && l.memberId === userMemberId) ||
        (userCode && l.memberCode.toLowerCase() === userCode) ||
        (userName && l.memberName.toLowerCase().includes(userName))
    );
  }

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

// POST /api/circulation/borrow - Process Loan Transaction
router.post(
  '/borrow',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    db.syncOverdueLoans();
    const { memberId, barcodes, notes } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: 'Pilih anggota peminjam.' });
    }

    const barcodeList = Array.isArray(barcodes) ? barcodes : [barcodes].filter(Boolean);
    if (barcodeList.length === 0) {
      return res.status(400).json({ error: 'Pindai minimal 1 buku yang akan dipinjam.' });
    }

    const data = db.getData();

    // 1. Find and validate member
    const member = data.members.find(
      (m) => m.id === memberId || m.memberCode === memberId || m.identityNumber === memberId
    );
    if (!member) {
      return res.status(404).json({ error: 'Data anggota tidak ditemukan.' });
    }
    if (member.status !== 'active') {
      return res.status(400).json({ error: `Anggota tidak dapat meminjam karena berstatus: ${member.status}.` });
    }

    // 2. Validate member loan rules
    const memberTypeKey = (member.type || 'SISWA').toLowerCase() as 'siswa' | 'guru' | 'tendik';
    const rule = data.settings.loanRules[memberTypeKey] || {
      maxItems: 3,
      maxExtensions: 2,
      loanDurationDays: 7
    };

    // Count current active loans for this member
    const activeMemberLoans = data.loans.filter(
      (l) => (l.memberId === member.id || l.memberCode === member.memberCode) && (l.status === 'active' || l.status === 'overdue')
    );
    const currentBorrowedCount = activeMemberLoans.reduce((acc, l) => acc + l.items.filter((i) => !i.returnedAt).length, 0);

    if (currentBorrowedCount + barcodeList.length > rule.maxItems) {
      return res.status(400).json({
        error: `Batas kuota pinjam (${rule.maxItems} buku) terlampaui. Saat ini anggota masih meminjam ${currentBorrowedCount} buku.`
      });
    }

    // 3. Validate each book item
    const loanItems: LoanItem[] = [];
    for (const rawBarcode of barcodeList) {
      const barcode = String(rawBarcode).trim();
      const item = data.items.find((i) => i.barcode.toLowerCase() === barcode.toLowerCase());
      if (!item) {
        return res.status(404).json({ error: `Eksemplar buku dengan barcode "${barcode}" tidak ditemukan.` });
      }
      if (item.status !== 'available') {
        return res.status(400).json({ error: `Eksemplar buku "${barcode}" sedang tidak tersedia (Status: ${item.status}).` });
      }

      const book = data.books.find((b) => b.id === item.bookId);
      loanItems.push({
        itemId: item.id,
        bookId: item.bookId,
        barcode: item.barcode,
        bookTitle: book?.title || 'Koleksi Perpustakaan',
        author: book?.author || '',
        callNumber: book?.callNumber || '',
        coverUrl: book?.coverUrl || ''
      });
    }

    // 4. Calculate loan dates
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dueDate = new Date(today.getTime() + rule.loanDurationDays * 24 * 60 * 60 * 1000);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // 5. Create new loan record
    const loanCode = `PJ-${todayStr.replace(/-/g, '')}-${(data.loans.length + 1).toString().padStart(4, '0')}`;
    const newLoan: Loan = {
      id: 'loan-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      loanCode,
      memberId: member.id,
      memberCode: member.memberCode,
      memberName: member.name,
      memberType: member.type,
      memberPhone: member.phone || '',
      memberEmail: member.email || '',
      officerId: req.user!.id,
      officerName: req.user!.fullName,
      loanDate: todayStr,
      dueDate: dueDateStr,
      status: 'active',
      extensionCount: 0,
      maxExtensions: rule.maxExtensions || 2,
      items: loanItems,
      notes: notes?.trim()
    };

    // 6. Update item statuses
    barcodeList.forEach((rawBarcode: string) => {
      const barcode = String(rawBarcode).trim();
      const item = data.items.find((i) => i.barcode.toLowerCase() === barcode.toLowerCase());
      if (item) {
        item.status = 'borrowed';
      }
    });

    data.loans.unshift(newLoan);
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'LOANS',
      action: 'BORROW',
      recordId: newLoan.id,
      recordIdentifier: newLoan.loanCode,
      description: `Peminjaman ${newLoan.items.length} buku oleh ${newLoan.memberName} (${newLoan.memberCode}) hingga ${dueDateStr}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({
      message: `Peminjaman ${loanCode} berhasil diproses!`,
      loan: newLoan
    });
  }
);

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
  const { status, bookId } = req.query as { status?: string; bookId?: string };
  let reservations = db.getData().reservations || [];

  if (status && status !== 'all') {
    reservations = reservations.filter((r) => r.status === status);
  }

  if (bookId) {
    reservations = reservations.filter((r) => r.bookId === bookId);
  }

  // If student role, restrict to their own reservations
  if (req.user?.role === 'siswa') {
    const userMemberId = req.user.memberId;
    const userCode = req.user.username?.toLowerCase();
    const userName = req.user.fullName?.toLowerCase();
    reservations = reservations.filter(
      (r) =>
        (userMemberId && r.memberId === userMemberId) ||
        (userCode && r.memberCode.toLowerCase() === userCode) ||
        (userName && r.memberName.toLowerCase().includes(userName))
    );
  }

  reservations.sort((a, b) => new Date(b.requestDate || b.reservationDate || 0).getTime() - new Date(a.requestDate || a.reservationDate || 0).getTime());
  return res.json({ total: reservations.length, reservations });
});

// POST /api/circulation/reservations & /api/circulation/reserve - Create reservation
const handleCreateReservation = (req: AuthenticatedRequest, res: Response) => {
  const { bookId, notes } = req.body;
  let memberId = req.body.memberId;
  if (!bookId) {
    return res.status(400).json({ error: 'Buku wajib dipilih.' });
  }

  const data = db.getData();
  const book = data.books.find((b) => b.id === bookId);
  if (!book) {
    return res.status(404).json({ error: 'Buku tidak ditemukan.' });
  }

  // Determine member: either provided or current logged in user
  let member = data.members.find((m) => m.id === memberId || m.memberCode === memberId);
  if (!member && req.user?.memberId) {
    member = data.members.find((m) => m.id === req.user?.memberId || m.memberCode === req.user?.memberId);
  }
  if (!member && req.user) {
    member = data.members.find(
      (m) =>
        (req.user?.email && m.email.toLowerCase() === req.user.email.toLowerCase()) ||
        (req.user?.fullName && m.name.toLowerCase() === req.user.fullName.toLowerCase()) ||
        (req.user?.username && m.memberCode.toLowerCase() === req.user.username.toLowerCase())
    );
  }

  // Auto-create/link member if not yet registered in members list
  if (!member && req.user) {
    const newMemberId = req.user.memberId || ('mem-' + req.user.id);
    member = {
      id: newMemberId,
      memberCode: (req.user.username || 'SISWA').toUpperCase(),
      type: (req.user.role === 'guru' ? 'GURU' : 'SISWA') as any,
      identityNumber: req.user.username || '10101',
      name: req.user.fullName || req.user.name || req.user.username,
      gender: 'L',
      phone: '081234567890',
      email: req.user.email || `${req.user.username}@polytechnic.astra.ac.id`,
      status: 'active',
      registeredDate: new Date().toISOString().split('T')[0],
      notes: 'Otomatis dibuat saat booking buku mandiri'
    };
    data.members.push(member);
    req.user.memberId = newMemberId;
    const uIdx = data.users.findIndex((u) => u.id === req.user!.id);
    if (uIdx !== -1) {
      data.users[uIdx].memberId = newMemberId;
    }
  }

  if (!member) {
    return res.status(400).json({ error: 'Data anggota pemohon reservasi tidak valid.' });
  }

  // Check if member already reserved this book (active pending/waiting/ready)
  const existing = data.reservations.find(
    (r) => r.bookId === book.id && r.memberId === member!.id && (r.status === 'pending' || r.status === 'waiting' || r.status === 'ready')
  );
  if (existing) {
    return res.status(400).json({ error: 'Anda sudah memiliki antrean reservasi aktif untuk buku ini.' });
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const exp = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expStr = exp.toISOString().split('T')[0];
  const reservationCode = `RSV-${todayStr.replace(/-/g, '')}-${(data.reservations.length + 1).toString().padStart(4, '0')}`;

  const reservation: Reservation = {
    id: 'res-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    reservationCode,
    bookId: book.id,
    bookTitle: book.title,
    coverUrl: book.coverUrl,
    memberId: member.id,
    memberName: member.name,
    memberCode: member.memberCode,
    requestDate: todayStr,
    reservationDate: todayStr,
    expiryDate: expStr,
    status: 'pending',
    notes: notes?.trim() || 'Reservasi dibuat mandiri via OPAC'
  };

  data.reservations.unshift(reservation);
  db.saveDatabase();

  db.logActivity({
    userId: req.user?.id || 'usr-guest',
    username: req.user?.username || 'member',
    role: req.user?.role || 'siswa',
    module: 'CIRCULATION',
    action: 'RESERVE',
    description: `Booking/Reservasi buku "${book.title}" (${reservationCode}) oleh ${member.name}`,
    ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1'
  });

  return res.status(201).json({
    message: `Reservasi buku "${book.title}" berhasil ditempatkan dalam antrean.`,
    reservation
  });
};

router.post('/reservations', authMiddleware, handleCreateReservation);
router.post('/reserve', authMiddleware, handleCreateReservation);

// Update reservation status (ready, completed, cancelled) - supports PUT & PATCH
const handleUpdateReservationStatus = (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const data = db.getData();
  const resv = data.reservations.find((r) => r.id === req.params.id);

  if (!resv) {
    return res.status(404).json({ error: 'Reservasi tidak ditemukan.' });
  }

  // If status is 'cancelled', allow either the owner of the reservation OR staff
  const isOwner =
    req.user &&
    (resv.memberId === req.user.memberId ||
      resv.memberCode?.toLowerCase() === req.user.username?.toLowerCase() ||
      resv.memberName?.toLowerCase() === req.user.fullName?.toLowerCase());
  const isStaff = ['superadmin', 'admin', 'pustakawan'].includes(req.user?.role || '');

  if (status === 'cancelled') {
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Anda tidak memiliki hak untuk membatalkan reservasi ini.' });
    }
  } else {
    // Other statuses (ready, completed) require staff
    if (!isStaff) {
      return res.status(403).json({ error: 'Hanya petugas perpustakaan yang dapat mengubah status reservasi ini.' });
    }
  }

  resv.status = status;
  db.saveDatabase();

  db.logActivity({
    userId: req.user?.id || 'usr-system',
    username: req.user?.username || 'system',
    role: req.user?.role || 'siswa',
    module: 'CIRCULATION',
    action: 'UPDATE_STATUS',
    description: `Status reservasi ${resv.reservationCode || resv.id} diubah menjadi "${status}"`,
    ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1'
  });

  return res.json({ message: 'Status reservasi berhasil diperbarui.', reservation: resv });
};

router.put('/reservations/:id/status', authMiddleware, handleUpdateReservationStatus);
router.patch('/reservations/:id/status', authMiddleware, handleUpdateReservationStatus);

export default router;
