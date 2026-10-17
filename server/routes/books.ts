import { Router, Request, Response } from 'express';
import { db } from '../db';
import { Book, BookItem } from '../../src/types';
import { authMiddleware, requireRoles, AuthenticatedRequest } from '../auth';

const router = Router();

// Helper to calculate items count and availability
function enrichBookWithCopies(book: Book) {
  const items = db.getData().items.filter((i) => i.bookId === book.id);
  const totalCopies = items.length;
  const availableCopies = items.filter((i) => i.status === 'available').length;
  const borrowedCopies = items.filter((i) => i.status === 'borrowed').length;
  const reservedCopies = items.filter((i) => i.status === 'reserved').length;
  const lostCopies = items.filter((i) => i.status === 'lost').length;
  const damagedCopies = items.filter((i) => i.status === 'damaged').length;

  return {
    ...book,
    totalCopies,
    availableCopies,
    borrowedCopies,
    reservedCopies,
    lostCopies,
    damagedCopies,
    items
  };
}

// GET /api/books/opac - Public / member catalog search
router.get('/opac', (req: Request, res: Response) => {
  const { query, category, availability, sort } = req.query as {
    query?: string;
    category?: string;
    availability?: string;
    sort?: string;
  };

  let books = db.getData().books.filter((b) => b.isOpacVisible);

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    books = books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(q)) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.isbn || '').toLowerCase().includes(q) ||
        (b.publisher || '').toLowerCase().includes(q) ||
        (b.subject || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q) ||
        (b.callNumber || '').toLowerCase().includes(q)
    );
  }

  if (category && category !== 'all') {
    books = books.filter((b) => b.category.toLowerCase() === category.toLowerCase());
  }

  let enriched = books.map(enrichBookWithCopies);

  if (availability === 'available') {
    enriched = enriched.filter((b) => b.availableCopies > 0);
  } else if (availability === 'borrowed') {
    enriched = enriched.filter((b) => b.availableCopies === 0 && b.borrowedCopies > 0);
  }

  if (sort === 'title_asc') {
    enriched.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'title_desc') {
    enriched.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sort === 'year_desc') {
    enriched.sort((a, b) => b.publishYear - a.publishYear);
  } else if (sort === 'popular') {
    // Sort by borrowed count
    enriched.sort((a, b) => b.borrowedCopies - a.borrowedCopies);
  } else {
    // Default newest
    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return res.json({
    total: enriched.length,
    books: enriched
  });
});

// GET /api/books - Admin catalog list
router.get('/', (req: Request, res: Response) => {
  const { query, category } = req.query as { query?: string; category?: string };
  let books = db.getData().books;

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    books = books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.isbn || '').toLowerCase().includes(q) ||
        (b.publisher || '').toLowerCase().includes(q) ||
        (b.callNumber || '').toLowerCase().includes(q)
    );
  }

  if (category && category !== 'all') {
    books = books.filter((b) => b.category.toLowerCase() === category.toLowerCase());
  }

  const enriched = books.map(enrichBookWithCopies);
  return res.json({
    total: enriched.length,
    books: enriched
  });
});

// GET /api/books/:id - Detail bibliography
router.get('/:id', (req: Request, res: Response) => {
  const book = db.getData().books.find((b) => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Buku tidak ditemukan.' });
  }

  const enriched = enrichBookWithCopies(book);
  return res.json(enriched);
});

