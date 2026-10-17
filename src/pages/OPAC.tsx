import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Book, BookItem } from '../types';
import {
  Search,
  BookOpen,
  Filter,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookmarkPlus,
  X,
  Send,
  HelpCircle,
  Tag,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OpacProps {
  onNavigate?: (tab: string) => void;
}

export const OPAC: React.FC<OpacProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Selected Book for Detail Modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookItems, setBookItems] = useState<BookItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // AI Recommendation Drawer/Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false); // Guide state
  const [aiInterest, setAiInterest] = useState('');
  const [aiRole, setAiRole] = useState('siswa');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);

  // Fetch catalog books
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/books', window.location.origin);
      if (searchQuery) url.searchParams.append('q', searchQuery);
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

  // Fetch categories
  const fetchMaster = async () => {
    try {
      const res = await fetch('/api/settings/master');
      if (res.ok) {
        const json = await res.json();
        const cats = Array.isArray(json.categories)
          ? json.categories.map((c: any) => (typeof c === 'object' && c !== null ? c.name : String(c)))
          : [];
        setCategories(cats);
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
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Open detail modal and load physical items
  const handleOpenDetail = async (book: Book) => {
    setSelectedBook(book);
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/books/${book.id}`);
      if (res.ok) {
        const json = await res.json();
        setBookItems(json.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingItems(false);
    }
  };

  // Handle book reservation
  const handleReserve = async (book: Book) => {
    if (!user) {
      info('Silakan login terlebih dahulu untuk melakukan reservasi buku.');
      return;
    }

    try {
      const res = await fetch('/api/circulation/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          bookId: book.id,
          memberId: user.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        success('Reservasi berhasil didaftarkan! Petugas akan menyiapkan buku untuk Anda.');
      } else {
        error(data.error || 'Gagal melakukan reservasi');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan');
    }
  };

  // Handle AI recommendations
  const handleGetAiRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInterest.trim()) return;

    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest: aiInterest,
          role: aiRole
        })
      });
      if (res.ok) {
        const json = await res.json();
        setAiRecommendations(json.recommendations || []);
      }
    } catch (e) {
      error('Gagal mengambil rekomendasi AI');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* OPAC Hero Search Section */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-amber-400/30 relative overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold uppercase border border-amber-400/40">
              <BookOpen className="w-3.5 h-3.5" />
              KATALOG OPAC RESMI · SMA NEGERI 3 NGANJUK
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="p-1.5 rounded-full bg-slate-800/50 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && onNavigate && (
              <button
                onClick={() => onNavigate('books-list')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-full transition-all"
              >
                + Tambah Koleksi
              </button>
            )}
          </div>


          <AnimatePresence>
            {showGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-left text-xs text-slate-300 bg-slate-800/80 p-4 rounded-xl border border-slate-700"
              >
                <h4 className="font-bold text-amber-300 mb-2">Cara Menggunakan Katalog:</h4>
                <ul className="list-decimal list-inside space-y-1">
                  <li>Ketik kata kunci (judul, pengarang, subjek) pada kolom pencarian.</li>
                  <li>Gunakan filter kategori untuk menyaring koleksi.</li>
                  <li>Klik buku untuk melihat detail, lokasi rak, dan status ketersediaan.</li>
                  <li>Gunakan fitur "Rekomendasi AI" untuk saran bacaan sesuai minat.</li>
                  <li>Klik "Reservasi" jika ingin meminjam buku.</li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Temukan Koleksi & Referensi Pustaka
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Cari dari ribuan judul buku pelajaran, fiksi sastra, jurnal ilmiah, dan referensi akademik Widya Pustaka secara instan.
          </p>

          {/* Search Bar Input */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik judul buku, nama pengarang, topik subjek, atau ISBN..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm shadow-xl focus:outline-hidden focus:ring-2 focus:ring-amber-400 border-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowAiModal(true)}
              className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all shrink-0"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              Rekomendasi AI Cerdas
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Semua Kategori ({books.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Books Grid View */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Buku Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada koleksi pustaka yang cocok dengan kata kunci "{searchQuery}". Coba gunakan kata kunci lain atau gunakan bantuan Asisten AI.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book) => {
            const available = book.availableCopies > 0;
            return (
              <motion.div
                key={book.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleOpenDetail(book)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Cover Image */}
                  <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3 shadow-xs">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Call Number Pill */}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-amber-300 font-mono text-[9px] font-bold">
                      {book.callNumber}
                    </span>
                    {/* Availability Tag */}
                    <span
                      className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold shadow-xs flex items-center gap-1 ${
                        available
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {available ? `${book.availableCopies} Tersedia` : 'Dipinjam'}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate mt-1">{book.author}</p>
                </div>

                {/* Footer Metadata */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate max-w-[90px]">{book.publisher}</span>
                  <span>{book.publishYear}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs">
                  {selectedBook.category}
                </span>
                <span className="text-xs font-mono text-slate-400">DDC: {selectedBook.classificationCode}</span>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              <img
                src={selectedBook.coverUrl}
                alt={selectedBook.title}
                className="w-36 h-48 object-cover rounded-xl shadow-md border border-slate-200 dark:border-slate-700 shrink-0 mx-auto sm:mx-0"
              />
              <div className="space-y-2.5 flex-1">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                  {selectedBook.title}
                </h2>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Karya: {selectedBook.author}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 text-[10px] block">No. Panggil:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedBook.callNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Penerbit & Tahun:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedBook.publisher} ({selectedBook.publishYear})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">ISBN / Edisi:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{selectedBook.isbn || '-'} / {selectedBook.edition || 'Cet. 1'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Halaman & Bahasa:</span>
                    <span className="text-slate-800 dark:text-slate-200">{selectedBook.pages || '200'} hlm · {selectedBook.language}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleReserve(selectedBook)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    Reservasi Buku Ini
                  </button>
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {selectedBook.availableCopies} dari {selectedBook.totalCopies} Eksemplar Siap Pinjam
                  </span>
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Sinopsis & Ringkasan Buku
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedBook.description || 'Sinopsis belum ditambahkan.'}
              </p>
            </div>

            {/* Copies / Eksemplar Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between">
                <span>Daftar Eksemplar Fisik & Lokasi Rak</span>
                <span className="text-[10px] text-slate-400 font-normal">{bookItems.length} Eksemplar</span>
              </h4>

              {loadingItems ? (
                <div className="py-4 text-center text-xs text-slate-400">Memuat data eksemplar...</div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">No. Inventaris</th>
                        <th className="p-2.5">Barcode</th>
                        <th className="p-2.5">Lokasi Rak</th>
                        <th className="p-2.5">Kondisi</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {bookItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5 font-mono text-[11px] text-slate-500">{item.inventoryNumber}</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">{item.barcode}</td>
                          <td className="p-2.5">
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                              <MapPin className="w-3 h-3 text-blue-500" />
                              {item.location}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className="capitalize">{item.condition}</span>
                          </td>
                          <td className="p-2.5 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : item.status === 'borrowed'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {item.status === 'available' ? 'Tersedia di Rak' : item.status === 'borrowed' ? 'Sedang Dipinjam' : item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Recommendation Assistant Drawer Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Asisten Literasi AI Widya Pustaka
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Dapatkan saran bacaan buku perpustakaan yang relevan dengan minat Anda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGetAiRecommendations} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Saya seorang:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiRole('siswa')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      aiRole === 'siswa'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Siswa SMA
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiRole('guru')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      aiRole === 'guru'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Guru / Pendidik
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Topik yang ingin saya pelajari / Minat bacaan:
                </label>
                <textarea
                  value={aiInterest}
                  onChange={(e) => setAiInterest(e.target.value)}
                  placeholder="Contoh: Saya ingin membaca novel sejarah pergerakan Indonesia atau buku olimpiade Fisika SMA..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <span>Menganalisis Katalog dengan AI...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Rekomendasikan Buku Terbaik
                  </>
                )}
              </button>
            </form>

            {/* AI Results */}
            {aiRecommendations.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Rekomendasi Terpilih dari Koleksi SMAN 3 Nganjuk:
                </h4>

                <div className="space-y-2.5">
                  {aiRecommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50 flex gap-3 items-start"
                    >
                      <img
                        src={rec.coverUrl}
                        alt={rec.title}
                        className="w-12 h-16 object-cover rounded-lg shadow-xs shrink-0"
                      />
                      <div className="flex-1 space-y-1">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-tight">
                          {rec.title}
                        </h5>
                        <p className="text-[10px] text-slate-500">Penulis: {rec.author}</p>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 italic leading-snug">
                          "{rec.reason}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};
