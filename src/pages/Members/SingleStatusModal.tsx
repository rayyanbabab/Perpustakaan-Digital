import React, { useState } from 'react';
import { Member, MemberStatus } from '../../types';
import {
  X,
  UserCheck,
  UserX,
  GraduationCap,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface SingleStatusModalProps {
  member: Member;
  onClose: () => void;
  onSuccess: () => void;
}

export const SingleStatusModal: React.FC<SingleStatusModalProps> = ({
  member,
  onClose,
  onSuccess
}) => {
  const { success, error } = useToast();
  const [status, setStatus] = useState<MemberStatus>(member.status || 'active');
  const [reason, setReason] = useState('');
  const [newClassGrade, setNewClassGrade] = useState(member.classGrade || '');
  const [loading, setLoading] = useState(false);

  const isStudent = member.type === 'SISWA';
  const hasActiveLoans = (member as any).activeLoansCount > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/members/${member.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          status,
          reason: reason.trim(),
          classGrade: isStudent ? newClassGrade.trim() : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        success(
          `Status ${member.name} berhasil diubah menjadi "${
            status === 'active'
              ? 'Aktif'
              : status === 'graduated'
              ? 'Lulus (Alumni)'
              : status === 'transferred'
              ? 'Mutasi Keluar'
              : 'Non-Aktif'
          }".`
        );
        onSuccess();
        onClose();
      } else {
        error(data.error || 'Gagal mengubah status');
      }
    } catch (err) {
      error('Terjadi kesalahan jaringan saat menyimpan status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Ubah Status Siswa / Anggota
              </h3>
              <p className="text-[11px] text-slate-500">
                Kelola status aktif, kelulusan, mutasi masuk, atau mutasi keluar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Profile Card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
          <img
            src={
              member.photoUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`
            }
            alt={member.name}
            className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
          />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
              {member.name}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
              <span>{isStudent ? `NIS: ${member.identityNumber}` : `NIP: ${member.identityNumber}`}</span>
              {isStudent && member.classGrade && (
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold rounded text-[10px]">
                  {member.classGrade}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Status Saat Ini</div>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                member.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : member.status === 'graduated'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  : member.status === 'transferred'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {member.status === 'active'
                ? 'Aktif'
                : member.status === 'graduated'
                ? 'Lulus'
                : member.status === 'transferred'
                ? 'Mutasi Keluar'
                : 'Nonaktif'}
            </span>
          </div>
        </div>

        {/* Warning if active loans */}
        {hasActiveLoans && status !== 'active' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold">Perhatian: </span>
              Anggota ini masih tercatat memiliki{' '}
              <span className="font-bold underline">
                {(member as any).activeLoansCount} eksemplar buku
              </span>{' '}
              yang belum dikembalikan. Pastikan buku telah diserahterimakan sebelum menonaktifkan akun.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Choice */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Pilih Status Baru *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  status === 'active'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Aktif (Siswa Aktif / Mutasi Masuk)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Memiliki hak penuh meminjam buku & reservasi
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  status === 'transferred'
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-xs ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="transferred"
                  checked={status === 'transferred'}
                  onChange={() => setStatus('transferred')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                    Nonaktif (Mutasi Keluar)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Pindah sekolah ke instansi/daerah lain
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  status === 'graduated'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="graduated"
                  checked={status === 'graduated'}
                  onChange={() => setStatus('graduated')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    Nonaktif (Lulus / Alumni)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Telah menamatkan pendidikan di SMA Negeri 3 Nganjuk
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  status === 'inactive'
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 shadow-xs ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    Nonaktif Umum / Cuti
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Penonaktifan sementara atau alasan administratif
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* If activating student who transferred in, optionally update class */}
          {isStudent && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kelas / Rombel Siswa (Opsional untuk pembaruan kelas)
              </label>
              <input
                type="text"
                value={newClassGrade}
                onChange={(e) => setNewClassGrade(e.target.value)}
                placeholder="Contoh: X-E 1 / XI F-2 / XII MIPA 1"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              />
            </div>
          )}

          {/* Reason / Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Alasan / Keterangan Mutasi / Kelulusan (Opsional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                status === 'active'
                  ? 'Contoh: Siswa mutasi masuk dari SMAN 1 Berbek diaktifkan'
                  : status === 'transferred'
                  ? 'Contoh: Pindah sekolah ke SMAN 2 Surabaya'
                  : status === 'graduated'
                  ? 'Contoh: Lulus Angkatan 2025/2026'
                  : 'Contoh: Nonaktif sementara'
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Perubahan Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
