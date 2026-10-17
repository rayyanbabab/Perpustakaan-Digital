import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Book, BookItem, Reservation } from '../types';
import {
  Search,
  BookOpen,
  Filter,
  Compass,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookmarkPlus,
  BookmarkCheck,
  X,
  Send,
  HelpCircle,
  Tag,
  Share2,
  GraduationCap,
  ArrowRight,
  Info,
  Lock,
  Calendar,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OpacProps {
  onNavigate?: (tab: string) => void;
}

export const OPAC: React.FC<OpacProps> = ({ onNavigate }) => {
  const { user, demoLogin } = useAuth();
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

  // Student Booking & Reservation State
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [bookingBook, setBookingBook] = useState<Book | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<{ code: string; bookTitle: string } | null>(null);
  const [showGuestLoginModal, setShowGuestLoginModal] = useState(false);

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

  // Fetch student active reservations
  const fetchMyReservations = async () => {
    if (!user) {
      setMyReservations([]);
      return;
    }
    try {
      const res = await fetch('/api/circulation/reservations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMyReservations(json.reservations || []);
      }
    } catch (e) {
      console.error(e);
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
    fetchMyReservations();
  }, [user]);

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

  // Check if book has active reservation by current student
  const isBookReserved = (bookId: string) => {
    return myReservations.some(
      (r) => r.bookId === bookId && (r.status === 'pending' || r.status === 'waiting' || r.status === 'ready')
    );
  };

  // Initiate book reservation/booking
  const handleStartBooking = (book: Book) => {
    if (!user) {
      setShowGuestLoginModal(true);
      return;
    }
    setBookingBook(book);
    setBookingNotes('');
  };

  // Submit book reservation
  const handleConfirmBooking = async () => {
    if (!bookingBook) return;
    setIsBookingSubmitting(true);
    try {
      const res = await fetch('/api/circulation/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          bookId: bookingBook.id,
          notes: bookingNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        success(`Buku "${bookingBook.title}" berhasil dibooking!`);
        setBookingSuccessModal({
          code: data.reservation?.reservationCode || 'RSV-SUKSES',
          bookTitle: bookingBook.title
        });
        setBookingBook(null);
        setSelectedBook(null);
        fetchMyReservations();
        fetchBooks();
      } else {
        error(data.error || 'Gagal melakukan booking buku.');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Quick 1-click demo login as student for guests
  const handleGuestQuickStudentLogin = async () => {
    if (demoLogin) {
      const result = await demoLogin('siswa');
      if (result.success) {
        setShowGuestLoginModal(false);
        success('Berhasil masuk sebagai Siswa / Mahasiswa!');
        fetchMyReservations();
      } else {
        error('Gagal login cepat siswa');
      }
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
      {/* Student Welcome Banner */}
      {user?.role === 'siswa' && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-blue-800 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-400/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider text-emerald-100 mb-1">
                <span>Portal Layanan Mahasiswa / Siswa</span>
              </div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                Halo, {user.fullName || user.username}!
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                NIM: <span className="font-mono font-bold text-white">{user.memberId || user.username}</span> • Kuota Pinjam: 3 Buku (Masa Pinjam 7 Hari)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('circulation-reservations')}
                  className="px-3.5 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <BookmarkCheck className="w-4 h-4 text-amber-300" />
                  <span>Antrean Reservasi ({myReservations.filter((r) => r.status === 'pending' || r.status === 'ready').length})</span>
                </button>
                <button
                  onClick={() => onNavigate('circulation-active')}
                  className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Peminjaman Aktif</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Guest Info Banner */}
      {!user && (
        <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Ingin Meminjam atau Booking Buku?</p>
              <p className="text-[11px] text-slate-300">
                Masuk dengan Akun Siswa untuk memesan buku secara mandiri dan mengambilnya di perpustakaan.
              </p>
            </div>
          </div>
          <button
            onClick={handleGuestQuickStudentLogin}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Masuk Akun Siswa (1-Klik Demo)</span>
          </button>
        </div>
      )}

      {/* OPAC Hero Search Section */}
      <div className="bg-[#0F172A] rounded-3xl p-6 sm:p-10 text-white shadow-xs border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>KATALOG OPAC RESMI · POLITEKNIK ASTRA</span>
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && onNavigate && (
              <button
                onClick={() => onNavigate('books-list')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded-full transition-all"
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
                className="text-left text-xs text-slate-300 bg-slate-800/90 p-4 rounded-xl border border-slate-700"
              >
                <h4 className="font-semibold text-white mb-2">Cara Menggunakan Katalog:</h4>
                <ul className="list-decimal list-inside space-y-1">
                  <li>Ketik kata kunci (judul, pengarang, subjek) pada kolom pencarian.</li>
                  <li>Gunakan filter kategori untuk menyaring koleksi.</li>
                  <li>Klik buku untuk melihat detail, lokasi rak, dan status ketersediaan.</li>
                  <li>Gunakan fitur "Kurasi & Rekomendasi" untuk saran bacaan sesuai minat.</li>
                  <li>Klik "Reservasi" jika ingin meminjam buku.</li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Temukan Koleksi & Referensi Pustaka
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Cari dari ribuan judul buku teks vokasi, teknik, sains terapan, jurnal ilmiah, dan referensi akademik Astra Library secara instan.
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
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 text-sm shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600 border-0"
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
              className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Compass className="w-4 h-4 text-white" />
              Kurasi & Rekomendasi
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
            Tidak ada koleksi pustaka yang cocok dengan kata kunci "{searchQuery}". Coba gunakan kata kunci lain atau gunakan bantuan Kurasi & Rekomendasi.
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

                {/* Footer Metadata & Booking Button */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-[10px]">
                  <div className="truncate max-w-[85px] text-slate-400">
                    <span className="truncate block">{book.publisher}</span>
                  </div>
                  {isBookReserved(book.id) ? (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                      <BookmarkCheck className="w-3 h-3 text-amber-600" />
                      <span>Direservasi</span>
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartBooking(book);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                      title={available ? 'Booking buku ini sekarang' : 'Daftar antrean reservasi'}
                    >
                      <BookmarkPlus className="w-3 h-3" />
                      <span>{available ? 'Booking' : 'Reservasi'}</span>
                    </button>
                  )}
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

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {isBookReserved(selectedBook.id) ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed shadow-xs"
                    >
                      <BookmarkCheck className="w-4 h-4 text-amber-600" />
                      <span>Sudah Dalam Antrean Booking</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartBooking(selectedBook)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      <span>Booking / Reservasi Buku Ini</span>
                    </button>
                  )}
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
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
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Compass className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Kurasi & Rekomendasi Pustaka
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Temukan saran bacaan buku perpustakaan yang relevan dengan minat belajar Anda
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
                    Mahasiswa / Siswa
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
                    Dosen / Guru / Staf
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
                  placeholder="Contoh: Saya ingin membaca literatur teknologi otomotif, manajemen industri, atau sains rekayasa..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {aiLoading ? (
                  <span>Mencari Rekomendasi Koleksi...</span>
                ) : (
                  <>
                    <Compass className="w-4 h-4 text-white" />
                    Temukan Rekomendasi Koleksi
                  </>
                )}
              </button>
            </form>

            {/* AI Results */}
            {aiRecommendations.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Rekomendasi Terpilih dari Koleksi Astra Library:
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

      {/* 1. Interactive Booking Confirmation Modal */}
      {bookingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Konfirmasi Booking Buku
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Layanan Pemesanan & Antrean Koleksi Pustaka
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBookingBook(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Book Preview Card */}
            <div className="flex gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 items-center">
              <img
                src={bookingBook.coverUrl}
                alt={bookingBook.title}
                className="w-16 h-22 object-cover rounded-xl shadow-xs shrink-0 border border-slate-200 dark:border-slate-700"
              />
              <div className="min-w-0 space-y-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                  {bookingBook.callNumber}
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight">
                  {bookingBook.title}
                </h4>
                <p className="text-xs text-slate-500 truncate">Penulis: {bookingBook.author}</p>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`font-bold ${
                      (bookingBook.availableCopies || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
                    }`}
                  >
                    {(bookingBook.availableCopies || 0) > 0
                      ? `✅ ${bookingBook.availableCopies} Eksemplar Siap Pinjam`
                      : '⏳ Sedang Dipinjam (Masuk Antrean)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Borrower Identity */}
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  Identitas Pemohon:
                </span>
                <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                  {user?.role === 'siswa' ? 'Siswa / Mahasiswa' : user?.role}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-blue-100 dark:border-blue-900/40">
                <div>
                  <span className="text-slate-400 block">Nama Lengkap:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {user?.fullName || user?.name || user?.username}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">NIM / Username:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {user?.memberId || user?.username}
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Catatan Pemesanan (Opsional)
              </label>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Contoh: Untuk persiapan praktikum / Akan diambil istirahat siang..."
                rows={2}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            {/* Instructions Alert */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                Setelah konfirmasi, buku akan disiapkan oleh petugas perpustakaan di Meja Sirkulasi.
                Silakan ambil buku dengan menyebutkan kode reservasi atau menunjukkan KTM / Kartu Anggota.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBookingBook(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={isBookingSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                {isBookingSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Konfirmasi Booking</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. Booking Success Dialog */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Booking Berhasil Didaftarkan!
              </h3>
              <p className="text-xs text-slate-500">
                Permintaan booking untuk buku <strong>"{bookingSuccessModal.bookTitle}"</strong> telah masuk ke sistem antrean perpustakaan.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Kode Reservasi Anda
              </span>
              <span className="text-lg font-mono font-black text-blue-600 dark:text-blue-400">
                {bookingSuccessModal.code}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Petugas perpustakaan akan menyiapkan buku ini. Anda dapat memantau status pengambilan di menu Antrean Reservasi.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setBookingSuccessModal(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
              {onNavigate && (
                <button
                  onClick={() => {
                    setBookingSuccessModal(null);
                    onNavigate('circulation-reservations');
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
                >
                  <span>Lihat Antrean Saya</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. Guest Login Prompt Modal */}
      {showGuestLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Masuk Akun Siswa / Mahasiswa
              </h3>
              <p className="text-xs text-slate-500">
                Fitur booking & reservasi buku membutuhkan akun agar pemesanan tercatat atas identitas peminjam Anda.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl text-left text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Akses Cepat Demo Siswa:</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Gunakan tombol di bawah untuk langsung login simulasi sebagai Mahasiswa Politeknik Astra (NIM: 202410101).
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleGuestQuickStudentLogin}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Masuk Akun Siswa Sekarang (1-Klik)</span>
              </button>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setShowGuestLoginModal(false);
                    onNavigate('login');
                  }}
                  className="w-full py-2.5 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Buka Halaman Login Utama
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowGuestLoginModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pt-1 cursor-pointer"
              >
                Lanjutkan Melihat Katalog Saja
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
