import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Book, BookItem } from '../../types';
import {
  BookCopy,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Tag,
  Barcode,
  Sparkles,
  Printer,
  X,
  MapPin,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { SpineLabelPrint } from '../../components/common/SpineLabelPrint';
import { ExportDropdown } from '../../components/common/ExportDropdown';
import { LOCALIZED_COLUMNS } from '../../services/exportService';

export const BookList: React.FC = () => {
  const { user, settings } = useAuth();
  const { success, error, warning } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Book Form Modal (Create & Edit)
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publishYear: new Date().getFullYear(),
    category: 'Kesusastraan & Fiksi',
    classificationCode: '813',
    callNumber: '813 NN a',
    subject: 'Sastra Indonesia',
    edition: 'Cetakan 1',
    pages: 200,
    language: 'Indonesia',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    description: '',
    source: 'BOS Reguler',
    copiesCount: 2,
    location: 'Rak B-01 (Kesusastraan)'
  });
  const [aiCatalogLoading, setAiCatalogLoading] = useState(false);

  // Manage Copies (Eksemplar) Modal
  const [managingCopiesBook, setManagingCopiesBook] = useState<Book | null>(null);
  const [copiesList, setCopiesList] = useState<BookItem[]>([]);
  const [loadingCopies, setLoadingCopies] = useState(false);
  const [newCopyLocation, setNewCopyLocation] = useState('Rak B-01 (Kesusastraan)');
  const [newCopySource, setNewCopySource] = useState('BOS Reguler');

  // Spine Label Print Modal
  const [printingSpineBook, setPrintingSpineBook] = useState<{ book: Book; items: BookItem[] } | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/books', window.location.origin);
      if (search) url.searchParams.append('q', search);
      if (selectedCategory !== 'all') url.searchParams.append('category', selectedCategory);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        setBooks(json.books);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaster = async () => {
    try {
      const res = await fetch('/api/settings/master');
      if (res.ok) {
        const json = await res.json();
        const cats = Array.isArray(json.categories)
          ? json.categories.map((c: any) => (typeof c === 'object' && c !== null ? c.name : String(c)))
          : [];
        const locs = Array.isArray(json.locations)
          ? json.locations.map((l: any) => (typeof l === 'object' && l !== null ? l.name : String(l)))
          : [];
        setCategories(cats);
        setLocations(locs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMaster();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  // AI Catalog Helper
  const handleAiCatalogAssist = async () => {
    if (!formData.title) {
      warning('Silakan masukkan Judul Buku terlebih dahulu.');
      return;
    }
    setAiCatalogLoading(true);
    try {
      const res = await fetch('/api/ai/catalog-helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          subject: formData.subject
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFormData((prev) => ({
          ...prev,
          classificationCode: data.classificationCode || prev.classificationCode,
          callNumber: data.callNumber || prev.callNumber,
          category: data.category || prev.category,
          subject: data.subject || prev.subject,
          description: data.description || prev.description
        }));
        success('Metadata DDC, Nomor Panggil, dan Sinopsis berhasil diisi otomatis oleh AI!');
      }
    } catch (e) {
      error('Gagal mengambil rekomendasi katalog AI');
    } finally {
      setAiCatalogLoading(false);
    }
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      publisher: 'Gramedia Pustaka Utama',
      publishYear: new Date().getFullYear(),
      category: categories[0] || 'Kesusastraan & Fiksi',
      classificationCode: '813',
      callNumber: '813 PEN j',
      subject: 'Pendidikan, Sastra',
      edition: 'Cetakan 1',
      pages: 220,
      language: 'Indonesia',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
      description: '',
      source: 'BOS Reguler',
      copiesCount: 2,
      location: locations[0] || 'Rak B-01 (Kesusastraan)'
    });
    setShowFormModal(true);
  };

  // Open Edit Form
  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publisher: book.publisher,
      publishYear: book.publishYear,
      category: book.category,
      classificationCode: book.classificationCode,
      callNumber: book.callNumber,
      subject: book.subject,
      edition: book.edition,
      pages: book.pages,
      language: book.language,
      coverUrl: book.coverUrl,
      description: book.description,
      source: book.source
    });
    setShowFormModal(true);
  };

  // Save Book Handler
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) {
      error('Judul dan Pengarang wajib diisi.');
      return;
    }

    try {
      const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books';
      const method = editingBook ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        success(editingBook ? 'Data bibliografi berhasil diperbarui.' : 'Buku baru dan eksemplar berhasil didaftarkan.');
        setShowFormModal(false);
        fetchBooks();
      } else {
        error(data.error || 'Gagal menyimpan data buku');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan');
    }
  };

  // Delete Book Handler
  const handleDeleteBook = async (book: Book) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus buku "${book.title}" beserta seluruh eksemplarnya?`)) return;

    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        success('Bibliografi buku berhasil dihapus.');
        fetchBooks();
      }
    } catch (e) {
      error('Gagal menghapus buku');
    }
  };

  // Open Copies Management Modal
  const handleManageCopies = async (book: Book) => {
    setManagingCopiesBook(book);
    setLoadingCopies(true);
    try {
      const res = await fetch(`/api/books/${book.id}`);
      if (res.ok) {
        const json = await res.json();
        setCopiesList(json.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCopies(false);
    }
  };

  // Add a new single copy (eksemplar)
  const handleAddSingleCopy = async () => {
    if (!managingCopiesBook) return;
    try {
      const res = await fetch(`/api/books/${managingCopiesBook.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          location: newCopyLocation,
          source: newCopySource,
          price: 75000
        })
      });
      const data = await res.json();
      if (res.ok) {
        success(`Eksemplar baru berhasil dibuat dengan Barcode: ${data.item.barcode}`);
        handleManageCopies(managingCopiesBook);
        fetchBooks();
      }
    } catch (e) {
      error('Gagal menambah eksemplar');
    }
  };

  // Delete a copy
  const handleDeleteCopy = async (itemId: string) => {
    if (!managingCopiesBook || !confirm('Hapus eksemplar ini?')) return;
    try {
      const res = await fetch(`/api/books/${managingCopiesBook.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        success('Eksemplar berhasil dihapus.');
        handleManageCopies(managingCopiesBook);
        fetchBooks();
      }
    } catch (e) {
      error('Gagal menghapus eksemplar');
    }
  };

  // Open Spine Label Print
  const handleOpenSpinePrint = async (book: Book) => {
    try {
      const res = await fetch(`/api/books/${book.id}`);
      if (res.ok) {
        const json = await res.json();
        setPrintingSpineBook({ book, items: json.items || [] });
      }
    } catch (e) {
      error('Gagal memuat eksemplar buku');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookCopy className="w-6 h-6 text-blue-600" />
            Katalog & Manajemen Bibliografi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola judul buku, metadata DDC, nomor panggil, dan inventaris eksemplar fisik perpustakaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportDropdown
            data={books}
            columns={LOCALIZED_COLUMNS.books}
            filenamePrefix="koleksi_buku_perpustakaan"
            sheetName="Daftar Buku"
            title="Daftar Koleksi Bibliografi Perpustakaan"
            subtitle={`Widya Pustaka SMAN 3 Nganjuk - Total: ${books.length} judul`}
            label="Ekspor Koleksi"
          />

          {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Entri Bibliografi Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul buku, penulis, ISBN, no panggil DDC..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
        >
          <option value="all">Semua Kategori ({books.length})</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Books Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data buku...</div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Tidak ada data buku yang sesuai.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Sampul & Judul</th>
                  <th className="p-3.5">No. Panggil / DDC</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Penerbit & Tahun</th>
                  <th className="p-3.5">Eksemplar Fisik</th>
                  <th className="p-3.5">Koleksi</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 max-w-sm">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded-md shadow-xs border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">{book.title}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
                          <span className="font-mono text-[9px] text-slate-400">ISBN: {book.isbn || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{book.callNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono">DDC: {book.classificationCode}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium text-[10px]">
                        {book.category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{book.publisher}</div>
                      <div className="text-[10px] text-slate-400">{book.publishYear}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {book.availableCopies} / {book.totalCopies}
                        </span>
                        <span className="text-[10px] text-slate-400">Eksemplar</span>
                      </div>
                      <button
                        onClick={() => handleManageCopies(book)}
                        className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline block mt-0.5"
                      >
                        + Kelola Eksemplar
                      </button>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        {book.source}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenSpinePrint(book)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg"
                        title="Cetak Label Punggung & Barcode"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(book)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                            title="Edit Bibliografi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                            title="Hapus Buku"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Create / Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editingBook ? 'Edit Data Bibliografi Buku' : 'Entri Bibliografi Buku Baru'}
                </h3>
                <p className="text-xs text-slate-500">Standar Pengatalogan Perpustakaan SLiMS 9 Bulian</p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4">
              {/* AI Assist Action Bar */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-300">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Katalogisasi Otomatis AI (DDC, Call Number, Sinopsis)</span>
                </div>
                <button
                  type="button"
                  onClick={handleAiCatalogAssist}
                  disabled={aiCatalogLoading}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiCatalogLoading ? 'Memproses AI...' : 'Isi Otomatis dengan AI'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Judul Utama Buku *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Contoh: Bumi Manusia"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pengarang / Penulis *
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                    placeholder="Contoh: Pramoedya Ananta Toer"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kode DDC (Dewey Decimal Classification)
                  </label>
                  <input
                    type="text"
                    value={formData.classificationCode}
                    onChange={(e) => setFormData({ ...formData, classificationCode: e.target.value })}
                    placeholder="Contoh: 813"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nomor Panggil (Call Number)
                  </label>
                  <input
                    type="text"
                    value={formData.callNumber}
                    onChange={(e) => setFormData({ ...formData, callNumber: e.target.value })}
                    placeholder="Contoh: 813 PRA b"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kategori Koleksi
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Penerbit
                  </label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="Contoh: Lentera Dipantara"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tahun Terbit & ISBN
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.publishYear}
                      onChange={(e) => setFormData({ ...formData, publishYear: Number(e.target.value) })}
                      placeholder="Tahun"
                      className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="ISBN (Contoh: 978-979-973-12-3)"
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sumber Perolehan
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="BOS Reguler">BOS Reguler</option>
                    <option value="BOS Kinerja">BOS Kinerja</option>
                    <option value="Hibah Alumni">Hibah Alumni</option>
                    <option value="Sumbangan Siswa">Sumbangan Siswa</option>
                    <option value="APBD Jawa Timur">APBD Jawa Timur</option>
                    <option value="Perpustakaan Nasional">Perpustakaan Nasional</option>
                  </select>
                </div>

                {!editingBook && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Jumlah Eksemplar Awal Fisik
                      </label>
                      <input
                        type="number"
                        value={formData.copiesCount}
                        onChange={(e) => setFormData({ ...formData, copiesCount: Number(e.target.value) })}
                        min={1}
                        max={50}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Lokasi Rak Awal
                      </label>
                      <select
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      >
                        {locations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  URL Cover Sampul Buku
                </label>
                <input
                  type="text"
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sinopsis / Ringkasan Buku
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {editingBook ? 'Simpan Perubahan' : 'Simpan Bibliografi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copies (Eksemplar) Management Modal */}
      {managingCopiesBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Kelola Eksemplar Fisik (Item Copies)
                </h3>
                <p className="text-xs text-slate-500 font-semibold">{managingCopiesBook.title}</p>
              </div>
              <button onClick={() => setManagingCopiesBook(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add new copy form */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                + Tambah Eksemplar Baru ke Inventaris
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={newCopyLocation}
                  onChange={(e) => setNewCopyLocation(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  {locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddSingleCopy}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Generate Barcode & Simpan Eksemplar
                </button>
              </div>
            </div>

            {/* Copies list table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="p-2.5">No. Inventaris</th>
                    <th className="p-2.5">Barcode</th>
                    <th className="p-2.5">Lokasi Rak</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {copiesList.map((copy) => (
                    <tr key={copy.id}>
                      <td className="p-2.5 font-mono text-slate-500">{copy.inventoryNumber}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-white">{copy.barcode}</td>
                      <td className="p-2.5">{copy.location}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            copy.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : copy.status === 'borrowed'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {copy.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        {copy.status !== 'borrowed' && (
                          <button
                            onClick={() => handleDeleteCopy(copy.id)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Spine Label Print Modal */}
      {printingSpineBook && (
        <SpineLabelPrint
          book={printingSpineBook.book}
          items={printingSpineBook.items}
          settings={settings}
          onClose={() => setPrintingSpineBook(null)}
        />
      )}
    </div>
  );
};
