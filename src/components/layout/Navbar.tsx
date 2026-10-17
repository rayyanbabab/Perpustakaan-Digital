import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  Sparkles,
  Barcode,
  Menu,
  ChevronDown,
  ExternalLink
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
  const { user, settings, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');

  const getRouteLabel = (route: string) => {
    switch (route) {
      case 'dashboard':
        return 'Dashboard Stats';
      case 'opac':
        return 'OPAC Katalog';
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
        return 'Import & Export Buku (Excel)';
      case 'members-list':
        return 'Data Siswa & Guru';
      case 'members-import':
        return 'Import & Export Anggota (Excel)';
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
        return 'bg-blue-50 text-[#1E3A8A] border-blue-200';
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
        return 'Guru';
      case 'siswa':
        return 'Siswa';
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

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs select-none">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <span className="hidden sm:inline-block font-semibold text-slate-600">
            {user ? getRoleLabel(user.role) : 'Guest'}
          </span>
          <span className="hidden sm:inline-block text-slate-300">/</span>
          <span className="text-[#1E3A8A] font-bold uppercase tracking-tight">
            {getRouteLabel(currentRoute)}
          </span>
        </div>
      </div>

      {/* Center/Right: Quick Search Barcode & Actions */}
      <div className="flex items-center space-x-3">
        {/* Quick Barcode Scanner Input */}
        <form onSubmit={handleBarcodeSubmit} className="relative hidden md:block">
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Scan Barcode / Cari..."
            className="bg-[#F1F5F9] border border-slate-200 rounded-full pl-8 pr-4 py-1.5 text-xs w-48 lg:w-56 focus:w-64 focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          <Barcode className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
        </form>

        {/* Quick Navigation Action Buttons */}
        <button
          onClick={() => onNavigate('opac')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            currentRoute === 'opac'
              ? 'bg-[#1E3A8A] text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
          }`}
          title="Buka Katalog OPAC Publik"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Katalog OPAC</span>
        </button>

        {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
          <button
            onClick={() => onNavigate('circulation-quick')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentRoute === 'circulation-quick'
                ? 'bg-[#D4AF37] text-[#1E3A8A] font-bold shadow-xs'
                : 'bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Sirkulasi Cepat</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors relative"
            title="Notifikasi Sistem"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs">
              <div className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex justify-between items-center">
                <span>Notifikasi Perpustakaan</span>
                <span className="text-[10px] text-[#1E3A8A] font-semibold cursor-pointer hover:underline">
                  Tandai Dibaca
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                <div className="py-2.5">
                  <p className="font-semibold text-slate-800">Status Server OPAC</p>
                  <p className="text-slate-500 text-[11px]">
                    Sistem sirkulasi dan katalog beroperasi normal dalam jaringan sekolah.
                  </p>
                  <span className="text-[10px] text-slate-400">Aktif</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1E3A8A] border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user.name || 'AD').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-800 max-w-[120px] truncate leading-tight">
                  {user.name}
                </div>
                <span className={`inline-block text-[9px] font-bold px-1 py-0.2 rounded border ${getRoleBadgeColor(user.role)} leading-none`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 text-xs">
                <div className="p-2.5 border-b border-slate-100">
                  <p className="font-bold text-slate-900 text-xs">{user.name}</p>
                  <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                  <div className="mt-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                    Profil & Akun Saya
                  </button>

                  {['superadmin', 'admin', 'pustakawan'].includes(user.role) && (
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 font-medium"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      Pengaturan Sistem
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar dari Sistem
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => onNavigate('login')}
            className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            Masuk Petugas
          </button>
        )}
      </div>
    </header>
  );
};
