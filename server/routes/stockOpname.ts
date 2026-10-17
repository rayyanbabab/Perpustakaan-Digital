import { Router, Request, Response } from 'express';
import { db } from '../db';
import { StockOpnameSession, ItemCondition } from '../../src/types';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../auth';

const router = Router();

// Helper to prepare stock opname items list
function prepareSessionItems(session: StockOpnameSession) {
  const data = db.getData();
  const scannedMap = new Map(session.scannedItems.map((s) => [s.barcode.toLowerCase(), s]));

  return data.items.map((item) => {
    const book = data.books.find((b) => b.id === item.bookId);
    const scanInfo = scannedMap.get(item.barcode.toLowerCase());
    const isScanned = !!scanInfo;

    return {
      id: item.id,
      barcode: item.barcode,
      bookTitle: book?.title || 'Judul Tidak Ditemukan',
      author: book?.author || '-',
      callNumber: book?.callNumber || '-',
      expectedLocation: item.location,
      scannedLocation: scanInfo?.scannedLocation || item.location,
      status: scanInfo ? scanInfo.status : (session.status === 'completed' ? 'missing' : 'unscanned'),
      condition: (scanInfo?.condition || item.condition || 'good') as ItemCondition,
      isScanned,
      scannedAt: scanInfo?.scannedAt || null,
      officer: scanInfo?.officer || null
    };
  });
}

// GET /api/stock-opname and /api/stock-opname/sessions - List sessions
router.get(['/', '/sessions'], authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const sessions = db.getData().stockOpnames;
  sessions.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return res.json({ total: sessions.length, sessions });
});

// GET /api/stock-opname/:id and /api/stock-opname/sessions/:id - Detail session with items
router.get(['/:id', '/sessions/:id'], authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const session = db.getData().stockOpnames.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Sesi Stock Opname tidak ditemukan.' });
  }

  const items = prepareSessionItems(session);

  return res.json({
    session,
    items,
    totalCatalogItems: items.length
  });
});

// POST /api/stock-opname and /api/stock-opname/sessions - Create new session
router.post(
  ['/', '/sessions'],
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const { title, notes } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Judul Sesi Stock Opname wajib diisi.' });
    }

    const data = db.getData();
    const sessionId = 'so-' + Date.now();
    const sessionCode = `SO-SMAN3-${new Date().getFullYear()}-${(data.stockOpnames.length + 1).toString().padStart(2, '0')}`;
    const totalCatalogItems = data.items.length;

    const newSession: StockOpnameSession = {
      id: sessionId,
      sessionCode,
      title: title.trim(),
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      officerName: req.user!.fullName,
      totalCatalogItems,
      scannedCount: 0,
      foundCount: 0,
      missingCount: totalCatalogItems,
      damagedCount: 0,
      misplacedCount: 0,
      notes: notes?.trim(),
      scannedItems: []
    };

    data.stockOpnames.unshift(newSession);
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'STOCK_OPNAME',
      action: 'CREATE',
      recordId: newSession.id,
      recordIdentifier: newSession.sessionCode,
      description: `Membuka sesi Stock Opname baru: "${newSession.title}" (${totalCatalogItems} item katalog)`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({ message: 'Sesi Stock Opname berhasil dibuka.', session: newSession });
  }
);

// POST /api/stock-opname/:id/scan and /api/stock-opname/sessions/:id/scan - Scan a book barcode
router.post(
  ['/:id/scan', '/sessions/:id/scan'],
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const { barcode, currentShelfLocation, condition = 'good' } = req.body;
    if (!barcode) {
      return res.status(400).json({ error: 'Barcode buku wajib dipindai.' });
    }

    const data = db.getData();
    const session = data.stockOpnames.find((s) => s.id === req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Sesi Stock Opname tidak ditemukan.' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Sesi Stock Opname ini sudah tidak aktif / telah diselesaikan.' });
    }

    const cleanBarcode = barcode.trim();
    // Check if already scanned in this session
    const alreadyScanned = session.scannedItems.find((s) => s.barcode.toLowerCase() === cleanBarcode.toLowerCase());
    if (alreadyScanned) {
      return res.status(400).json({
        error: `Barcode "${cleanBarcode}" sudah pernah dipindai sebelumnya pada ${new Date(alreadyScanned.scannedAt).toLocaleTimeString('id-ID')}.`
      });
    }

    // Match with database items
    const item = data.items.find((i) => i.barcode.toLowerCase() === cleanBarcode.toLowerCase());
    let bookTitle = 'Buku Tidak Terdaftar';
    let expectedLocation = '-';
    let scanStatus: 'matched' | 'misplaced' | 'unregistered' | 'damaged' = 'unregistered';

    if (item) {
      const book = data.books.find((b) => b.id === item.bookId);
      bookTitle = book ? book.title : 'Judul Tidak Ditemukan';
      expectedLocation = item.location;

      if (condition === 'damaged' || item.condition === 'damaged') {
        scanStatus = 'damaged';
        session.damagedCount += 1;
        session.foundCount += 1;
      } else if (currentShelfLocation && currentShelfLocation.trim() !== expectedLocation.trim()) {
        scanStatus = 'misplaced';
        session.misplacedCount += 1;
        session.foundCount += 1;
      } else {
        scanStatus = 'matched';
        session.foundCount += 1;
      }
    }

    const scanRecord = {
      barcode: cleanBarcode,
      bookTitle,
      expectedLocation,
      scannedLocation: currentShelfLocation || expectedLocation,
      scannedAt: new Date().toISOString(),
      officer: req.user!.fullName,
      condition: condition as ItemCondition,
      status: scanStatus
    };

    session.scannedItems.unshift(scanRecord);
    session.scannedCount = session.scannedItems.length;
    session.missingCount = Math.max(0, session.totalCatalogItems - session.foundCount);

    db.saveDatabase();

    return res.json({
      message: `Barcode ${cleanBarcode} berhasil diverifikasi (${scanStatus}).`,
      item: {
        barcode: cleanBarcode,
        bookTitle,
        expectedLocation,
        status: scanStatus,
        condition,
        isScanned: true
      },
      scanResult: {
        barcode: cleanBarcode,
        bookTitle,
        expectedLocation,
        status: scanStatus,
        condition
      },
      session
    });
  }
);

// POST /api/stock-opname/:id/finalize, finish - Complete session
router.post(
  ['/:id/finalize', '/sessions/:id/finalize', '/:id/finish', '/sessions/:id/finish'],
  authMiddleware,
  requireRoles('superadmin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const session = data.stockOpnames.find((s) => s.id === req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Sesi Stock Opname tidak ditemukan.' });
    }

    session.status = 'completed';
    session.endDate = new Date().toISOString().split('T')[0];
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'STOCK_OPNAME',
      action: 'UPDATE',
      recordId: session.id,
      recordIdentifier: session.sessionCode,
      description: `Menyelesaikan sesi Stock Opname ${session.sessionCode}. Ditemukan: ${session.foundCount}, Hilang/Belum discan: ${session.missingCount}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'Sesi Stock Opname berhasil diselesaikan.', session });
  }
);

export default router;
