import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookOpen, Lock, User, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

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
      success('Selamat datang di Widya Pustaka SMA Negeri 3 Nganjuk');
      if (onSuccess) onSuccess();
    } else {
      error(result.error || 'Login gagal');
    }
  };

  const handleQuickDemo = async (role: string) => {
    setLoading(true);
    const result = await demoLogin(role);
    setLoading(false);

    if (result.success) {
      success(`Berhasil login sebagai ${role.toUpperCase()}`);
      if (onSuccess) onSuccess();
    } else {
      error(result.error || 'Demo login gagal');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F5F7FA] dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* School Crest & System Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-slate-900 text-amber-400 shadow-xl border border-amber-400/40 mb-1">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            {settings?.shortName || 'WIDYA PUSTAKA'}
          </h1>
          <div className="text-xs font-bold tracking-wider text-blue-700 dark:text-blue-400 uppercase">
            LIBRARY SYSTEM
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {settings?.schoolName || 'SMA NEGERI 3 NGANJUK'}
          </p>
          <p className="text-[11px] text-slate-500 italic">
            "{settings?.tagline || 'Membaca, Mengelola, Menginspirasi'}"
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Masuk ke Sistem Perpustakaan
            </h2>
            <p className="text-xs text-slate-500">
              Gunakan akun petugas, guru, atau siswa Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Username / Email / NIS / NIP
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: pustakawan / admin"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                  Lupa Password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Public OPAC link */}
          {onOpenOpac && (
            <div className="text-center">
              <button
                onClick={onOpenOpac}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline"
              >
                Cari Buku di Katalog Publik (OPAC) tanpa login →
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="text-center pb-4 text-[10px] text-slate-500">
        Widya Pustaka Library System | SMA Negeri 3 Nganjuk | Satu Hati 3 Beraksi Meraih Prestasi | damunSetiadji 2026
      </div>
    </div>
  );
};