// POST /api/books - Create new bibliography with optional initial copies
router.post(
  '/',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const {
      isbn,
      title,
      subtitle,
      author,
      editor,
      publisher,
      publishYear,
      publishCity,
      edition,
      language,
      category,
      subject,
      classificationCode,
      callNumber,
      description,
      pages,
      dimension,
      source,
      defaultLocation,
      coverUrl,
      digitalFileUrl,
      isOpacVisible = true,
      initialCopies = 1,
      copyPrice = 0
    } = req.body;

    if (!isbn || !title || !author || !publisher) {
      return res.status(400).json({ error: 'ISBN, Judul, Penulis, dan Penerbit wajib diisi.' });
    }

    const data = db.getData();
    const existingIsbn = data.books.find((b) => b.isbn.trim() === isbn.trim());
    if (existingIsbn) {
      return res.status(400).json({ error: `Buku dengan ISBN ${isbn} sudah terdaftar: "${existingIsbn.title}".` });
    }

    const newBookId = 'bk-' + Date.now();
    const newBook: Book = {
      id: newBookId,
      isbn: isbn.trim(),
      title: title.trim(),
      subtitle: subtitle?.trim(),
      author: author.trim(),
      editor: editor?.trim(),
      publisher: publisher.trim(),
      publishYear: Number(publishYear) || new Date().getFullYear(),
      publishCity: publishCity?.trim() || 'Jakarta',
      edition: edition?.trim(),
      language: language?.trim() || 'Indonesia',
      category: category?.trim() || 'Umum',
      subject: subject?.trim() || 'Umum',
      classificationCode: classificationCode?.trim() || '000',
      callNumber: callNumber?.trim() || `${classificationCode || '000'} ${author.slice(0, 3).toUpperCase()} ${title[0]?.toLowerCase()}`,
      description: description?.trim() || '',
      pages: Number(pages) || 100,
      dimension: dimension?.trim() || '15 x 23 cm',
      source: source || 'BOS',
      defaultLocation: defaultLocation?.trim() || 'Rak A1 - Sains & MIPA',
      coverUrl: coverUrl?.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
      digitalFileUrl: digitalFileUrl?.trim(),
      isOpacVisible: isOpacVisible ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.books.unshift(newBook);

    // Create initial items/eksemplar if specified
    const numCopies = Math.max(1, Math.min(Number(initialCopies) || 1, 50));
    const createdItems: BookItem[] = [];

    // Find highest current barcode number
    let maxBarcodeNum = data.items.reduce((max, item) => {
      const match = item.barcode.match(/WPL-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        return n > max ? n : max;
      }
      return max;
    }, 0);

    for (let i = 1; i <= numCopies; i++) {
      maxBarcodeNum++;
      const barcode = `WPL-${maxBarcodeNum.toString().padStart(6, '0')}`;
      const item: BookItem = {
        id: `itm-${newBookId}-${i}`,
        bookId: newBookId,
        barcode,
        inventoryNumber: `INV/${newBook.publishYear}/${newBookId.slice(-4)}/${i.toString().padStart(2, '0')}`,
        location: newBook.defaultLocation,
        status: 'available',
        condition: 'good',
        entryDate: new Date().toISOString().split('T')[0],
        source: newBook.source,
        price: Number(copyPrice) || 50000
      };
      data.items.push(item);
      createdItems.push(item);
    }

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'BOOKS',
      action: 'CREATE',
      recordId: newBook.id,
      recordIdentifier: newBook.isbn,
      description: `Menambahkan bibliografi baru: "${newBook.title}" beserta ${numCopies} eksemplar.`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({
      message: 'Buku dan eksemplar berhasil ditambahkan.',
      book: enrichBookWithCopies(newBook)
    });
  }
);

// PUT /api/books/:id - Update bibliography
router.put(
  '/:id',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const bookIndex = data.books.findIndex((b) => b.id === req.params.id);
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Buku tidak ditemukan.' });
    }

    const updated: Book = {
      ...data.books[bookIndex],
      ...req.body,
      id: req.params.id,
      updatedAt: new Date().toISOString()
    };

    data.books[bookIndex] = updated;
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'BOOKS',
      action: 'UPDATE',
      recordId: updated.id,
      recordIdentifier: updated.isbn,
      description: `Memperbarui data bibliografi: "${updated.title}"`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: 'Data buku berhasil diperbarui.',
      book: enrichBookWithCopies(updated)
    });
  }
);

// DELETE /api/books/:id - Delete bibliography and all its items if not actively borrowed
router.delete(
  '/:id',
  authMiddleware,
  requireRoles('superadmin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const book = data.books.find((b) => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Buku tidak ditemukan.' });
    }

    // Check if any items are currently borrowed
    const items = data.items.filter((i) => i.bookId === book.id);
    const hasActiveLoans = items.some((i) => i.status === 'borrowed');
    if (hasActiveLoans) {
      return res.status(400).json({
        error: 'Tidak dapat menghapus buku karena ada eksemplar yang sedang dalam status dipinjam.'
      });
    }

    data.books = data.books.filter((b) => b.id !== book.id);
    data.items = data.items.filter((i) => i.bookId !== book.id);
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'BOOKS',
      action: 'DELETE',
      recordId: book.id,
      recordIdentifier: book.isbn,
      description: `Menghapus buku: "${book.title}" beserta seluruh eksemplarnya`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'Buku dan seluruh eksemplar berhasil dihapus.' });
  }
);

