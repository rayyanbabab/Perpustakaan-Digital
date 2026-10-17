import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Member, MemberType, MemberStatus } from '../../types';
import {
  Users,
  Plus,
  Search,
  Filter,
  CreditCard,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  GraduationCap,
  ArrowRightLeft,
  UserCheck,
  UserX,
  RotateCcw,
  CheckSquare,
  Square,
  CheckCircle2,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { MemberCardPrint } from '../../components/common/MemberCardPrint';
import { ExportDropdown } from '../../components/common/ExportDropdown';
import { LOCALIZED_COLUMNS } from '../../services/exportService';
import { SingleStatusModal } from './SingleStatusModal';
import { BulkStatusModal } from './BulkStatusModal';

// Helper to determine Grade level from class name
function getGradeFromClassName(classGrade?: string): 'X' | 'XI' | 'XII' | 'OTHER' {
  if (!classGrade) return 'OTHER';
  const c = classGrade.toUpperCase().trim();
  // New format: "Kelas 10-A", "Kelas 11-A", "Kelas 12-A"
  if (c.includes('KELAS 12') || c.includes('12-')) return 'XII';
  if (c.includes('KELAS 11') || c.includes('11-')) return 'XI';
  if (c.includes('KELAS 10') || c.includes('10-')) return 'X';
  
  // Legacy support
  if (c.startsWith('XII') || c.startsWith('12')) return 'XII';
  if (c.startsWith('XI') || c.startsWith('11')) return 'XI';
  if (c.startsWith('X') || c.startsWith('10')) return 'X';
  return 'OTHER';
}

export const MemberList: React.FC = () => {
  const { user, settings } = useAuth();
  const { success, error, warning } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Checkbox selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [statusModalMember, setStatusModalMember] = useState<Member | null>(null);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [printingMember, setPrintingMember] = useState<Member | null>(null);

  // Form Data State
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    type: 'SISWA',
    identityNumber: '',
    email: '',
    phone: '',
    gender: 'L',
    classGrade: 'X-E 1',
    subject: '',
    position: '',
    photoUrl: '',
    status: 'active',
    notes: ''
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/members', window.location.origin);
      if (search.trim()) url.searchParams.append('q', search.trim());
      if (typeFilter !== 'all') url.searchParams.append('type', typeFilter);
      if (gradeFilter !== 'all') url.searchParams.append('grade', gradeFilter);
      if (classFilter !== 'all') url.searchParams.append('classGrade', classFilter);
      if (statusFilter !== 'all') url.searchParams.append('status', statusFilter);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMembers(json.members || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, typeFilter, gradeFilter, classFilter, statusFilter]);

  // Extract all distinct class names for the dropdown
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    members.forEach((m) => {
      if (m.type === 'SISWA' && m.classGrade) {
        // If grade filter is set, only include matching classes
        if (gradeFilter === 'all' || getGradeFromClassName(m.classGrade) === gradeFilter) {
          classes.add(m.classGrade.trim());
        }
      }
    });
    return Array.from(classes).sort();
  }, [members, gradeFilter]);

  // Reset class filter if grade filter changes and current class doesn't belong
  const handleGradeFilterChange = (newGrade: string) => {
    setGradeFilter(newGrade);
    setClassFilter('all');
    setSelectedIds([]);
  };

  // Checkbox handlers
  const handleSelectAll = () => {
    if (selectedIds.length === members.length && members.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map((m) => m.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenCreate = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      type: 'SISWA',
      identityNumber: '',
      email: '',
      phone: '081234567890',
      gender: 'L',
      classGrade: 'Kelas 10-A',
      subject: '',
      position: '',
      photoUrl: '',
      status: 'active',
      notes: ''
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      type: member.type,
      identityNumber: member.identityNumber,
      email: member.email,
      phone: member.phone,
      gender: member.gender,
      classGrade: member.classGrade,
      subject: member.subject,
      position: member.position,
      photoUrl: member.photoUrl,
      status: member.status || 'active',
      notes: member.notes || ''
    });
    setShowFormModal(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.identityNumber) {
      error('Nama dan Nomor Identitas (NIS/NIP) wajib diisi.');
      return;
    }

    try {
      const url = editingMember ? `/api/members/${editingMember.id}` : '/api/members';
      const method = editingMember ? 'PUT' : 'POST';

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
        success(editingMember ? 'Data anggota berhasil diperbarui.' : 'Anggota baru berhasil didaftarkan.');
        setShowFormModal(false);
        fetchMembers();
      } else {
        error(data.error || 'Gagal menyimpan data anggota');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan');
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (!confirm(`Hapus data anggota ${member.name}?`)) return;

    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        success('Anggota berhasil dihapus.');
        fetchMembers();
      } else {
        const data = await res.json();
        error(data.error || 'Gagal menghapus anggota');
      }
    } catch (e) {
      error('Gagal menghapus anggota');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setGradeFilter('all');
    setClassFilter('all');
    setStatusFilter('all');
    setSelectedIds([]);
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== 'all' ||
    gradeFilter !== 'all' ||
    classFilter !== 'all' ||
    statusFilter !== 'all';

  // Status badge renderer
  const renderStatusBadge = (member: Member) => {
    const status = member.status || 'active';
    let label = 'Aktif';
    let bgClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300/40';

    if (status === 'graduated') {
      label = 'Lulus (Alumni)';
      bgClass = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300/40';
    } else if (status === 'transferred') {
      label = 'Mutasi Keluar';
      bgClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300/40';
    } else if (status === 'inactive') {
      label = 'Mutasi';
      bgClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300/40';
    } else if (status === 'suspended') {
      label = 'Ditangguhkan';
      bgClass = 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }

    return (
      <button
        onClick={() => setStatusModalMember(member)}
        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${bgClass} hover:opacity-85 transition-all inline-flex items-center gap-1 cursor-pointer`}
        title="Klik untuk ubah status (Mutasi/Kelulusan/Aktivasi)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {label}
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600" />
            Direktori Data Siswa & Guru
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola data pemustaka, filter tingkat kelas & rombel, status kelulusan, dan mutasi siswa SMA Negeri 3 Nganjuk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportDropdown
            data={members}
            columns={LOCALIZED_COLUMNS.members}
            filenamePrefix="data_siswa_perpustakaan"
            sheetName="Daftar Anggota"
            title="Direktori Data Siswa & Anggota Perpustakaan SMAN 3 Nganjuk"
            subtitle={`Widya Pustaka - Total: ${members.length} anggota`}
            label="Ekspor Excel / CSV"
          />

          {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
            <>
              <button
                onClick={() => setShowBulkStatusModal(true)}
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
                title="Kelulusan Massal & Perubahan Status Rombel"
              >
                <GraduationCap className="w-4 h-4" />
                Ubah Status Massal / Kelulusan
              </button>

              <button
                onClick={handleOpenCreate}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                Registrasi Siswa / Guru
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3.5">
        {/* Row 1: Search & Type Tabs */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa/guru, NIS/NIP, NISN, no HP..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Semua Tipe' },
              { id: 'SISWA', label: 'Siswa' },
              { id: 'GURU', label: 'Guru' },
              { id: 'TENDIK', label: 'Tendik' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTypeFilter(t.id);
                  if (t.id !== 'SISWA' && t.id !== 'all') {
                    setGradeFilter('all');
                    setClassFilter('all');
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  typeFilter === t.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters (Tingkat Kelas, Kelas, Status) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* 1. Filter Tingkat Kelas */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              Tingkat Kelas:
            </label>
            <select
              value={gradeFilter}
              onChange={(e) => handleGradeFilterChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Tingkat</option>
              <option value="X">Kelas X (Fase E)</option>
              <option value="XI">Kelas XI (Fase F)</option>
              <option value="XII">Kelas XII (Tingkat Akhir)</option>
            </select>
          </div>

          {/* 2. Filter Kelas / Rombel */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Kelas / Rombel:
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Kelas ({availableClasses.length} Rombel)</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Status */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Status Keanggotaan:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="graduated">Lulus (Alumni)</option>
              <option value="transferred">Mutasi Keluar (Siswa)</option>
              <option value="inactive">Mutasi</option>
            </select>
          </div>

          {/* 4. Filter Action & Summary */}
          <div className="flex items-end gap-2">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            )}
            <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] text-slate-400 font-semibold block">Ditemukan</span>
              <span className="font-bold text-slate-900 dark:text-white text-xs">
                {members.length} Pemustaka
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Sticky Bar when items are selected */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>{selectedIds.length} siswa terpilih dari daftar</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkStatusModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              Ubah Status {selectedIds.length} Siswa Terpilih...
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Batal Pilih
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>Memuat data siswa & anggota...</div>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
            <div>Tidak ada data pemustaka yang sesuai dengan kriteria filter.</div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
                    <th className="p-3.5 w-10 text-center">
                      <button
                        onClick={handleSelectAll}
                        className="text-slate-400 hover:text-slate-600 focus:outline-hidden"
                      >
                        {selectedIds.length === members.length && members.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="p-3.5">Foto & Nama</th>
                  <th className="p-3.5">NIS / Identitas</th>
                  <th className="p-3.5">Tipe & Kelas/Mapel</th>
                  <th className="p-3.5">Kontak</th>
                  <th className="p-3.5">Status Akun</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {members.map((member) => {
                  const isChecked = selectedIds.includes(member.id);
                  const isStudent = member.type === 'SISWA';

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isChecked ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''
                      }`}
                    >
                      {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(member.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              member.photoUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`
                            }
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Gender: {member.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                              {member.notes && (
                                <span className="ml-1 text-slate-500 italic truncate max-w-[150px] inline-block align-bottom">
                                  • {member.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {member.identityNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {isStudent && member.nisn ? `NISN: ${member.nisn}` : `Kode: ${member.memberCode}`}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px] uppercase">
                            {member.type}
                          </span>
                          {isStudent && member.classGrade && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                              {member.classGrade}
                            </span>
                          )}
                        </div>
                        {!isStudent && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">
                            {member.subject || member.position || 'Pengajar'}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        <div>{member.phone || '-'}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {member.email || '-'}
                        </div>
                      </td>
                      <td className="p-3.5">{renderStatusBadge(member)}</td>
                      <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                        {/* Single Status Switcher Button */}
                        {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
                          <button
                            onClick={() => setStatusModalMember(member)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-all"
                            title="Ubah Status (Mutasi/Aktivasi/Lulus)"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 inline" />
                          </button>
                        )}

                        <button
                          onClick={() => setPrintingMember(member)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-all"
                          title="Cetak Kartu Anggota Barcode"
                        >
                          <CreditCard className="w-4 h-4 inline" />
                        </button>

                        {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(member)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all"
                              title="Edit Data Anggota"
                            >
                              <Edit2 className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                              title="Hapus Anggota"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Create / Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingMember ? 'Edit Data Siswa / Anggota' : 'Pendaftaran Anggota Perpustakaan'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tipe Keanggotaan *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as MemberType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                  >
                    <option value="SISWA">SISWA</option>
                    <option value="GURU">GURU</option>
                    <option value="TENDIK">TENAGA KEPENDIDIKAN</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {formData.type === 'SISWA' ? 'NIS / Nomor Induk Siswa *' : 'NIP / ID Pegawai *'}
                  </label>
                  <input
                    type="text"
                    value={formData.identityNumber}
                    onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                    required
                    placeholder={formData.type === 'SISWA' ? 'Contoh: 202410101' : 'Contoh: 198005122005011003'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              {formData.type === 'SISWA' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kelas / Rombel Siswa
                    </label>
                    <input
                      type="text"
                      value={formData.classGrade}
                      onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                      placeholder="Contoh: Kelas 10-A / Kelas 11-B / Kelas 12-C"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Status Keanggotaan
                    </label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="active">Aktif (Siswa Aktif / Mutasi Masuk)</option>
                      <option value="graduated">Lulus / Alumni (Nonaktif)</option>
                      <option value="transferred">Mutasi Keluar (Siswa)</option>
                      <option value="inactive">Mutasi</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mata Pelajaran / Bidang Tugas
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Contoh: Bahasa Indonesia / Matematika"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Status Keanggotaan
                    </label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Mutasi</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="siswa@sman3nganjuk.sch.id"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan / Keterangan Tambahan
                </label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Siswa pindahan, ekskul, dll."
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  {editingMember ? 'Simpan Perubahan' : 'Daftarkan Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Member Status Modal */}
      {statusModalMember && (
        <SingleStatusModal
          member={statusModalMember}
          onClose={() => setStatusModalMember(null)}
          onSuccess={fetchMembers}
        />
      )}

      {/* Bulk Status Update Modal */}
      {showBulkStatusModal && (
        <BulkStatusModal
          allMembers={members}
          selectedMemberIds={selectedIds}
          currentGradeFilter={gradeFilter}
          currentClassFilter={classFilter}
          onClose={() => setShowBulkStatusModal(false)}
          onSuccess={() => {
            setSelectedIds([]);
            fetchMembers();
          }}
        />
      )}

      {/* Member Card Print Modal */}
      {printingMember && (
        <MemberCardPrint
          member={printingMember}
          settings={settings}
          onClose={() => setPrintingMember(null)}
        />
      )}
    </div>
  );
};
