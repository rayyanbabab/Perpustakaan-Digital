import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loan } from '../../types';
import { RotateCcw, Search, Calendar, BookOpen, User, Printer } from 'lucide-react';
import { ReceiptPrint } from '../../components/common/ReceiptPrint';

export const LoanHistory: React.FC = () => {
  const { settings } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Loan | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/circulation/loans', window.location.origin);
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
    fetchHistory();
  }, [search]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            Riwayat Transaksi Sirkulasi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log rekaman seluruh transaksi peminjaman dan pengembalian buku di perpustakaan.
          </p>
        </div>

        <div className="relative max-w-md w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari peminjam, buku, barcode..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat riwayat transaksi...</div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Belum ada riwayat transaksi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Kode Transaksi</th>
                  <th className="p-3.5">Peminjam</th>
                  <th className="p-3.5">Buku Dipinjam</th>
                  <th className="p-3.5">Tgl Pinjam</th>
                  <th className="p-3.5">Tgl Kembali</th>
                  <th className="p-3.5">Petugas</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {loan.loanCode}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{loan.memberName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{loan.memberCode} · {loan.memberType}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        {loan.items.map((it, i) => (
                          <div key={i} className="text-xs truncate max-w-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{it.bookTitle}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{loan.loanDate}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {loan.returnDate || <span className="text-slate-400 italic">Belum dikembalikan</span>}
                    </td>
                    <td className="p-3.5 text-slate-500">{loan.officerName}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          loan.status === 'returned'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : loan.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedReceipt(loan)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReceipt && (
        <ReceiptPrint
          type={selectedReceipt.returnDate ? 'return' : 'loan'}
          loan={selectedReceipt}
          settings={settings}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