// GET /api/books/:id/items - List all items (copies) of a book
router.get('/:id/items', (req: Request, res: Response) => {
  const data = db.getData();
  const items = data.items.filter((i) => i.bookId === req.params.id);
  return res.json({ total: items.length, items });
});

// POST /api/books/:id/items - Add items (eksemplar) to an existing book
router.post(
  '/:id/items',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const book = data.books.find((b) => b.id === req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Buku tidak ditemukan.' });
    }

    const { count = 1, location, source, price = 0, condition = 'good' } = req.body;
    const numCopies = Math.max(1, Math.min(Number(count) || 1, 50));

    let maxBarcodeNum = data.items.reduce((max, item) => {
      const match = item.barcode.match(/WPL-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        return n > max ? n : max;
      }
      return max;
    }, 0);

    const created: BookItem[] = [];
    for (let i = 1; i <= numCopies; i++) {
      maxBarcodeNum++;
      const barcode = `WPL-${maxBarcodeNum.toString().padStart(6, '0')}`;
      const item: BookItem = {
        id: `itm-${book.id}-${Date.now()}-${i}`,
        bookId: book.id,
        barcode,
        inventoryNumber: `INV/${book.publishYear}/${book.id.slice(-4)}/${(data.items.filter((x) => x.bookId === book.id).length + i).toString().padStart(2, '0')}`,
        location: location || book.defaultLocation,
        status: 'available',
        condition: condition || 'good',
        entryDate: new Date().toISOString().split('T')[0],
        source: source || book.source,
        price: Number(price) || 50000
      };
      data.items.push(item);
      created.push(item);
    }

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'ITEMS',
      action: 'CREATE',
      recordId: book.id,
      recordIdentifier: book.title,
      description: `Menambahkan ${numCopies} eksemplar baru untuk buku "${book.title}"`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({
      message: `${numCopies} eksemplar baru berhasil ditambahkan.`,
      item: created[0],
      items: created,
      book: enrichBookWithCopies(book)
    });
  }
);

// PUT /api/books/items/:itemId or /api/books/:bookId/items/:itemId - Update item status/condition/location
router.put(
  ['/items/:itemId', '/:bookId/items/:itemId'],
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const itemIndex = data.items.findIndex((i) => i.id === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Eksemplar tidak ditemukan.' });
    }

    const item = data.items[itemIndex];
    const updated: BookItem = {
      ...item,
      ...req.body,
      id: item.id,
      bookId: item.bookId,
      barcode: item.barcode // Barcode cannot be modified arbitrarily to maintain consistency
    };

    data.items[itemIndex] = updated;
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'ITEMS',
      action: 'UPDATE',
      recordId: updated.id,
      recordIdentifier: updated.barcode,
      description: `Memperbarui eksemplar ${updated.barcode} (Status: ${updated.status}, Kondisi: ${updated.condition})`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: 'Eksemplar berhasil diperbarui.',
      item: updated
    });
  }
);

// DELETE /api/books/items/:itemId or /api/books/:bookId/items/:itemId - Delete a single item
router.delete(
  ['/items/:itemId', '/:bookId/items/:itemId'],
  authMiddleware,
  requireRoles('superadmin', 'admin'),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const item = data.items.find((i) => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Eksemplar tidak ditemukan.' });
    }

    if (item.status === 'borrowed') {
      return res.status(400).json({ error: 'Tidak dapat menghapus eksemplar yang sedang dipinjam.' });
    }

    data.items = data.items.filter((i) => i.id !== item.id);
    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'ITEMS',
      action: 'DELETE',
      recordId: item.id,
      recordIdentifier: item.barcode,
      description: `Menghapus eksemplar dengan barcode ${item.barcode}`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({ message: 'Eksemplar berhasil dihapus.' });
  }
);

