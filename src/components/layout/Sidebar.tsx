import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  BookCopy,
  Barcode,
  Users,
  CreditCard,
  ArrowLeftRight,
  RotateCcw,
  Clock,
  DollarSign,
  ClipboardCheck,
  Newspaper,
  Database,
  BarChart3,
  UserCog,
  Settings,
  Activity,
  HardDrive,
  FileSpreadsheet,
  BookmarkCheck,
  GraduationCap,
  UserCheck,
  X,
  BookOpen,
  User,
  Library
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  badge?: string;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isOpenMobile,
  onCloseMobile
}) => {
  const { user } = useAuth();
  const role = user?.role || 'siswa';

  const isAllowed = (roles: string[]) => {
    return roles.includes(role) || role === 'superadmin';
  };

  const navSections: NavSection[] = [
    {
      title: 'Menu Utama',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah']
        },
        {
          id: 'opac',
          label: role === 'siswa' ? 'Katalog Buku & Booking' : 'Katalog OPAC',
          icon: Search,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa'],
          badge: 'Online'
        },
        {
          id: 'visitors',
          label: 'Buku Tamu Digital',
          icon: UserCheck,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah']
        }
      ]
    },
    {
      title: role === 'siswa' ? 'Layanan Siswa / Mahasiswa' : 'Sirkulasi & Layanan',
      items: [
        {
          id: 'circulation-quick',
          label: 'Sirkulasi Cepat (Scan)',
          icon: Barcode,
          roles: ['superadmin', 'admin', 'pustakawan'],
          highlight: true
        },
        {
          id: 'circulation-reservations',
          label: role === 'siswa' ? 'Antrean Reservasi Saya' : 'Antrean Reservasi',
          icon: BookmarkCheck,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa'],
          badge: role === 'siswa' ? 'Booking' : undefined
        },
        {
          id: 'circulation-active',
          label: role === 'siswa' ? 'Peminjaman Aktif Saya' : 'Peminjaman Aktif',
          icon: ArrowLeftRight,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'siswa']
        },
        {
          id: 'circulation-history',
          label: role === 'siswa' ? 'Riwayat Peminjaman' : 'Riwayat Transaksi',
          icon: RotateCcw,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa']
        },
        {
          id: 'circulation-fines',
          label: role === 'siswa' ? 'Informasi Denda' : 'Denda & Pembayaran',
          icon: DollarSign,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa']
        }
      ]
    },
    {
      title: 'Manajemen Koleksi',
      items: [
        {
          id: 'books-list',
          label: 'Katalog Bibliografi',
          icon: BookCopy,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah']
        },
        {
          id: 'books-digital',
          label: 'Koleksi Digital / E-Book',
          icon: HardDrive,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa']
        },
        {
          id: 'books-import',
          label: 'Import / Export Buku',
          icon: FileSpreadsheet,
          roles: ['superadmin', 'admin', 'pustakawan']
        }
      ]
    },
    {
      title: 'Keanggotaan',
      items: [
        {
          id: 'members-list',
          label: 'Data Siswa & Guru',
          icon: Users,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah']
        },
        {
          id: 'members-import',
          label: 'Import / Export Anggota',
          icon: GraduationCap,
          roles: ['superadmin', 'admin', 'pustakawan']
        }
      ]
    },
    {
      title: 'Audit & Sistem',
      items: [
        {
          id: 'stock-opname',
          label: 'Stock Opname Fisik',
          icon: ClipboardCheck,
          roles: ['superadmin', 'admin', 'pustakawan']
        },
        {
          id: 'reports',
          label: 'Laporan & Akreditasi',
          icon: BarChart3,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah']
        },
        {
          id: 'settings',
          label: 'Pengaturan & Backup',
          icon: Settings,
          roles: ['superadmin', 'admin', 'pustakawan']
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-30 w-64 bg-[#0B1120] text-slate-300 flex flex-col h-full shrink-0 select-none overflow-hidden transition-transform duration-200 ease-in-out border-r border-slate-800/80 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-slate-800/80 bg-[#0E1527] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Library className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm leading-tight tracking-tight">
                ASTRA LIBRARY
              </h1>
              <p className="text-slate-400 text-[10px] font-medium tracking-wider uppercase">
                POLITEKNIK ASTRA
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5 custom-scrollbar">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => isAllowed(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentRoute === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Compact User Info Footer */}
        {user && (
          <div
            onClick={() => onNavigate('profile')}
            className="p-3 bg-[#0E1527] hover:bg-[#131C35] border-t border-slate-800/80 shrink-0 cursor-pointer transition-colors"
            title="Buka Profil Akun Saya"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-white shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user.name || 'AL').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider">
                    {user.role === 'superadmin'
                      ? 'Super Admin'
                      : user.role === 'admin'
                        ? 'Admin Perpus'
                        : user.role === 'pustakawan'
                          ? 'Pustakawan'
                          : user.role === 'kepala_sekolah'
                            ? 'Kepala Sekolah'
                            : user.role === 'guru'
                              ? 'Dosen / Guru'
                              : 'Mahasiswa / Siswa'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
