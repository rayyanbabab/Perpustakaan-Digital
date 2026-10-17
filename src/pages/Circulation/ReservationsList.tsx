import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Reservation } from '../../types';
import { BookmarkCheck, Clock, CheckCircle2, XCircle, User, BookOpen } from 'lucide-react';

export const ReservationsList: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/circulation/reservations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setReservations(json.reservations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'ready' | 'completed' | 'cancelled') => {
    try {
      const res = await fetch(`/api/circulation/reservations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        success(`Status reservasi berhasil diubah menjadi "${status}".`);
        fetchReservations();
      }
    } catch (e) {
      error('Gagal memperbarui status reservasi');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-amber-500" />
            Antrean Reservasi Buku
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar pemesanan buku oleh siswa atau guru saat buku sedang dalam peminjaman atau disiapkan.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Memuat data reservasi...</div>
        ) : reservations.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Belum ada antrean reservasi buku.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Kode Reservasi</th>
                  <th className="p-3.5">Nama Peminjam</th>
                  <th className="p-3.5">Judul Buku</th>
                  <th className="p-3.5">Tanggal Reservasi</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {res.reservationCode}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{res.memberName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{res.memberCode}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {res.bookTitle}
                    </td>
                    <td className="p-3.5 text-slate-500">{res.reservationDate}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          res.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : res.status === 'ready'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : res.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {res.status === 'pending'
                          ? 'Menunggu Buku'
                          : res.status === 'ready'
                            ? 'Siap Diambil'
                            : res.status === 'completed'
                              ? 'Selesai Dipinjam'
                              : 'Dibatalkan'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && res.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(res.id, 'ready')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Tandai Siap Diambil
                        </button>
                      )}
                      {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && res.status === 'ready' && (
                        <button
                          onClick={() => handleUpdateStatus(res.id, 'completed')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Selesaikan
                        </button>
                      )}
                      {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (res.status === 'pending' || res.status === 'ready') && (
                        <button
                          onClick={() => handleUpdateStatus(res.id, 'cancelled')}
                          className="px-2 py-1 text-rose-500 hover:text-rose-700 text-xs"
                        >
                          Batalkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
