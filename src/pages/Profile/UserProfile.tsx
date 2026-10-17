import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ActivityLog } from '../../types';
import {
  User,
  Shield,
  KeyRound,
  History,
  Mail,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  RefreshCw,
  Search,
  Filter,
  Check,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ExportDropdown } from '../../components/common/ExportDropdown';
import { LOCALIZED_COLUMNS } from '../../services/exportService';

const AVATAR_PRESETS = [
  { id: '1', label: 'Pustakawan Pria', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: '2', label: 'Pustakawan Wanita', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { id: '3', label: 'Guru Pria', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: '4', label: 'Guru Wanita', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { id: '5', label: 'Siswa Cerdas', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { id: '6', label: 'Admin Simpel', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' }
];

export const UserProfile: React.FC = () => {
  const { user, settings, refreshUserData } = useAuth();
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'logs' | 'permissions'>('profile');

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Personal Logs State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logModuleFilter, setLogModuleFilter] = useState('all');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const fetchPersonalLogs = async () => {
    setLogsLoading(true);
    try {
      const url = new URL('/api/auth/my-logs', window.location.origin);
      if (logModuleFilter !== 'all') url.searchParams.append('module', logModuleFilter);
      if (logSearch) url.searchParams.append('q', logSearch);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (e) {
      console.error('Failed to fetch personal logs:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchPersonalLogs();
    }
  }, [activeTab, logModuleFilter, logSearch]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      error('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      error('Format alamat email tidak valid.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          fullName,
          name: fullName,
          email,
          avatarUrl
        })
      });

      const json = await res.json();
      if (res.ok) {
        success('Profil akun berhasil diperbarui!');
        await refreshUserData();
      } else {
        error(json.error || 'Gagal memperbarui profil.');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      error('Semua kolom password wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      error('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Konfirmasi password baru tidak cocok.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        })
      });

      const json = await res.json();
      if (res.ok) {
        success('Password akun berhasil diperbarui! Silakan gunakan password baru pada login berikutnya.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        error(json.error || 'Gagal mengubah password.');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Administrator';
      case 'admin':
        return 'Admin Perpustakaan';
      case 'pustakawan':
        return 'Pustakawan (Librarian)';
      case 'kepala_sekolah':
        return 'Kepala Sekolah';
      case 'guru':
        return 'Guru / Pendidik';
      case 'siswa':
        return 'Siswa';
      default:
        return 'Pengguna Terdaftar';
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'admin':
        return 'bg-blue-100 dark:bg-blue-950/60 text-[#1E3A8A] dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'pustakawan':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'kepala_sekolah':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
      case 'guru':
        return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Kosong', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, text: 'Lemah', color: 'bg-rose-500' };
    if (score <= 3) return { score, text: 'Sedang', color: 'bg-amber-500' };
    return { score, text: 'Kuat & Aman', color: 'bg-emerald-500' };
  };

  const passStrength = getPasswordStrength(newPassword);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-[#1e293b] to-[#0f172a] text-white p-6 sm:p-8 shadow-lg overflow-hidden border border-blue-900/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar with Glow */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/10 p-1 border-2 border-amber-400 shadow-xl overflow-hidden backdrop-blur-xs flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="text-3xl font-black text-amber-400 tracking-tighter">
                  {(fullName || 'U').substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-[#1E3A8A]" title="Akun Aktif">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{fullName || user?.username}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadgeStyle(user?.role)}`}>
                {getRoleLabel(user?.role)}
              </span>
            </div>

            <p className="text-xs text-blue-200/90 flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <span className="font-mono">@{user?.username}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-300" />
                {user?.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Login Terakhir: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('id-ID') : 'Sesi Ini'}
              </span>
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-blue-100 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Unit: <strong>{settings?.schoolName || 'Politeknik Astra'}</strong></span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-blue-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Sistem: <strong>Astra Library v2.4</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'profile'
              ? 'bg-[#1E3A8A] text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Informasi Akun & Profil</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'security'
              ? 'bg-[#1E3A8A] text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Keamanan & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'logs'
              ? 'bg-[#1E3A8A] text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Log Aktivitas Pribadi</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'permissions'
              ? 'bg-[#1E3A8A] text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Matriks Hak Akses Peran</span>
        </button>
      </div>

      {/* TAB 1: Edit Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Perbarui Informasi Profil
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ubah nama lengkap, alamat email kontak, dan avatar personal akun Anda.
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Lengkap Pengguna *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Contoh: Muhammad Rizky Pratama, S.Pd."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Username Akun (Permanen)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.username || ''}
                    className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400">Username digunakan untuk autentikasi masuk.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Alamat Email Kontak *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nama@sman3nganjuk.sch.id"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  URL Foto Profil / Avatar
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Preset Avatar Gallery */}
              <div className="space-y-2 pt-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Atau Pilih Avatar Cepat Pustaka:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      className={`group relative rounded-xl p-1 border-2 transition-all overflow-hidden flex flex-col items-center ${
                        avatarUrl === preset.url
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-12 h-12 rounded-lg object-cover" />
                      <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300 mt-1 truncate max-w-full">
                        {preset.label}
                      </span>
                      {avatarUrl === preset.url && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-xs">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-900/20 disabled:opacity-50"
                >
                  {isUpdatingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Simpan Perubahan Profil
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Meta Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                Informasi Hak Akses
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Role Sistem:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                    {getRoleLabel(user?.role)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Status Keaktifan:</span>
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Akun Aktif & Terverifikasi
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">ID Sistem:</span>
                  <div className="font-mono text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg mt-0.5">
                    {user?.id}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4" />
                Catatan Keamanan
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/80 dark:text-amber-300/80">
                Jaga kerahasiaan kredensial akun Anda. Setiap tindakan peminjaman, entri katalog, dan denda tercatat dalam log audit digital.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Change Password */}
      {activeTab === 'security' && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Ganti Kata Sandi (Password)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Perbarui kata sandi Anda secara berkala untuk menjaga integritas keamanan basis data perpustakaan.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Old Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Kata Sandi Lama *
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="Masukkan password lama Anda"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Kata Sandi Baru * (Minimal 6 Karakter)
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Masukkan password baru"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Bar */}
              {newPassword && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Kekuatan Sandi:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{passStrength.text}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full ${passStrength.color} transition-all`} style={{ width: `${(passStrength.score / 5) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Konfirmasi Kata Sandi Baru *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ulangi password baru"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {isChangingPass ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengubah Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Perbarui Password Sekarang
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Personal Activity Logs with Export to CSV & Excel */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Cari dalam log aktivitas..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <select
                value={logModuleFilter}
                onChange={(e) => setLogModuleFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="all">Semua Modul</option>
                <option value="AUTH">Autentikasi (AUTH)</option>
                <option value="CIRCULATION">Sirkulasi (CIRCULATION)</option>
                <option value="CATALOG">Katalog Buku (CATALOG)</option>
                <option value="MEMBERS">Anggota (MEMBERS)</option>
                <option value="SETTINGS">Pengaturan (SETTINGS)</option>
                <option value="STOCK_OPNAME">Stock Opname</option>
              </select>

              <button
                onClick={fetchPersonalLogs}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs"
                title="Muat Ulang Log"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Export Dropdown Service */}
            <ExportDropdown
              data={logs}
              columns={LOCALIZED_COLUMNS.activityLogs}
              filenamePrefix={`log_aktivitas_${user?.username}`}
              sheetName="Log Aktivitas Pengguna"
              title={`Riwayat Log Aktivitas Pengguna: ${user?.fullName || user?.username}`}
              subtitle={`Dicetak dari Astra Library Politeknik Astra - Total: ${logs.length} data`}
              label="Ekspor Log"
            />
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            {logsLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Memuat riwayat log aktivitas...</div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">Belum ada catatan log aktivitas.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Waktu Aktivitas</th>
                      <th className="p-3.5">Modul</th>
                      <th className="p-3.5">Aksi</th>
                      <th className="p-3.5">Deskripsi Aktivitas</th>
                      <th className="p-3.5 text-right">Alamat IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px] uppercase">
                            {log.module}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                              log.action === 'LOGIN'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : log.action === 'DELETE'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : log.action === 'CREATE'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-800 dark:text-slate-200 font-medium">
                          {log.description}
                        </td>
                        <td className="p-3.5 text-right font-mono text-[11px] text-slate-400">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Permissions Matrix */}
      {activeTab === 'permissions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Matriks Hak Akses & Privilege Role: {getRoleLabel(user?.role)}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Daftar modul dan operasi sistem yang diizinkan untuk peran akun Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                module: 'Katalog & Bibliografi',
                desc: 'Tambah, ubah data buku, cetak barcode & nomor panggil',
                allowed: ['superadmin', 'admin', 'pustakawan'].includes(user?.role || '')
              },
              {
                module: 'Sirkulasi Peminjaman & Scan',
                desc: 'Transaksi pinjam, perpanjangan, pengembalian buku',
                allowed: ['superadmin', 'admin', 'pustakawan'].includes(user?.role || '')
              },
              {
                module: 'Kas Denda & Pembayaran',
                desc: 'Penerimaan denda keterlambatan dan kerusakan buku',
                allowed: ['superadmin', 'admin', 'pustakawan'].includes(user?.role || '')
              },
              {
                module: 'Data Siswa & Kartu Anggota',
                desc: 'Kelola direktori siswa/guru & cetak kartu PVC barcode',
                allowed: ['superadmin', 'admin', 'pustakawan'].includes(user?.role || '')
              },
              {
                module: 'Laporan Resmi & Akreditasi',
                desc: 'Cetak laporan KOP surat resmi & rekapitulasi',
                allowed: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah'].includes(user?.role || '')
              },
              {
                module: 'Pengaturan Sistem & Database',
                desc: 'Konfigurasi sekolah, backup JSON, & manajemen user',
                allowed: ['superadmin', 'admin'].includes(user?.role || '')
              }
            ].map((perm, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  perm.allowed
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{perm.module}</span>
                  {perm.allowed ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                      Diizinkan
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold text-[10px]">
                      Terkunci
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{perm.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
