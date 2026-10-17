import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loan } from '../../types';
import {
  Search,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Calendar,
  User,
  BookOpen,
  MessageCircle
} from 'lucide-react';
import { ReceiptPrint } from '../../components/common/ReceiptPrint';
import { WhatsAppReminderModal } from '../../components/common/WhatsAppReminderModal';

export const ActiveLoans: React.FC = () => {
  const { user, settings } = useAuth();
  const { success, error, warning } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue'>('all');
  const [search, setSearch] = useState('');
  const [selectedLoanForReceipt, setSelectedLoanForReceipt] = useState<Loan | null>(null);
  const [selectedLoanForWa, setSelectedLoanForWa] = useState<Loan | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/circulation/loans', window.location.origin);
      if (filter !== 'all') url.searchParams.append('status', filter);
      if (search) url.searchParams.append('search', search);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLoans(json.loans);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [filter, search]);

  const handleExtend = async (loanId: string) => {
    try {
      const res = await fetch(`/api/circulation/extend/${loanId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        success(`Peminjaman berhasil diperpanjang hingga: ${data.loan.dueDate}`);
        fetchLoans();
      } else {
        error(data.error || 'Gagal memperpanjang peminjaman');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan');
    }
  };

  const overdueCount = loans.filter((l) => l.status === 'overdue').length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            {user?.role === 'siswa' ? 'Peminjaman Aktif Saya' : 'Daftar Peminjaman Aktif & Jatuh Tempo'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {user?.role === 'siswa'
              ? 'Daftar buku yang sedang Anda pinjam. Harap kembalikan buku sebelum tanggal jatuh tempo.'
              : 'Monitoring sirkulasi buku yang sedang dipinjam mahasiswa dan dosen Politeknik Astra.'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            Semua Aktif
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            Tepat Waktu
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
              filter === 'overdue' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
            }`}
          >
            <span>Terlambat</span>
            {overdueCount > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                {overdueCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode transaksi, nama siswa/guru, atau judul buku..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data sirkulasi...</div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Tidak ada data peminjaman aktif.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Kode / Tgl Pinjam</th>
                  <th className="p-3.5">Peminjam</th>
                  <th className="p-3.5">Buku yang Dipinjam</th>
                  <th className="p-3.5">Jatuh Tempo</th>
                  <th className="p-3.5">Perpanjangan</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{loan.loanCode}</div>
                      <div className="text-[10px] text-slate-400">{loan.loanDate}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{loan.memberName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {loan.memberCode} · <span className="uppercase font-semibold">{loan.memberType}</span>
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="space-y-1">
                        {loan.items.map((item, idx) => (
                          <div key={idx} className="text-xs truncate">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.bookTitle}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Barcode: {item.barcode}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 font-bold">
                      <span className={loan.status === 'overdue' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>
                        {loan.dueDate}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                        {loan.extensionCount} / {settings?.maxExtensionsAllowed || 2}x
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          loan.status === 'overdue'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {loan.status === 'overdue' ? 'Terlambat' : 'Dipinjam'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* WhatsApp Reminder Button (Librarian/Staff only) */}
                      {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
                        <button
                          onClick={() => setSelectedLoanForWa(loan)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 shadow-2xs ${
                            loan.status === 'overdue'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                          }`}
                          title="Kirim Pesan WhatsApp Pengingat"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Ingatkan WA</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleExtend(loan.id)}
                        disabled={loan.extensionCount >= (settings?.maxExtensionsAllowed || 2) || loan.status === 'overdue'}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                        title="Perpanjang Masa Pinjam (+7 Hari)"
                      >
                        <RotateCw className="w-3 h-3 inline mr-1" />
                        Perpanjang
                      </button>
                      <button
                        onClick={() => setSelectedLoanForReceipt(loan)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                        title="Cetak Struk Peminjaman"
                      >
                        <Printer className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WhatsApp Reminder Modal */}
      {selectedLoanForWa && (
        <WhatsAppReminderModal
          isOpen={!!selectedLoanForWa}
          loan={selectedLoanForWa}
          settings={settings}
          onClose={() => setSelectedLoanForWa(null)}
        />
      )}

      {/* Receipt Modal */}
      {selectedLoanForReceipt && (
        <ReceiptPrint
          type="loan"
          loan={selectedLoanForReceipt}
          settings={settings}
          onClose={() => setSelectedLoanForReceipt(null)}
        />
      )}
    </div>
  );
};
