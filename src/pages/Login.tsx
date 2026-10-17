import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  BookOpen,
  Lock,
  User,
  Eye,
  EyeOff,
  Compass,
  ShieldCheck,
  ArrowRight,
  Database,
  Building2,
  Library,
  KeyRound,
  CheckCircle2,
  GraduationCap
} from 'lucide-react';

interface LoginProps {
  onSuccess?: () => void;
  onOpenOpac?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onOpenOpac }) => {
  const { login, demoLogin, settings } = useAuth();
  const { success, error } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      error('Silakan isi username dan password.');
      return;
    }
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      success(`Selamat datang di ${settings?.shortName || 'Astra Library'} ${settings?.schoolName || 'Politeknik Astra'}`);
      if (onSuccess) onSuccess();
    } else {
      error(result.error || 'Login gagal. Periksa kembali username dan password Anda.');
    }
  };

  const handleQuickDemo = async (role: string, userVal?: string, passVal?: string) => {
    if (userVal && passVal) {
      setUsername(userVal);
      setPassword(passVal);
    }
    setLoading(true);
    const result = await demoLogin(role);
    setLoading(false);

    if (result.success) {
      success(`Berhasil masuk sebagai ${role.toUpperCase()}`);
      if (onSuccess) onSuccess();
    } else {
      error(result.error || 'Demo login gagal');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] text-slate-100 p-4 sm:p-6 lg:p-10 relative select-none">
      {/* Main Container */}
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 my-auto">
        {/* Left Side: Brand Hero & Institution Identity */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-medium text-slate-300 tracking-wide uppercase">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{settings?.schoolName || 'POLITEKNIK ASTRA'}</span>
          </div>

          {/* Logo & Main Title */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-xs mb-1">
              <Library className="w-6 h-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              {settings?.shortName || 'ASTRA LIBRARY'}
            </h1>
            <p className="text-sm font-normal text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Sistem Informasi Manajemen Perpustakaan Terpadu & Portal Akademik Vokasi Modern
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-2.5 pt-2 max-w-md mx-auto lg:mx-0">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-left">
              <div className="p-2 rounded-xl bg-slate-700/60 text-blue-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Katalog Bibliografi & Sirkulasi Real-time</p>
                <p className="text-[11px] text-slate-400">Peminjaman, barcode barcode scan, dan denda terotomatisasi</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-left">
              <div className="p-2 rounded-xl bg-slate-700/60 text-blue-400 shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Kurasi & Penelusuran Koleksi Cerdas</p>
                <p className="text-[11px] text-slate-400">Rekomendasi buku dan literatur akademik berbasis minat</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-left">
              <div className="p-2 rounded-xl bg-slate-700/60 text-emerald-400 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Cloud Database PostgreSQL</p>
                <p className="text-[11px] text-slate-400">Penyimpanan aman, cepat, dan tersinkronisasi 24/7</p>
              </div>
            </div>
          </div>

          {/* Tagline / Address Footer */}
          <div className="text-[11px] text-slate-400 font-normal pt-2">
            📍 {settings?.address || 'Kawasan Industri Delta Silicon II, Cikarang, Jawa Barat'}
          </div>
        </div>

        {/* Right Side: Clean Login Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Portal Otentikasi Petugas</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Masuk ke Aplikasi
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan kredensial akun Anda untuk mengakses sistem
              </p>
            </div>

            {/* Quick Demo Switcher Pills */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  Akses Cepat Demo
                </span>
                <span className="text-[10px] text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-full font-medium">
                  1-Klik Masuk
                </span>
              </div>

              {/* Featured: Siswa / Mahasiswa Demo Button */}
              <button
                type="button"
                onClick={() => handleQuickDemo('siswa', 'siswa', 'siswa123')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all text-left flex items-center justify-between shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-blue-600 text-white">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block leading-tight">Akun Siswa / Mahasiswa</span>
                    <span className="text-[10px] font-normal text-slate-500">Lihat Buku & Booking Online</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
                  siswa123
                </span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin', 'admin', 'admin123')}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-medium transition-all text-left flex items-center justify-between"
                >
                  <span>Admin</span>
                  <span className="text-[10px] text-slate-400">Katalog</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('pustakawan', 'pustakawan', 'widya123')}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-medium transition-all text-left flex items-center justify-between"
                >
                  <span>Pustakawan</span>
                  <span className="text-[10px] text-slate-400">Sirkulasi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('superadmin', 'superadmin', 'wplsadmin')}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-medium transition-all text-left flex items-center justify-between"
                >
                  <span>Superadmin</span>
                  <span className="text-[10px] text-slate-400">Full</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('kepala_sekolah', 'kepsek', 'kswidya')}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-medium transition-all text-left flex items-center justify-between"
                >
                  <span>Kepala Unit</span>
                  <span className="text-[10px] text-slate-400">Laporan</span>
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Username / ID Pengguna
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username (contoh: siswa / admin)"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </div>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Public OPAC link */}
            {onOpenOpac && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={onOpenOpac}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Cari Buku di Katalog Publik (OPAC)</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Compact Footer */}
      <footer className="absolute bottom-3 inset-x-0 text-center text-[10px] text-slate-400 font-medium">
        {settings?.libraryName || 'Astra Library System'} • {settings?.schoolName || 'Politeknik Astra'} • Satu Hati Meraih Prestasi
      </footer>
    </div>
  );
};
