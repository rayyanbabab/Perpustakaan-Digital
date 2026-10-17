import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Member, BookItem, Loan, Fine } from '../../types';
import { BarcodeCanvas } from '../../components/common/BarcodeCanvas';
import { BarcodeScannerModal } from '../../components/common/BarcodeScannerModal';
import { ReceiptPrint } from '../../components/common/ReceiptPrint';
import {
  Barcode,
  Camera,
  UserCheck,
  BookOpen,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Printer,
  Calendar,
  Volume2
} from 'lucide-react';

export const QuickCirculation: React.FC = () => {
  const { user, settings } = useAuth();
  const { success, error, warning, info } = useToast();

  const [activeTab, setActiveTab] = useState<'loan' | 'return'>('loan');

  // Member state for Loan
  const [memberCodeInput, setMemberCodeInput] = useState('');
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [loadingMember, setLoadingMember] = useState(false);

  // Scanned Book Items for Loan
  const [bookBarcodeInput, setBookBarcodeInput] = useState('');
  const [loanItems, setLoanItems] = useState<Array<{ item: BookItem; book: any }>>([]);
  const [loadingBook, setLoadingBook] = useState(false);

  // Return Transaction State
  const [returnBarcodeInput, setReturnBarcodeInput] = useState('');
  const [lastReturnResult, setLastReturnResult] = useState<any>(null);
  const [loadingReturn, setLoadingReturn] = useState(false);

  // Modal states
  const [scannerMode, setScannerMode] = useState<'member' | 'book' | 'return' | null>(null);
  const [receiptData, setReceiptData] = useState<{ type: 'loan' | 'return' | 'fine'; loan?: Loan; fine?: Fine } | null>(null);

  // Member Search Handler
  const handleSearchMember = async (code: string) => {
    if (!code.trim()) return;
    setLoadingMember(true);
    try {
      const res = await fetch(`/api/members/code/${encodeURIComponent(code.trim())}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.status !== 'active') {
          warning(`Peringatan: Status keanggotaan ${data.name} adalah "${data.status}".`);
        }
        setActiveMember(data);
        setMemberCodeInput('');
        success(`Anggota ditemukan: ${data.name} (${data.type})`);
      } else {
        error(data.error || 'Data anggota tidak ditemukan');
        setActiveMember(null);
      }
    } catch (e) {
      error('Gagal memuat data anggota');
    } finally {
      setLoadingMember(false);
    }
  };

  // Scan & Verify Book for Loan
  const handleAddBookToLoan = async (barcode: string) => {
    if (!activeMember) {
      warning('Silakan masukkan data anggota peminjam terlebih dahulu.');
      return;
    }

    const cleanBarcode = barcode.trim();
    if (loanItems.some((li) => li.item.barcode.toLowerCase() === cleanBarcode.toLowerCase())) {
      warning(`Barcode "${cleanBarcode}" sudah ada di keranjang peminjaman.`);
      return;
    }

    // Check max quota
    const maxQuota = activeMember.type === 'SISWA' ? (settings?.loanQuotaSiswa || 3) : (settings?.loanQuotaGuru || 5);
    if (loanItems.length >= maxQuota) {
      error(`Batas maksimal peminjaman untuk ${activeMember.type} adalah ${maxQuota} buku.`);
      return;
    }

    setLoadingBook(true);
    try {
      const res = await fetch(`/api/books/item/${encodeURIComponent(cleanBarcode)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      const data = await res.json();

      if (res.ok) {
        if (data.item.status !== 'available') {
          error(`Eksemplar buku "${data.book.title}" sedang dalam status: ${data.item.status}.`);
          return;
        }

        setLoanItems((prev) => [...prev, { item: data.item, book: data.book }]);
        setBookBarcodeInput('');
        success(`Buku ditambahkan: "${data.book.title}" (${cleanBarcode})`);
      } else {
        error(data.error || 'Barcode buku tidak terdaftar');
      }
    } catch (e) {
      error('Gagal memverifikasi barcode buku');
    } finally {
      setLoadingBook(false);
    }
  };

  // Process Loan Submission
  const handleProcessLoan = async () => {
    if (!activeMember) {
      error('Pilih anggota peminjam');
      return;
    }
    if (loanItems.length === 0) {
      error('Pindai minimal 1 buku yang akan dipinjam');
      return;
    }

    try {
      const res = await fetch('/api/circulation/borrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          memberId: activeMember.id,
          barcodes: loanItems.map((li) => li.item.barcode)
        })
      });

      const data = await res.json();
      if (res.ok) {
        success(`Transaksi peminjaman ${data.loan.loanCode} berhasil diproses!`);
        setReceiptData({ type: 'loan', loan: data.loan });
        // Reset loan cart
        setActiveMember(null);
        setLoanItems([]);
      } else {
        error(data.error || 'Gagal memproses transaksi peminjaman');
      }
    } catch (e) {
      error('Terjadi kesalahan sistem');
    }
  };

  // Process Quick Return by Barcode
  const handleProcessReturn = async (barcode: string) => {
    if (!barcode.trim()) return;
    setLoadingReturn(true);
    try {
      const res = await fetch('/api/circulation/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          barcode: barcode.trim(),
          condition: 'good'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setLastReturnResult(data);
        setReturnBarcodeInput('');
        if (data.fine) {
          warning(`Buku dikembalikan DENGAN DENDA keterlambatan: Rp ${data.fine.totalFine.toLocaleString('id-ID')}`);
        } else {
          success(`Buku "${data.bookTitle}" berhasil dikembalikan tepat waktu!`);
        }
      } else {
        error(data.error || 'Gagal memproses pengembalian buku');
      }
    } catch (e) {
      error('Terjadi kesalahan transaksi pengembalian');
    } finally {
      setLoadingReturn(false);
    }
  };

  // Calculate loan duration default
  const loanDays = activeMember?.type === 'SISWA' ? (settings?.loanDurationDaysSiswa || 7) : (settings?.loanDurationDaysGuru || 14);
  const calculatedDueDate = new Date();
  calculatedDueDate.setDate(calculatedDueDate.getDate() + loanDays);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Barcode className="w-6 h-6 text-amber-500" />
            Meja Sirkulasi Cepat (Fast Circulation Desk)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pindai barcode kartu anggota dan barcode buku secara instan menggunakan barcode scanner atau kamera.
          </p>
        </div>

        {/* Tab Buttons: Peminjaman vs Pengembalian */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('loan')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'loan'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            Peminjaman Baru
          </button>
          <button
            onClick={() => setActiveTab('return')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'return'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Pengembalian Buku
          </button>
        </div>
      </div>

      {/* MODE 1: PEMINJAMAN (LOAN) */}
      {activeTab === 'loan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Scan Member & Details */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  1. Pindai Kartu Anggota
                </span>
                <button
                  onClick={() => setScannerMode('member')}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Kamera
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchMember(memberCodeInput);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={memberCodeInput}
                  onChange={(e) => setMemberCodeInput(e.target.value)}
                  placeholder="Scan barcode / ketik NIS / NIP..."
                  autoFocus
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={loadingMember}
                  className="px-3.5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shrink-0"
                >
                  Cari
                </button>
              </form>

              {/* Active Member Card Preview */}
              {activeMember ? (
                <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        activeMember.photoUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeMember.name)}`
                      }
                      alt={activeMember.name}
                      className="w-12 h-14 object-cover rounded-lg border border-blue-200 dark:border-blue-800 shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-600 text-white rounded-md uppercase">
                          {activeMember.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{activeMember.memberCode}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                        {activeMember.name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {activeMember.type === 'SISWA'
                          ? `Kelas: ${activeMember.classGrade || '-'}`
                          : `Mapel: ${activeMember.subject || activeMember.position || '-'}`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-blue-100 dark:border-blue-900/50">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Kuota Pinjam:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {activeMember.type === 'SISWA' ? settings?.loanQuotaSiswa || 3 : settings?.loanQuotaGuru || 5} Buku
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Durasi Pinjam:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{loanDays} Hari</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveMember(null)}
                    className="w-full py-1 text-center text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Ganti Anggota Peminjam
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  Belum ada anggota yang dipilih. Silakan scan barcode kartu anggota.
                </div>
              )}
            </div>
          </div>

          {/* Col 2 & 3: Scan Books Cart & Submit */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  2. Pindai Barcode Buku Pustaka ({loanItems.length} Buku)
                </span>
                <button
                  onClick={() => setScannerMode('book')}
                  disabled={!activeMember}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline disabled:opacity-40"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Kamera
                </button>
              </div>

              {/* Barcode Input for Books */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddBookToLoan(bookBarcodeInput);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={bookBarcodeInput}
                  onChange={(e) => setBookBarcodeInput(e.target.value)}
                  placeholder="Pindai barcode buku (Contoh: WPL-000001)..."
                  disabled={!activeMember}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!activeMember || loadingBook}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shrink-0 transition-colors disabled:opacity-50"
                >
                  Tambah Buku
                </button>
              </form>

              {/* Loan Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {loanItems.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                    Keranjang peminjaman kosong. Arahkan barcode scanner ke barcode buku.
                  </div>
                ) : (
                  loanItems.map(({ item, book }, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <img src={book.coverUrl} alt={book.title} className="w-9 h-12 object-cover rounded-md shadow-xs shrink-0" />
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{book.title}</h5>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.barcode}</span>
                            <span>·</span>
                            <span>{item.location}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setLoanItems((prev) => prev.filter((li) => li.item.id !== item.id))}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Transaction Summary & Submit */}
              {loanItems.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Batas Pengembalian:{' '}
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {calculatedDueDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <button
                    onClick={handleProcessLoan}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Proses Transaksi Peminjaman ({loanItems.length} Buku)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: PENGEMBALIAN (RETURN) */}
      {activeTab === 'return' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="text-center space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Pindai Barcode Buku yang Dikembalikan
              </h3>
              <p className="text-xs text-slate-500">
                Sistem akan otomatis menghitung hari keterlambatan dan membuat catatan denda jika melewati batas jatuh tempo.
              </p>
            </div>

            {/* Barcode Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessReturn(returnBarcodeInput);
              }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={returnBarcodeInput}
                  onChange={(e) => setReturnBarcodeInput(e.target.value)}
                  placeholder="Pindai barcode buku yang dikembalikan (Contoh: WPL-000001)..."
                  autoFocus
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setScannerMode('return')}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <Camera className="w-4 h-4" />
                  Kamera
                </button>
              </div>

              <button
                type="submit"
                disabled={loadingReturn}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loadingReturn ? 'Memproses...' : 'Proses Pengembalian Buku'}
              </button>
            </form>

            {/* Last Return Result Card */}
            {lastReturnResult && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {lastReturnResult.bookTitle}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">Barcode: {lastReturnResult.barcode}</p>
                    </div>
                  </div>
                  {lastReturnResult.fine ? (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs">
                      Terlambat {lastReturnResult.fine.daysLate} Hari
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                      Tepat Waktu
                    </span>
                  )}
                </div>

                {lastReturnResult.fine && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-rose-700 dark:text-rose-300 font-bold block">
                        Denda Terlambat: Rp {lastReturnResult.fine.totalFine.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-rose-500">
                        {lastReturnResult.fine.daysLate} hari × Rp {settings?.finePerDay || 1000}/hari
                      </span>
                    </div>
                    <button
                      onClick={() => setReceiptData({ type: 'fine', fine: lastReturnResult.fine })}
                      className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
                    >
                      Cetak Struk Denda
                    </button>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setReceiptData({ type: 'return', loan: lastReturnResult.loan })}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Bukti Pengembalian
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {scannerMode && (
        <BarcodeScannerModal
          isOpen={Boolean(scannerMode)}
          onClose={() => setScannerMode(null)}
          onScan={(scanned) => {
            if (scannerMode === 'member') {
              handleSearchMember(scanned);
            } else if (scannerMode === 'book') {
              handleAddBookToLoan(scanned);
            } else if (scannerMode === 'return') {
              handleProcessReturn(scanned);
            }
          }}
          title={
            scannerMode === 'member'
              ? 'Pindai Barcode Kartu Anggota'
              : scannerMode === 'book'
                ? 'Pindai Barcode Buku Pustaka'
                : 'Pindai Barcode Pengembalian'
          }
        />
      )}

      {/* Receipt Thermal Slip Modal */}
      {receiptData && (
        <ReceiptPrint
          type={receiptData.type}
          loan={receiptData.loan}
          fine={receiptData.fine}
          settings={settings}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
};
