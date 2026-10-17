import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Fine } from '../../types';
import { DollarSign, Search, CheckCircle2, ShieldAlert, Printer, X } from 'lucide-react';
import { ReceiptPrint } from '../../components/common/ReceiptPrint';

export const FinesList: React.FC = () => {
  const { user, settings } = useAuth();
  const { success, error, info } = useToast();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Pay Modal
  const [payingFine, setPayingFine] = useState<Fine | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');

  // Receipt Modal
  const [receiptFine, setReceiptFine] = useState<Fine | null>(null);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/circulation/fines', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setFines(json.fines);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const handleOpenPay = (fine: Fine) => {
    setPayingFine(fine);
    setPayAmount(fine.totalFine - fine.paidAmount);
    setPayNotes('Pembayaran tunai di meja sirkulasi');
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFine) return;

    try {
      const res = await fetch(`/api/circulation/fines/${payingFine.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentMethod,
          notes: payNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        success('Pembayaran denda berhasil dicatat!');
        setReceiptFine(data.fine);
        setPayingFine(null);
        fetchFines();
      } else {
        error(data.error || 'Gagal memproses pembayaran denda');
      }
    } catch (e) {
      error('Terjadi kesalahan sistem');
    }
  };

  const handleWaiveFine = async (fineId: string) => {
    if (!confirm('Apakah Anda yakin ingin membebaskan/menghapus denda ini atas kebijakan Kepala Perpustakaan?')) return;

    try {
      const res = await fetch(`/api/circulation/fines/${fineId}/waive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({ reason: 'Kebijakan keringanan denda literasi' })
      });
      if (res.ok) {
        success('Denda berhasil dibebaskan (Waived).');
        fetchFines();
      }
    } catch (e) {
      error('Gagal memproses pembebasan denda');
    }
  };

  const filtered = fines.filter((f) => (statusFilter === 'all' ? true : f.status === statusFilter));
  const totalUnpaid = fines
    .filter((f) => f.status === 'unpaid' || f.status === 'partial')
    .reduce((sum, f) => sum + (f.totalFine - f.paidAmount), 0);
  const totalPaid = fines.reduce((sum, f) => sum + f.paidAmount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Manajemen Denda Keterlambatan & Kerusakan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pencatatan, pelunasan kas denda, dan kuitansi pembayaran resmi perpustakaan.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs">
            <span className="text-rose-500 font-medium">Tertunggak: </span>
            <span className="font-bold text-rose-700 dark:text-rose-300">Rp {totalUnpaid.toLocaleString('id-ID')}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs">
            <span className="text-emerald-500 font-medium">Terkumpul: </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">Rp {totalPaid.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data denda...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Tidak ada catatan denda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Kode Denda</th>
                  <th className="p-3.5">Nama Anggota</th>
                  <th className="p-3.5">Buku Terkait</th>
                  <th className="p-3.5">Keterangan</th>
                  <th className="p-3.5">Total Denda</th>
                  <th className="p-3.5">Dibayar</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((fine) => (
                  <tr key={fine.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {fine.fineCode}
                      <div className="text-[10px] text-slate-400 font-normal">{fine.createdAt.slice(0, 10)}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{fine.memberName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{fine.memberCode}</div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{fine.bookTitle}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Barcode: {fine.barcode}</div>
                    </td>
                    <td className="p-3.5">
                      <span>{fine.reason}</span>
                      {fine.daysLate > 0 && (
                        <span className="text-[10px] text-rose-500 block font-semibold">{fine.daysLate} hari lewat tempo</span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      Rp {fine.totalFine.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600">
                      Rp {fine.paidAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          fine.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : fine.status === 'waived'
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {fine.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {fine.status !== 'paid' && fine.status !== 'waived' && (
                        <>
                          <button
                            onClick={() => handleOpenPay(fine)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                          >
                            Bayar Denda
                          </button>
                          {['superadmin', 'admin', 'kepala_sekolah'].includes(user?.role || '') && (
                            <button
                              onClick={() => handleWaiveFine(fine.id)}
                              className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs font-medium"
                              title="Bebaskan Denda"
                            >
                              Bebaskan
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => setReceiptFine(fine)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                        title="Cetak Bukti Pembayaran Denda"
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

      {/* Pay Modal */}
      {payingFine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Proses Pembayaran Denda
              </h3>
              <button onClick={() => setPayingFine(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Anggota:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{payingFine.memberName}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Tagihan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Rp {payingFine.totalFine.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Sisa Tagihan:</span>
                  <span className="font-bold text-rose-600">
                    Rp {(payingFine.totalFine - payingFine.paidAmount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  required
                  min={100}
                  max={payingFine.totalFine - payingFine.paidAmount}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="cash">Tunai (Cash Meja Sirkulasi)</option>
                  <option value="qris">QRIS Statis Perpustakaan</option>
                  <option value="transfer">Transfer Bank Sekolah</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayingFine(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptFine && (
        <ReceiptPrint
          type="fine"
          fine={receiptFine}
          settings={settings}
          onClose={() => setReceiptFine(null)}
        />
      )}
    </div>
  );
};