// GET /api/books/item/:barcode and /api/books/item-by-barcode/:barcode - Quick item lookup for circulation scanning
router.get(['/item/:barcode', '/item-by-barcode/:barcode'], (req: Request, res: Response) => {
  const barcode = req.params.barcode.trim();
  const data = db.getData();
  const item = data.items.find((i) => i.barcode.toLowerCase() === barcode.toLowerCase());

  if (!item) {
    return res.status(404).json({ error: `Eksemplar dengan barcode "${barcode}" tidak ditemukan.` });
  }

  const book = data.books.find((b) => b.id === item.bookId);
  return res.json({
    item,
    book
  });
});

// POST /api/books/bulk-import - CSV / JSON bulk book import
router.post(
  '/bulk-import',
  authMiddleware,
  requireRoles('superadmin', 'admin', 'pustakawan'),
  (req: AuthenticatedRequest, res: Response) => {
    const { books } = req.body;
    if (!Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ error: 'Data buku kosong atau tidak valid.' });
    }

    const data = db.getData();
    let importedCount = 0;
    const errors: string[] = [];

    let maxBarcodeNum = data.items.reduce((max, item) => {
      const match = item.barcode.match(/WPL-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        return n > max ? n : max;
      }
      return max;
    }, 0);

    books.forEach((b: any, index: number) => {
      if (!b.title || !b.author || !b.isbn) {
        errors.push(`Baris ${index + 1}: Judul, Penulis, dan ISBN wajib diisi.`);
        return;
      }

      if (data.books.some((existing) => existing.isbn.trim() === b.isbn.trim())) {
        errors.push(`Baris ${index + 1}: ISBN ${b.isbn} sudah ada dalam database.`);
        return;
      }

      const bookId = 'bk-imp-' + Date.now() + '-' + index;
      const newBook: Book = {
        id: bookId,
        isbn: b.isbn.trim(),
        title: b.title.trim(),
        subtitle: b.subtitle?.trim(),
        author: b.author.trim(),
        editor: b.editor?.trim(),
        publisher: b.publisher?.trim() || 'Penerbit Nasional',
        publishYear: Number(b.publishYear) || 2024,
        publishCity: b.publishCity?.trim() || 'Jakarta',
        edition: b.edition?.trim() || 'Cetakan 1',
        language: b.language?.trim() || 'Indonesia',
        category: b.category?.trim() || 'Umum',
        subject: b.subject?.trim() || 'Umum',
        classificationCode: b.classificationCode?.trim() || '000',
        callNumber: b.callNumber?.trim() || `000 ${b.author.slice(0, 3).toUpperCase()} ${b.title[0]?.toLowerCase()}`,
        description: b.description?.trim() || 'Koleksi perpustakaan Politeknik Astra',
        pages: Number(b.pages) || 200,
        dimension: b.dimension?.trim() || '15 x 23 cm',
        source: b.source || 'BOS Reguler',
        defaultLocation: b.location?.trim() || b.defaultLocation?.trim() || 'Rak Koleksi Utama',
        coverUrl: b.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
        isOpacVisible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      data.books.push(newBook);
      importedCount++;

      // Create physical copies based on Excel copiesCount (default 1 to 50)
      const copiesToGenerate = Math.max(1, Math.min(50, Number(b.copiesCount || b.totalCopies) || 1));
      for (let c = 1; c <= copiesToGenerate; c++) {
        maxBarcodeNum++;
        const barcode = `WPL-${maxBarcodeNum.toString().padStart(6, '0')}`;
        data.items.push({
          id: `itm-${bookId}-${c}`,
          bookId: bookId,
          barcode,
          inventoryNumber: `INV/${newBook.publishYear}/${bookId.slice(-4)}/${c.toString().padStart(2, '0')}`,
          location: newBook.defaultLocation,
          status: 'available',
          condition: 'good',
          entryDate: new Date().toISOString().split('T')[0],
          source: newBook.source,
          price: Number(b.price) || 65000
        });
      }
    });

    db.saveDatabase();

    db.logActivity({
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
      module: 'BOOKS',
      action: 'IMPORT',
      description: `Import massal bibliografi: ${importedCount} berhasil, ${errors.length} gagal`,
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.json({
      message: `Import selesai. ${importedCount} buku berhasil diimpor.`,
      importedCount,
      errors
    });
  }
);

export default router;
