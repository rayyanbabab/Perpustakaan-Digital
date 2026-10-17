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
  Sparkles,
  UserCheck,
  X,
  BookOpen,
  User
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
      title: 'Main Terminal',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah']
        },
        {
          id: 'opac',
          label: 'OPAC Katalog',
          icon: Search,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa'],
          badge: 'Online'
        },
        {
          id: 'visitors',
          label: 'Buku Tamu Digital',
          icon: UserCheck,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa']
        }
      ]
    },
    {
      title: 'Circulation Desk',
      items: [
        {
          id: 'circulation-quick',
          label: 'Sirkulasi Cepat (Scan)',
          icon: Barcode,
          roles: ['superadmin', 'admin', 'pustakawan'],
          highlight: true
        },
        {
          id: 'circulation-active',
          label: 'Peminjaman Aktif',
          icon: ArrowLeftRight,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah']
        },
        {
          id: 'circulation-history',
          label: 'Riwayat Transaksi',
          icon: RotateCcw,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa']
        },
        {
          id: 'circulation-fines',
          label: 'Denda & Kas Pembayaran',
          icon: DollarSign,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa']
        },
        {
          id: 'circulation-reservations',
          label: 'Antrean Reservasi',
          icon: BookmarkCheck,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa']
        }
      ]
    },
    {
      title: 'Resource Center',
      items: [
        {
          id: 'books-list',
          label: 'Katalog Bibliografi',
          icon: BookCopy,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah']
        },
        {
          id: 'books-digital',
          label: 'Koleksi Digital',
          icon: HardDrive,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa']
        },
        {
          id: 'books-import',
          label: 'Import / Export Buku (Excel)',
          icon: FileSpreadsheet,
          roles: ['superadmin', 'admin', 'pustakawan']
        }
      ]
    },
    {
      title: 'Membership Hub',
      items: [
        {
          id: 'members-list',
          label: 'Data Siswa & Guru',
          icon: Users,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah']
        },
        {
          id: 'members-import',
          label: 'Import / Export Anggota (Excel)',
          icon: GraduationCap,
          roles: ['superadmin', 'admin', 'pustakawan']
        }
      ]
    },
    {
      title: 'Audit & Akun',
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
          id: 'profile',
          label: 'Profil & Akun Saya',
          icon: User,
          roles: ['superadmin', 'admin', 'pustakawan', 'kepala_sekolah', 'guru', 'siswa']
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
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#1E3A8A] text-[#93c5fd] flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] shrink-0 select-none overflow-hidden transform transition-transform duration-200 ease-in-out border-r border-[#2d4a9b] ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header Close */}
        <div className="p-4 flex items-center justify-between border-b border-[#2d4a9b] md:hidden bg-[#1a3275]">
          <div>
            <h1 className="text-white font-bold text-base leading-tight tracking-tight">WIDYA PUSTAKA</h1>
            <p className="text-[#93c5fd] text-[9px] font-medium tracking-widest uppercase">SMA 3 NGANJUK</p>
          </div>
          <button onClick={onCloseMobile} className="text-[#93c5fd] hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5 custom-scrollbar">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => isAllowed(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-[#60a5fa] uppercase tracking-widest opacity-80">
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-[#D4AF37] text-[#1E3A8A] font-bold shadow-md'
                            : item.highlight
                              ? 'text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30'
                              : 'text-[#93c5fd] hover:bg-[#2d4a9b] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? 'text-[#1E3A8A]'
                                : item.highlight
                                  ? 'text-amber-400'
                                  : 'text-[#93c5fd]'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shrink-0 ${
                              isActive
                                ? 'bg-[#1E3A8A] text-white'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
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
            className="p-3 bg-[#1a3275] hover:bg-[#23439b] border-t border-[#2d4a9b] shrink-0 cursor-pointer transition-colors"
            title="Buka Profil Akun Saya"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-400 border border-[#93c5fd] flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user.name || 'AD').substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-[#93c5fd] truncate uppercase tracking-wider">
                  {user.role === 'superadmin'
                    ? 'Super Administrator'
                    : user.role === 'admin'
                      ? 'Admin Perpustakaan'
                      : user.role === 'pustakawan'
                        ? 'Senior Librarian'
                        : user.role === 'kepala_sekolah'
                          ? 'Kepala Sekolah'
                          : user.role === 'guru'
                            ? 'Guru'
                            : 'Siswa'}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
