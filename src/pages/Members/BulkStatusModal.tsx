import React, { useState, useMemo } from 'react';
import { Member, MemberStatus } from '../../types';
import {
  X,
  GraduationCap,
  UserCheck,
  UserX,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface BulkStatusModalProps {
  allMembers: Member[];
  selectedMemberIds: string[];
  currentGradeFilter?: string;
  currentClassFilter?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkStatusModal: React.FC<BulkStatusModalProps> = ({
  allMembers,
  selectedMemberIds,
  currentGradeFilter,
  currentClassFilter,
  onClose,
  onSuccess
}) => {
  const { success, error, warning } = useToast();

  // Scope mode: 'selected' | 'grade' | 'class' | 'filtered'
  const [scopeMode, setScopeMode] = useState<'selected' | 'grade' | 'class'>(
    selectedMemberIds.length > 0 ? 'selected' : 'grade'
  );

  const [selectedGrade, setSelectedGrade] = useState<string>(
    currentGradeFilter && currentGradeFilter !== 'all' ? currentGradeFilter : 'XII'
  );
  const [selectedClass, setSelectedClass] = useState<string>(
    currentClassFilter && currentClassFilter !== 'all' ? currentClassFilter : ''
  );
  const [targetStatus, setTargetStatus] = useState<MemberStatus>('graduated');
  const [reason, setReason] = useState(
    targetStatus === 'graduated' ? 'Kelulusan Siswa Angkatan 2025/2026' : 'Perubahan status massal'
  );
  const [loading, setLoading] = useState(false);
  const [previewSearch, setPreviewSearch] = useState('');

  // Extract unique classes for students
  const studentClasses = useMemo(() => {
    const classes = new Set<string>();
    allMembers.forEach((m) => {
      if (m.type === 'SISWA' && m.classGrade) {
        classes.add(m.classGrade.trim());
      }
    });
    return Array.from(classes).sort();
  }, [allMembers]);

  // Determine affected members based on scope
  const affectedMembers = useMemo(() => {
    const students = allMembers.filter((m) => m.type === 'SISWA');

    if (scopeMode === 'selected') {
      return students.filter((m) => selectedMemberIds.includes(m.id));
    }

    if (scopeMode === 'grade') {
      return students.filter((m) => {
        const c = (m.classGrade || '').toUpperCase().trim();
        if (selectedGrade === 'XII') {
          return c.includes('KELAS 12') || c.includes('12-') || c.startsWith('XII') || c.startsWith('12');
        }
        if (selectedGrade === 'XI') {
          return c.includes('KELAS 11') || c.includes('11-') || c.startsWith('XI') || c.startsWith('11');
        }
        if (selectedGrade === 'X') {
          return c.includes('KELAS 10') || c.includes('10-') || c.startsWith('X') || c.startsWith('10');
        }
        return true;
      });
    }

    if (scopeMode === 'class') {
      if (!selectedClass) return [];
      return students.filter((m) => m.classGrade?.trim().toLowerCase() === selectedClass.trim().toLowerCase());
    }

    return [];
  }, [allMembers, scopeMode, selectedMemberIds, selectedGrade, selectedClass]);

  // Check how many have active unreturned loans
  const membersWithActiveLoans = useMemo(() => {
    return affectedMembers.filter((m) => (m as any).activeLoansCount > 0);
  }, [affectedMembers]);

  // Filtered preview
  const filteredPreview = useMemo(() => {
    if (!previewSearch.trim()) return affectedMembers;
    const q = previewSearch.toLowerCase().trim();
    return affectedMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.identityNumber.includes(q) ||
        (m.classGrade && m.classGrade.toLowerCase().includes(q))
    );
  }, [affectedMembers, previewSearch]);

  const handleStatusChange = (newStatus: MemberStatus) => {
    setTargetStatus(newStatus);
    if (newStatus === 'graduated') {
      setReason('Kelulusan Siswa Angkatan 2025/2026');
    } else if (newStatus === 'transferred') {
      setReason('Mutasi Keluar Siswa');
    } else if (newStatus === 'active') {
      setReason('Aktivasi Massal Siswa Baru / Mutasi Masuk');
    } else {
      setReason('Penonaktifan Massal');
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (affectedMembers.length === 0) {
      error('Tidak ada siswa yang dipilih untuk diubah statusnya.');
      return;
    }

    const confirmMsg = `Yakin ingin mengubah status ${affectedMembers.length} siswa menjadi "${
      targetStatus === 'active'
        ? 'Aktif'
        : targetStatus === 'graduated'
        ? 'Lulus (Alumni)'
        : targetStatus === 'transferred'
        ? 'Mutasi Keluar'
        : 'Non-Aktif'
    }"?`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/members/bulk-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          memberIds: affectedMembers.map((m) => m.id),
          targetStatus,
          reason: reason.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        success(data.message || `Berhasil memperbarui status ${data.count} siswa.`);
        if (data.warnings && data.warnings.length > 0) {
          warning(
            `Catatan: ${data.warnings.length} siswa masih memiliki peminjaman buku yang belum dikembalikan.`
          );
        }
        onSuccess();
        onClose();
      } else {
        error(data.error || 'Gagal mengubah status massal.');
      }
    } catch (err) {
      error('Terjadi kesalahan jaringan saat memproses perubahan massal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Ubah Status Siswa Massal / Kelulusan
              </h3>
              <p className="text-xs text-slate-500">
                Nonaktifkan siswa lulus secara serentak atau aktifkan rombel siswa baru
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

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {/* Step 1: Target Scope */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              1. Pilih Target Siswa *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScopeMode('grade')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scopeMode === 'grade'
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5 font-bold">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  Tingkat Kelas
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-normal">
                  Contoh: Seluruh Siswa Kelas XII (Lulusan)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScopeMode('class')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scopeMode === 'class'
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5 font-bold">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Kelas / Rombel Spesifik
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-normal">
                  Contoh: Kelas XII IPS 1
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScopeMode('selected')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  scopeMode === 'selected'
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Siswa Dicentang
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-normal">
                  {selectedMemberIds.length} siswa terpilih di tabel
                </div>
              </button>
            </div>
          </div>

          {/* Sub-selectors for Scope */}
          {scopeMode === 'grade' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Tingkat Kelas:
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'XII', label: 'Kelas XII (Lulusan)', badge: 'Rekomendasi Lulus' },
                  { id: 'XI', label: 'Kelas XI', badge: 'Fase F' },
                  { id: 'X', label: 'Kelas X', badge: 'Fase E' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGrade(g.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      selectedGrade === g.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>{g.label}</div>
                    <div className="text-[9px] opacity-80 font-normal">{g.badge}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {scopeMode === 'class' && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pilih Rombel / Kelas:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="">-- Pilih Kelas --</option>
                {studentClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} (
                    {allMembers.filter((m) => m.type === 'SISWA' && m.classGrade === cls).length}{' '}
                    siswa)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Step 2: Target Status */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              2. Tetapkan Status Baru *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  targetStatus === 'graduated'
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="bulkStatus"
                  value="graduated"
                  checked={targetStatus === 'graduated'}
                  onChange={() => handleStatusChange('graduated')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                    Lulus / Alumni (Non-Aktif)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Menandai siswa telah menamatkan sekolah & menonaktifkan akun
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  targetStatus === 'active'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="bulkStatus"
                  value="active"
                  checked={targetStatus === 'active'}
                  onChange={() => handleStatusChange('active')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Aktif (Siswa Aktif / Mutasi Masuk)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Mengaktifkan kembali hak akses & sirkulasi buku
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  targetStatus === 'transferred'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="bulkStatus"
                  value="transferred"
                  checked={targetStatus === 'transferred'}
                  onChange={() => handleStatusChange('transferred')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                    Nonaktif (Mutasi Keluar)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Siswa pindah sekolah ke instansi/daerah lain
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                  targetStatus === 'inactive'
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="bulkStatus"
                  value="inactive"
                  checked={targetStatus === 'inactive'}
                  onChange={() => handleStatusChange('inactive')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    Mutasi / Nonaktif
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Penonaktifan massal untuk mutasi / administrasi
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Keterangan / Alasan Perubahan Massal
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Kelulusan Siswa Angkatan 2025/2026"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          {/* Active Loans Warning */}
          {membersWithActiveLoans.length > 0 && targetStatus !== 'active' && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Peringatan Sirkulasi: </span>
                Ditemukan <span className="font-bold underline">{membersWithActiveLoans.length} siswa</span> yang masih tercatat memiliki pinjaman buku aktif yang belum dikembalikan. Status akun akan tetap dinonaktifkan, namun pastikan pemustaka menyelesaikan tanggungan buku.
              </div>
            </div>
          )}

          {/* Step 3: Interactive Preview of Affected Students */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                3. Pratinjau Siswa Terdampak ({affectedMembers.length} Siswa)
              </label>
              {affectedMembers.length > 5 && (
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Cari di pratinjau..."
                    className="w-full pl-8 pr-2.5 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-48 overflow-y-auto bg-slate-50/50 dark:bg-slate-800/30">
              {affectedMembers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada data siswa yang cocok dengan kriteria target di atas.
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0 text-[10px]">
                    <tr>
                      <th className="p-2.5">Nama Siswa</th>
                      <th className="p-2.5">NIS</th>
                      <th className="p-2.5">Kelas</th>
                      <th className="p-2.5">Status Saat Ini</th>
                      <th className="p-2.5 text-right">Pinjaman Aktif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPreview.map((m) => {
                      const hasLoan = (m as any).activeLoansCount > 0;
                      return (
                        <tr key={m.id} className="hover:bg-white dark:hover:bg-slate-800/60">
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                            {m.name}
                          </td>
                          <td className="p-2.5 font-mono text-slate-500">{m.identityNumber}</td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-300 font-semibold">
                            {m.classGrade || '-'}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                m.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : m.status === 'graduated'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}
                            >
                              {m.status === 'active' ? 'Aktif' : m.status === 'graduated' ? 'Lulus' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            {hasLoan ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                                {(m as any).activeLoansCount} Buku
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">0</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="text-xs text-slate-500">
            Total target: <span className="font-bold text-slate-900 dark:text-white">{affectedMembers.length} siswa</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={loading || affectedMembers.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <span>Memproses {affectedMembers.length} Siswa...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Terapkan Status ke {affectedMembers.length} Siswa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
