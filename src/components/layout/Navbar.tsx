import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  Building2,
  Barcode,
  Menu,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  Database,
  Library
} from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onToggleSidebar?: () => void;
  onOpenQuickScan?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  onToggleSidebar,
  onOpenQuickScan
}) => {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');

  const getRouteLabel = (route: string) => {
    switch (route) {
      case 'dashboard':
        return 'Dashboard & Statistik';
      case 'opac':
        return 'Katalog OPAC Publik';
      case 'visitors':
        return 'Buku Tamu Digital';
      case 'circulation-quick':
        return 'Sirkulasi Cepat (Scan)';
      case 'circulation-active':
        return 'Peminjaman Aktif';
      case 'circulation-history':
        return 'Riwayat Transaksi';
      case 'circulation-fines':
        return 'Denda & Kas Pembayaran';
      case 'circulation-reservations':
        return 'Antrean Reservasi';
      case 'books-list':
        return 'Katalog Bibliografi';
      case 'books-import':
        return 'Import / Export Buku';
      case 'books-digital':
        return 'Koleksi Digital';
      case 'members-list':
        return 'Data Siswa & Guru';
      case 'members-import':
        return 'Import / Export Anggota';
      case 'stock-opname':
        return 'Stock Opname Fisik';
      case 'reports':
        return 'Laporan & Akreditasi';
      case 'settings':
        return 'Pengaturan & Backup';
      case 'profile':
        return 'Profil Pengguna';
      default:
        return 'Library Terminal';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'pustakawan':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'kepala_sekolah':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'guru':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'siswa':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'admin':
        return 'Admin Perpus';
      case 'pustakawan':
        return 'Pustakawan';
      case 'kepala_sekolah':
        return 'Kepala Sekolah';
      case 'guru':
        return 'Dosen / Guru';
      case 'siswa':
        return 'Mahasiswa / Siswa';
      default:
        return 'Pengguna';
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    if (currentRoute !== 'circulation-quick') {
      onNavigate('circulation-quick');
    }
    setBarcodeInput('');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-dropdown-container')) {
        setShowUserDropdown(false);
      }
      if (!target.closest('#notif-dropdown-container')) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between z-20 shadow-xs select-none">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-2 text-xs">
          <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-900 font-bold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            <span>ASTRA LIBRARY</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-400 font-medium text-xs">
            <span className="text-slate-500">Perpustakaan</span>
            <span className="text-slate-300">/</span>
          </div>
          <span className="text-slate-900 font-bold tracking-tight text-xs sm:text-sm">
            {getRouteLabel(currentRoute)}
          </span>
        </div>
      </div>

      {/* Right: Quick Search, Actions, Notifications & User */}
      <div className="flex items-center space-x-2.5">
        {/* Quick Barcode Scanner Input */}
        <form onSubmit={handleBarcodeSubmit} className="relative hidden md:block">
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan Barcode / Tekan Enter..."
            className="bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/90 rounded-full pl-8 pr-4 py-1.5 text-xs w-48 lg:w-56 focus:w-64 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          <Barcode className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
        </form>

        {/* Quick Navigation Action Buttons */}
        <button
          onClick={() => onNavigate('opac')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
            currentRoute === 'opac'
              ? 'bg-slate-900 text-white shadow-xs font-semibold'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
          title="Buka Katalog OPAC Publik"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Katalog OPAC</span>
        </button>

        {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
          <button
            onClick={() => onNavigate('circulation-quick')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              currentRoute === 'circulation-quick'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 border border-blue-200/60'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Sirkulasi Cepat</span>
          </button>
        )}

        {/* Notification Bell */}
        <div id="notif-dropdown-container" className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors relative"
            title="Notifikasi Sistem"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 z-50 text-xs">
              <div className="font-bold text-slate-900 pb-2.5 border-b border-slate-100 flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-600" />
                  <span>Notifikasi Astra Library</span>
                </span>
                <span
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline"
                >
                  Tutup
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pt-1">
                <div className="py-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Neon PostgreSQL Cloud Aktif</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Koneksi database sinkron otomatis dengan pooler cloud Neon (ap-southeast-1).
                  </p>
                </div>
                <div className="py-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                    <Library className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sistem Perpustakaan Politeknik Astra</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Sistem otomasi perpustakaan beroperasi normal untuk seluruh civitas akademika.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Dropdown */}
        {user ? (
          <div id="user-dropdown-container" className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden border border-slate-200">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user.name || 'AL').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-800 max-w-[130px] truncate leading-tight">
                  {user.name}
                </div>
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${getRoleBadgeColor(user.role)} leading-none`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-2 z-50 text-xs">
                <div className="p-3 border-b border-slate-100">
                  <p className="font-bold text-slate-900 text-xs">{user.name}</p>
                  <p className="text-slate-500 text-[11px] truncate">{user.email || 'petugas@polytechnic.astra.ac.id'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Politeknik Astra</span>
                  </div>
                </div>

                <div className="py-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span>Profil & Akun Saya</span>
                  </button>

                  {['superadmin', 'admin', 'pustakawan'].includes(user.role) && (
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2.5 font-medium transition-colors"
                    >
                      <Shield className="w-4 h-4 text-slate-500" />
                      <span>Pengaturan Sistem</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1.5">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Sistem</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => onNavigate('login')}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Masuk Petugas
          </button>
        )}
      </div>
    </header>
  );
};
