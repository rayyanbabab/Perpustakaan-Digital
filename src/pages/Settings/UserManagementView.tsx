import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, Member } from '../../types';
import {
  Shield,
  Users,
  UserPlus,
  Key,
  Trash2,
  Edit,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  GraduationCap,
  Download,
  Lock,
  UserCheck,
  UserX,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { ExportDropdown } from '../../components/common/ExportDropdown';
import { LOCALIZED_COLUMNS } from '../../services/exportService';

interface ExtendedUser extends User {
  memberInfo?: {
    id: string;
    identityNumber: string;
    type: string;
    classGrade?: string;
    subject?: string;
    phone?: string;
    gender?: string;
    status?: string;
  };
}

interface GeneratedStudentAccount {
  id: string;
  fullName: string;
  username: string;
  plainPassword: string;
  email: string;
  nis: string;
  classGrade?: string;
  status: 'created' | 'updated' | 'skipped';
}

export const UserManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error, warning, info } = useToast();

  const isSuperadmin = currentUser?.role === 'superadmin';

  // Data States
  const [usersList, setUsersList] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [stats, setStats] = useState<{
    totalUsers: number;
    superadmins: number;
    admins: number;
    librarians: number;
    teachers: number;
    students: number;
    activeUsers: number;
    totalStudentMembers: number;
    unregisteredStudentsCount: number;
  }>({
    totalUsers: 0,
    superadmins: 0,
    admins: 0,
    librarians: 0,
    teachers: 0,
    students: 0,
    activeUsers: 0,
    totalStudentMembers: 0,
    unregisteredStudentsCount: 0
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAutoGenerateModal, setShowAutoGenerateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // Selected User for Modals
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);

  // Form States
  const [addForm, setAddForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'pustakawan',
    memberId: '',
    isActive: true
  });

  const [editForm, setEditForm] = useState({
    id: '',
    fullName: '',
    username: '',
    email: '',
    role: 'pustakawan',
    memberId: '',
    isActive: true
  });

  const [resetForm, setResetForm] = useState({
    passwordType: 'default_role' as 'default_role' | 'nis' | 'custom' | 'random',
    customPassword: '',
    showCustomPassword: false
  });

  const [resetResult, setResetResult] = useState<{
    username: string;
    fullName: string;
    newPassword: string;
  } | null>(null);

  // Auto Generate Students State
  const [autoGenConfig, setAutoGenConfig] = useState({
    passwordType: 'nis' as 'nis' | 'siswa123' | 'custom',
    customPassword: '',
    usernameFormat: 'nis' as 'nis' | 'prefix_nis',
    overwriteExisting: false
  });
  const [autoGenPreview, setAutoGenPreview] = useState<{
    totalStudents: number;
    unregisteredCount: number;
    registeredCount: number;
    unregisteredStudents: Member[];
    registeredStudents: Member[];
  }>({
    totalStudents: 0,
    unregisteredCount: 0,
    registeredCount: 0,
    unregisteredStudents: [],
    registeredStudents: []
  });
  const [generating, setGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<{
    stats: { totalStudents: number; createdCount: number; updatedCount: number; skippedCount: number };
    generatedList: GeneratedStudentAccount[];
  } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Users & Members
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUsersList(json.users || []);
        if (json.stats) setStats(json.stats);
      } else {
        const err = await res.json();
        error(err.error || 'Gagal memuat daftar pengguna.');
      }
    } catch (e) {
      console.error(e);
      error('Terjadi kesalahan jaringan saat memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members?limit=2000', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setMembersList(json.members || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudentPreview = async () => {
    try {
      const res = await fetch('/api/settings/users/students-preview', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAutoGenPreview(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMembers();
  }, []);

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    // Role filter
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;

    // Status filter
    if (statusFilter === 'active' && u.isActive === false) return false;
    if (statusFilter === 'inactive' && u.isActive !== false) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (u.fullName || u.name || '').toLowerCase().includes(q);
      const matchUsername = u.username.toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchNis = u.memberInfo?.identityNumber?.toLowerCase().includes(q);
      const matchClass = u.memberInfo?.classGrade?.toLowerCase().includes(q);
      return matchName || matchUsername || matchEmail || matchNis || matchClass;
    }

    return true;
  });

  // Handler: Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.username.trim() || !addForm.email.trim() || !addForm.password) {
      warning('Harap lengkapi semua kolom wajib.');
      return;
    }
    if (addForm.password.length < 6) {
      warning('Password minimal harus 6 karakter.');
      return;
    }

    try {
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      if (res.ok) {
        success(`Pengguna @${addForm.username} (${addForm.role}) berhasil ditambahkan.`);
        setShowAddModal(false);
        setAddForm({
          name: '',
          username: '',
          email: '',
          password: '',
          role: 'pustakawan',
          memberId: '',
          isActive: true
        });
        fetchUsers();
      } else {
        error(data.error || 'Gagal menambahkan pengguna.');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan.');
    }
  };

  // Handler: Open Edit Modal
  const handleOpenEdit = (user: ExtendedUser) => {
    setSelectedUser(user);
    setEditForm({
      id: user.id,
      fullName: user.fullName || user.name || '',
      username: user.username,
      email: user.email,
      role: user.role,
      memberId: user.memberId || '',
      isActive: user.isActive !== false
    });
    setShowEditModal(true);
  };

  // Handler: Save Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/settings/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        success(`Data pengguna @${editForm.username} berhasil diperbarui.`);
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        error(data.error || 'Gagal memperbarui data pengguna.');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan.');
    }
  };

  // Handler: Open Reset Password Modal
  const handleOpenReset = (user: ExtendedUser) => {
    setSelectedUser(user);
    setResetForm({
      passwordType: user.role === 'siswa' ? 'nis' : 'default_role',
      customPassword: '',
      showCustomPassword: false
    });
    setResetResult(null);
    setShowResetModal(true);
  };

  // Handler: Execute Reset Password
  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    let payload: any = { passwordType: resetForm.passwordType };
    if (resetForm.passwordType === 'custom') {
      if (!resetForm.customPassword || resetForm.customPassword.length < 6) {
        warning('Password baru kustom minimal harus 6 karakter.');
        return;
      }
      payload.newPassword = resetForm.customPassword;
    }

    try {
      const res = await fetch(`/api/settings/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || 'Password berhasil direset.');
        setResetResult({
          username: selectedUser.username,
          fullName: selectedUser.fullName || selectedUser.name || selectedUser.username,
          newPassword: data.newPassword
        });
      } else {
        error(data.error || 'Gagal mereset password pengguna.');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan.');
    }
  };

  // Handler: Toggle Active Status
  const handleToggleStatus = async (user: ExtendedUser) => {
    if (user.id === currentUser?.id) {
      warning('Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.');
      return;
    }

    try {
      const res = await fetch(`/api/settings/users/${user.id}/toggle-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message);
        fetchUsers();
      } else {
        error(data.error || 'Gagal mengubah status akun.');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan.');
    }
  };

  // Handler: Open Delete Modal
  const handleOpenDelete = (user: ExtendedUser) => {
    if (user.id === currentUser?.id) {
      warning('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Handler: Execute Delete
  const handleExecuteDelete = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/settings/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || 'Pengguna berhasil dihapus.');
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        error(data.error || 'Gagal menghapus pengguna.');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan.');
    }
  };

  // Handler: Open Auto Generate Modal
  const handleOpenAutoGenerate = () => {
    fetchStudentPreview();
    setShowAutoGenerateModal(true);
  };

  // Handler: Execute Auto Generate Students
  const handleExecuteAutoGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/settings/users/auto-generate-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify(autoGenConfig)
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || 'Akun siswa berhasil digenerate.');
        setShowAutoGenerateModal(false);
        setGenerationResults(data);
        setShowResultModal(true);
        fetchUsers();
      } else {
        error(data.error || 'Gagal membuat akun siswa otomatis.');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan saat proses pembuatan akun siswa.');
    } finally {
      setGenerating(false);
    }
  };

  // Helper Copy to Clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Disalin ke papan klip: ' + text);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Role Badges Color Helper
  const getRoleBadge = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'superadmin':
        return (
          <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 font-black text-[10px] tracking-wider uppercase inline-flex items-center gap-1 border border-rose-200 dark:border-rose-900">
            <Shield className="w-3 h-3 text-rose-600" />
            Superadmin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 font-bold text-[10px] tracking-wide uppercase inline-flex items-center gap-1 border border-blue-200 dark:border-blue-900">
            <Shield className="w-3 h-3 text-blue-600" />
            Admin
          </span>
        );
      case 'pustakawan':
        return (
          <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 font-bold text-[10px] tracking-wide uppercase inline-flex items-center gap-1 border border-indigo-200 dark:border-indigo-900">
            <Users className="w-3 h-3 text-indigo-600" />
            Pustakawan
          </span>
        );
      case 'kepala_sekolah':
        return (
          <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-[10px] tracking-wide uppercase inline-flex items-center gap-1 border border-amber-200 dark:border-amber-900">
            <Shield className="w-3 h-3 text-amber-600" />
            Kepala Sekolah
          </span>
        );
      case 'guru':
        return (
          <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 font-bold text-[10px] tracking-wide uppercase inline-flex items-center gap-1 border border-purple-200 dark:border-purple-900">
            <GraduationCap className="w-3 h-3 text-purple-600" />
            Guru
          </span>
        );
      case 'siswa':
        return (
          <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 font-bold text-[10px] tracking-wide uppercase inline-flex items-center gap-1 border border-teal-200 dark:border-teal-900">
            <GraduationCap className="w-3 h-3 text-teal-600" />
            Siswa
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px] tracking-wide uppercase">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-1">
            <Shield className="w-3.5 h-3.5 text-blue-300" />
            Role-Based Access Control & User Administration
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Manajemen Pengguna Sistem
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Kelola seluruh akun staf perpustakaan, guru, dan otomatisasi pembuatan user login bagi seluruh siswa SMA Negeri 3 Nganjuk.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          {/* Auto Generate Students Button */}
          {isSuperadmin && (
            <button
              onClick={handleOpenAutoGenerate}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40 border border-emerald-400/30"
              title="Buat akun login secara otomatis untuk seluruh siswa"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Buat Akun Siswa Otomatis</span>
              {stats.unregisteredStudentsCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-400 text-slate-900 rounded-full text-[10px] font-black animate-pulse">
                  {stats.unregisteredStudentsCount} Belum Ada Akun
                </span>
              )}
            </button>
          )}

          {/* Add User Manual Button */}
          {isSuperadmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-950/40 border border-blue-400/30"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah User Baru</span>
            </button>
          )}

          {/* Export Users */}
          <ExportDropdown
            data={usersList}
            columns={LOCALIZED_COLUMNS.users}
            filenamePrefix="data_pengguna_sistem_sman3nganjuk"
            sheetName="Pengguna Sistem"
            title="Daftar Pengguna Sistem Perpustakaan Widya Pustaka"
            subtitle="SMA Negeri 3 Nganjuk"
            label="Export User"
          />
        </div>

        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Pengguna Sistem</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalUsers}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
            {stats.activeUsers} akun aktif ({stats.totalUsers - stats.activeUsers} nonaktif)
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Akun Siswa Login</span>
            <GraduationCap className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.students}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Dari total {stats.totalStudentMembers} data siswa
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Staf & Dewan Guru</span>
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.superadmins + stats.admins + stats.librarians + stats.teachers}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {stats.librarians} Pustakawan, {stats.teachers} Guru, {stats.admins + stats.superadmins} Admin
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Siswa Belum Punya Akun</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.unregisteredStudentsCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {stats.unregisteredStudentsCount > 0 ? (
              <button
                onClick={handleOpenAutoGenerate}
                className="text-teal-700 dark:text-teal-400 font-bold hover:underline"
              >
                Klik untuk generate otomatis →
              </button>
            ) : (
              'Seluruh siswa telah memiliki akun login'
            )}
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
        {/* Search & Role Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, @username, email, NIS, atau kelas..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter & Refresh */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">Semua Status</option>
              <option value="active">Hanya Aktif</option>
              <option value="inactive">Hanya Nonaktif</option>
            </select>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
              title="Segarkan Data Pengguna"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: 'Semua Pengguna', count: usersList.length },
            { id: 'superadmin', label: 'Superadmin', count: stats.superadmins },
            { id: 'admin', label: 'Admin', count: stats.admins },
            { id: 'pustakawan', label: 'Pustakawan', count: stats.librarians },
            { id: 'kepala_sekolah', label: 'Kepsek', count: usersList.filter((u) => u.role === 'kepala_sekolah').length },
            { id: 'guru', label: 'Guru', count: stats.teachers },
            { id: 'siswa', label: 'Siswa', count: stats.students }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  roleFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3">Pengguna & Akun</th>
                <th className="p-3">Email & Kontak</th>
                <th className="p-3">Hak Akses (Role)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Terakhir Login</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 space-y-2">
                    <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="font-semibold text-xs">Tidak ada pengguna yang cocok dengan filter atau pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.fullName || u.username)}`}
                            alt={u.fullName}
                            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                                {u.fullName || u.name || u.username}
                              </p>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[9px] rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>@{u.username}</span>
                              {u.memberInfo?.identityNumber && (
                                <span className="text-[10px] text-slate-400 font-sans">
                                  • NIS: {u.memberInfo.identityNumber}
                                </span>
                              )}
                              {u.memberInfo?.classGrade && (
                                <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[9px]">
                                  {u.memberInfo.classGrade}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        <p className="truncate max-w-[180px]">{u.email}</p>
                        {u.memberInfo?.phone && (
                          <p className="text-[10px] text-slate-400">{u.memberInfo.phone}</p>
                        )}
                      </td>

                      <td className="p-3">{getRoleBadge(u.role)}</td>

                      <td className="p-3">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={!isSuperadmin || isCurrent}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            u.isActive !== false
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-200'
                          } ${!isSuperadmin || isCurrent ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                          title={isSuperadmin && !isCurrent ? 'Klik untuk mengubah status' : ''}
                        >
                          {u.isActive !== false ? (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-rose-600" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-3 text-[11px] text-slate-500 font-mono">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString('id-ID') : '-'}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Button */}
                          {isSuperadmin && (
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                              title="Edit Detail Pengguna"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reset Password Button */}
                          {isSuperadmin && (
                            <button
                              onClick={() => handleOpenReset(u)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition-colors"
                              title="Reset Password Akun"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button */}
                          {isSuperadmin && !isCurrent && (
                            <button
                              onClick={() => handleOpenDelete(u)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                              title="Hapus Akun Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT USER MODAL                                                  */}
      {/* ========================================================================= */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Edit Pengguna: @{selectedUser.username}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Perbarui profil, hak akses, dan keterkaitan anggota
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Akun *
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hak Akses (Role) *
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="superadmin">Superadmin (Full Access)</option>
                    <option value="admin">Administrator</option>
                    <option value="pustakawan">Pustakawan / Staf Perpus</option>
                    <option value="kepala_sekolah">Kepala Sekolah (Eksekutif)</option>
                    <option value="guru">Dewan Guru</option>
                    <option value="siswa">Siswa Pemustaka</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status Akun *
                  </label>
                  <select
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                    disabled={selectedUser.id === currentUser?.id}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="true">Aktif (Dapat Login)</option>
                    <option value="false">Nonaktif (Diblokir)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tautkan dengan Data Anggota (Opsional)
                </label>
                <select
                  value={editForm.memberId}
                  onChange={(e) => setEditForm({ ...editForm, memberId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="">-- Tidak ditautkan ke profil anggota spesifik --</option>
                  {membersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.type} - NIS/NIP: {m.identityNumber} {m.classGrade ? `| ${m.classGrade}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESET PASSWORD MODAL                                             */}
      {/* ========================================================================= */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Reset Password Pengguna
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Akun: <strong className="text-slate-700 dark:text-slate-200">@{selectedUser.username}</strong> ({selectedUser.fullName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!resetResult ? (
              <form onSubmit={handleExecuteReset} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Format Password Baru:
                  </label>

                  {/* Option 1: NIS */}
                  {selectedUser.memberInfo?.identityNumber && (
                    <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <input
                        type="radio"
                        name="passwordType"
                        value="nis"
                        checked={resetForm.passwordType === 'nis'}
                        onChange={() => setResetForm({ ...resetForm, passwordType: 'nis' })}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Gunakan NIS / NIP Anggota
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Password baru: <strong>{selectedUser.memberInfo.identityNumber}</strong>
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Option 2: Default Role */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="radio"
                      name="passwordType"
                      value="default_role"
                      checked={resetForm.passwordType === 'default_role'}
                      onChange={() => setResetForm({ ...resetForm, passwordType: 'default_role' })}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Password Standar Role
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Password baru:{' '}
                        <strong>
                          {selectedUser.role === 'siswa'
                            ? 'siswa123'
                            : selectedUser.role === 'guru'
                            ? 'guru123'
                            : 'admin123'}
                        </strong>
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Random Generator */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="radio"
                      name="passwordType"
                      value="random"
                      checked={resetForm.passwordType === 'random'}
                      onChange={() => setResetForm({ ...resetForm, passwordType: 'random' })}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Generate Password Acak yang Aman
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Sistem akan menghasilkan kode unik acak (Contoh: WP-9K2L1M!)
                      </p>
                    </div>
                  </label>

                  {/* Option 4: Custom Password */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                    <input
                      type="radio"
                      name="passwordType"
                      value="custom"
                      checked={resetForm.passwordType === 'custom'}
                      onChange={() => setResetForm({ ...resetForm, passwordType: 'custom' })}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Tentukan Password Kustom
                      </p>
                      {resetForm.passwordType === 'custom' && (
                        <div className="relative mt-2">
                          <input
                            type={resetForm.showCustomPassword ? 'text' : 'password'}
                            value={resetForm.customPassword}
                            onChange={(e) =>
                              setResetForm({ ...resetForm, customPassword: e.target.value })
                            }
                            placeholder="Ketik password baru (min. 6 karakter)..."
                            className="w-full px-3 py-1.5 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setResetForm({
                                ...resetForm,
                                showCustomPassword: !resetForm.showCustomPassword
                              })
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                          >
                            {resetForm.showCustomPassword ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/20"
                  >
                    <Key className="w-4 h-4" />
                    Reset Password Sekarang
                  </button>
                </div>
              </form>
            ) : (
              /* Success Result View */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div>
                    <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300">
                      Password Berhasil Direset!
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Kredensial login baru untuk @{resetResult.username} siap dibagikan:
                    </p>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-left">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Password Baru</p>
                      <p className="text-sm font-mono font-black text-slate-900 dark:text-white">
                        {resetResult.newPassword}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(resetResult.newPassword, 'reset_pwd')}
                      className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-emerald-200"
                    >
                      {copiedId === 'reset_pwd' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Disalin
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Salin
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowResetModal(false);
                      setResetResult(null);
                    }}
                    className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE USER MODAL                                                */}
      {/* ========================================================================= */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Hapus Akun Pengguna?
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus akun{' '}
                <strong className="text-slate-900 dark:text-white">
                  {selectedUser.fullName || selectedUser.name}
                </strong>{' '}
                (@{selectedUser.username})?
              </p>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-[11px] text-rose-800 dark:text-rose-300">
              <p className="font-semibold">Perhatian:</p>
              <p>
                Pengguna tidak akan dapat login lagi ke sistem. Data riwayat peminjaman buku pemustaka terkait akan tetap dipertahankan.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Pengguna
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD SINGLE USER MODAL                                            */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Tambah Akun Pengguna Baru
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Buat akun staf, guru, atau pengguna khusus secara manual
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Contoh: Dra. Sri Wahyuni, M.Pd."
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    placeholder="Contoh: sri.wahyuni"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Akun *
                  </label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="Contoh: sri@sman3nganjuk.sch.id"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password Awal *
                  </label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hak Akses (Role) *
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="pustakawan">Pustakawan / Staf Perpus</option>
                    <option value="admin">Administrator</option>
                    <option value="superadmin">Superadmin (Full Access)</option>
                    <option value="kepala_sekolah">Kepala Sekolah (Eksekutif)</option>
                    <option value="guru">Dewan Guru</option>
                    <option value="siswa">Siswa Pemustaka</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Hubungkan dengan Profil Anggota (Opsional)
                </label>
                <select
                  value={addForm.memberId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    const selected = membersList.find((m) => m.id === mId);
                    setAddForm({
                      ...addForm,
                      memberId: mId,
                      name: selected && !addForm.name ? selected.name : addForm.name,
                      email: selected && !addForm.email && selected.email ? selected.email : addForm.email,
                      username: selected && !addForm.username ? selected.identityNumber : addForm.username
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="">-- Pilih dari anggota yang terdaftar di perpustakaan --</option>
                  {membersList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.type} - NIS/NIP: {m.identityNumber} {m.classGrade ? `| ${m.classGrade}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <UserPlus className="w-4 h-4" />
                  Buat Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: AUTO GENERATE USER FOR ALL STUDENTS                              */}
      {/* ========================================================================= */}
      {showAutoGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <Sparkles className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Pembuatan Akun User Otomatis Bagi Seluruh Siswa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Otomatisasi akun login OPAC dan Portal Pemustaka untuk seluruh siswa SMAN 3 Nganjuk
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Information Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-950 dark:text-emerald-200 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Total Siswa Terdaftar</p>
                <p className="text-lg font-black">{autoGenPreview.totalStudents} Siswa</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Belum Punya Akun Login</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400">{autoGenPreview.unregisteredCount} Siswa</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Sudah Memiliki Akun</p>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{autoGenPreview.registeredCount} Siswa</p>
              </div>
            </div>

            {/* Configuration Options */}
            <div className="space-y-4 pt-1">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Konfigurasi Kredensial Siswa
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username Format */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Format Username Siswa:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <input
                        type="radio"
                        name="usernameFormat"
                        value="nis"
                        checked={autoGenConfig.usernameFormat === 'nis'}
                        onChange={() => setAutoGenConfig({ ...autoGenConfig, usernameFormat: 'nis' })}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          NIS Murni (Contoh: <code>202410106</code>)
                        </p>
                        <p className="text-[10px] text-slate-400">Siswa login menggunakan nomor NIS.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <input
                        type="radio"
                        name="usernameFormat"
                        value="prefix_nis"
                        checked={autoGenConfig.usernameFormat === 'prefix_nis'}
                        onChange={() => setAutoGenConfig({ ...autoGenConfig, usernameFormat: 'prefix_nis' })}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Prefix: <code>siswa_[NIS]</code> (Contoh: <code>siswa_202410106</code>)
                        </p>
                        <p className="text-[10px] text-slate-400">Awalan kata siswa diikuti nomor NIS.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Default Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Format Password Default:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <input
                        type="radio"
                        name="genPasswordType"
                        value="nis"
                        checked={autoGenConfig.passwordType === 'nis'}
                        onChange={() => setAutoGenConfig({ ...autoGenConfig, passwordType: 'nis' })}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Sama dengan NIS Siswa
                        </p>
                        <p className="text-[10px] text-slate-400">Paling mudah diingat siswa.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <input
                        type="radio"
                        name="genPasswordType"
                        value="siswa123"
                        checked={autoGenConfig.passwordType === 'siswa123'}
                        onChange={() => setAutoGenConfig({ ...autoGenConfig, passwordType: 'siswa123' })}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Standar: <code>siswa123</code>
                        </p>
                        <p className="text-[10px] text-slate-400">Password seragam untuk seluruh siswa.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                      <input
                        type="radio"
                        name="genPasswordType"
                        value="custom"
                        checked={autoGenConfig.passwordType === 'custom'}
                        onChange={() => setAutoGenConfig({ ...autoGenConfig, passwordType: 'custom' })}
                      />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Password Kustom
                        </p>
                        {autoGenConfig.passwordType === 'custom' && (
                          <input
                            type="text"
                            value={autoGenConfig.customPassword}
                            onChange={(e) =>
                              setAutoGenConfig({ ...autoGenConfig, customPassword: e.target.value })
                            }
                            placeholder="Ketik password bersama (min. 6 karakter)..."
                            className="w-full mt-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Overwrite Checkbox */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenConfig.overwriteExisting}
                    onChange={(e) => setAutoGenConfig({ ...autoGenConfig, overwriteExisting: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>
                    Timpa & Reset Password untuk akun siswa yang sudah ada sebelumnya
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 ml-5 mt-0.5">
                  Jika tidak dicentang, sistem hanya akan membuat akun bagi siswa yang belum memiliki user login.
                </p>
              </div>

              {/* Preview Table of Students to be generated */}
              {autoGenPreview.unregisteredStudents.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pratinjau Siswa yang Akan Dibuatkan Akun ({autoGenPreview.unregisteredStudents.length} Siswa):
                  </p>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 font-bold text-[11px] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-2">Nama Siswa</th>
                          <th className="p-2">NIS</th>
                          <th className="p-2">Kelas</th>
                          <th className="p-2">Username Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                        {autoGenPreview.unregisteredStudents.slice(0, 10).map((s, i) => (
                          <tr key={i}>
                            <td className="p-2 font-sans font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                              {s.name}
                            </td>
                            <td className="p-2">{s.identityNumber}</td>
                            <td className="p-2 font-sans">{s.classGrade || '-'}</td>
                            <td className="p-2 text-teal-700 dark:text-teal-400 font-bold">
                              @{autoGenConfig.usernameFormat === 'prefix_nis' ? `siswa_${s.identityNumber}` : s.identityNumber}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {autoGenPreview.unregisteredStudents.length > 10 && (
                    <p className="text-[10px] text-slate-400 text-right">
                      ...dan {autoGenPreview.unregisteredStudents.length - 10} siswa lainnya
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAutoGenerateModal(false)}
                disabled={generating}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteAutoGenerate}
                disabled={generating}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                {generating ? 'Sedang Memproses Akun Siswa...' : `Mulai Pembuatan Akun Siswa`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: GENERATION RESULT RECAP & EXCEL EXPORT                           */}
      {/* ========================================================================= */}
      {showResultModal && generationResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Rekap Hasil Pembuatan Akun Siswa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seluruh akun siswa telah tersimpan dan siap digunakan untuk login
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Counters */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-center">
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Akun Baru Dibuat</p>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                  {generationResults.stats.createdCount}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-center">
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Password Direset</p>
                <p className="text-xl font-black text-blue-700 dark:text-blue-300">
                  {generationResults.stats.updatedCount}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Dilewati (Sudah Ada)</p>
                <p className="text-xl font-black text-slate-600 dark:text-slate-400">
                  {generationResults.stats.skippedCount}
                </p>
              </div>
            </div>

            {/* Generated Accounts Table */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Daftar Akun Siswa ({generationResults.generatedList.length}):
                </p>
                <span className="text-[10px] text-slate-400">
                  Unduh tabel untuk dibagikan kepada wali kelas / siswa
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 font-bold text-[11px] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2">Nama Siswa</th>
                      <th className="p-2">NIS / Kelas</th>
                      <th className="p-2">Username Login</th>
                      <th className="p-2">Password Default</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {generationResults.generatedList.map((acc, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-2 font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                          {acc.fullName}
                        </td>
                        <td className="p-2 font-mono text-slate-600 dark:text-slate-400">
                          {acc.nis} {acc.classGrade ? `(${acc.classGrade})` : ''}
                        </td>
                        <td className="p-2 font-mono font-bold text-teal-700 dark:text-teal-400">
                          @{acc.username}
                        </td>
                        <td className="p-2 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {acc.plainPassword}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              acc.status === 'created'
                                ? 'bg-emerald-100 text-emerald-700'
                                : acc.status === 'updated'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {acc.status === 'created' ? 'Baru' : acc.status === 'updated' ? 'Reset' : 'Ada'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Export & Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <ExportDropdown
                data={generationResults.generatedList}
                columns={LOCALIZED_COLUMNS.studentAccounts}
                filenamePrefix="rekap_akun_siswa_login_perpustakaan"
                sheetName="Akun Siswa Login"
                title="Daftar Akun & Kredensial Login Siswa Perpustakaan SMAN 3 Nganjuk"
                subtitle="Widya Pustaka Library System"
                label="Unduh Rekap Akun Siswa (Excel/CSV)"
              />

              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
