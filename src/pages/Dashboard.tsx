import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Users,
  ArrowLeftRight,
  AlertCircle,
  TrendingUp,
  Award,
  Building2,
  Barcode,
  Search,
  RotateCcw,
  Activity,
  ArrowUpRight,
  Database,
  Calendar,
  Clock,
  CheckCircle2,
  Library,
  DollarSign,
  UserCheck,
  FileSpreadsheet,
  RefreshCw,
  Layers,
  ChevronRight,
  Filter,
  GraduationCap,
  ShieldCheck,
  BookMarked
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
  setCurrentTab?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, setCurrentTab }) => {
  const navigate = onNavigate || setCurrentTab || (() => {});
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeMainTab, setActiveMainTab] = useState<'circulation' | 'trends' | 'activity'>('circulation');
  const [circulationFilter, setCirculationFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [searchCirculation, setSearchCirculation] = useState('');

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/reports/dashboard-stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        setTimeout(() => setRefreshing(false), 400);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Clock update
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) + ' • ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  }, []);

  if (loading || !data) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="h-44 bg-slate-200/80 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200/80 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200/80 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200/80 rounded-xl animate-pulse" />
          <div className="h-96 bg-slate-200/80 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const kpis = data.kpis || {};
  const recentLoans = data.recentLoans || data.recentTransactions || [];
  const popularBooks = data.popularBooks || [];
  const activeMembers = data.activeMembers || [];
  const categoryStats = data.categoryStats || [];
  const monthlyTrends = data.monthlyTrends || [];
  const recentLogs = data.recentLogs || [];

  // Filtered recent loans
  const filteredLoans = recentLoans.filter((loan: any) => {
    const isOverdue = loan.status === 'overdue' || (loan.dueDate && new Date(loan.dueDate) < new Date() && loan.status !== 'returned');
    const isReturned = loan.status === 'returned';
    const isActive = !isReturned && !isOverdue;

    if (circulationFilter === 'active' && !isActive) return false;
    if (circulationFilter === 'overdue' && !isOverdue) return false;
    if (circulationFilter === 'returned' && !isReturned) return false;

    if (searchCirculation.trim()) {
      const q = searchCirculation.toLowerCase();
      const memberMatch = (loan.memberName || '').toLowerCase().includes(q) || (loan.memberCode || '').toLowerCase().includes(q);
      const codeMatch = (loan.loanCode || '').toLowerCase().includes(q);
      const bookMatch = loan.items?.some((i: any) => (i.bookTitle || '').toLowerCase().includes(q));
      return memberMatch || codeMatch || bookMatch;
    }

    return true;
  });

  // Calculate availability percentage
  const totalCopies = kpis.totalCopies || 1;
  const availableCopies = kpis.availableCopies || 0;
  const availabilityRate = Math.min(100, Math.round((availableCopies / totalCopies) * 100));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Executive Institutional Command Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0B132B] text-white p-6 sm:p-7 shadow-xs border border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Context Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-slate-300 text-xs font-medium">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-slate-100">Politeknik Astra</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>Pusat Sumber Belajar & Repositori</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              {greeting}, {user?.name || 'Administrator'}!
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Kelola sirkulasi koleksi, pantau riwayat peminjaman mahasiswa, dan verifikasi ketersediaan buku perpustakaan secara presisi.
            </p>

            {/* Quick Action Commands */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => navigate('circulation-quick')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95"
              >
                <Barcode className="w-4 h-4 text-white" />
                <span>Sirkulasi Cepat (Scan)</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-500/50 text-[10px] font-mono">F1</span>
              </button>

              <button
                onClick={() => navigate('visitors')}
                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center gap-2 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-slate-300" />
                <span>Buku Tamu</span>
              </button>

              <button
                onClick={() => navigate('books-list')}
                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center gap-2 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-slate-300" />
                <span>Katalog Bibliografi</span>
              </button>

              <button
                onClick={() => navigate('opac')}
                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center gap-2 transition-colors"
              >
                <Search className="w-4 h-4 text-slate-300" />
                <span>Katalog OPAC</span>
              </button>
            </div>
          </div>

          {/* Right Status Command Card */}
          <div className="lg:w-80 bg-slate-900/80 backdrop-blur-xs border border-slate-700/80 rounded-xl p-4 shrink-0 space-y-3.5">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-2.5 border-b border-slate-800">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Waktu & Sinkronisasi</span>
              </span>
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                title="Refresh data dashboard"
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>

            <p className="text-xs font-semibold text-white font-mono tracking-tight">{currentTime || 'Memuat waktu...'}</p>

            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-slate-500" />
                  Database
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-medium text-[10px]">
                  Neon Cloud PG
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-slate-500" />
                  Kepatuhan SOP
                </span>
                <span className="text-slate-200 font-mono text-[11px] font-medium">
                  {kpis.overdueLoansCount === 0 ? 'Optimal (100%)' : `${kpis.overdueLoansCount} Perlu Ditagih`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Operational Pulse Bar (Presensi & Transaksi Hari Ini) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pengunjung Hari Ini</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{kpis.visitorsToday ?? 0}</p>
            <p className="text-[11px] text-slate-500">Presensi buku tamu digital</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dipinjam Hari Ini</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{kpis.loansToday ?? 0}</p>
            <p className="text-[11px] text-slate-500">Transaksi peminjaman baru</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kembali Hari Ini</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{kpis.returnsToday ?? 0}</p>
            <p className="text-[11px] text-slate-500">Buku kembali ke sirkulasi</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between hover:border-slate-300 transition-colors">
          <div className="space-y-0.5 min-w-0 pr-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">Denda Belum Lunas</p>
            <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-mono truncate">
              Rp {(kpis.totalUnpaidFines || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-500">
              {(kpis.totalUnpaidFines || 0) > 0 ? 'Tertunggak dari anggota' : 'Semua denda lunas'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* 3. Core Institutional KPI Cards (4 High-Density Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Koleksi Judul & Fisik */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono">
              +{kpis.totalCopies || 0} Fisik
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Judul Buku</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {(kpis.totalTitles || 0).toLocaleString('id-ID')}
            </p>
            <span className="text-xs text-slate-500">Judul</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Tersedia di Rak</span>
              <span className="font-mono font-semibold text-slate-900">{kpis.availableCopies || 0} ({availabilityRate}%)</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${availabilityRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Total Anggota Terdaftar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono">
              {kpis.totalStudents || 0} Mahasiswa
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Anggota</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {(kpis.totalMembers || 0).toLocaleString('id-ID')}
            </p>
            <span className="text-xs text-slate-500">Member</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Dosen & Tenaga Pendidik</span>
              <span className="font-mono font-semibold text-slate-900">{kpis.totalTeachers || 0} Akun</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Tenaga Kependidikan (Tendik)</span>
              <span className="font-mono font-semibold text-slate-700">{kpis.totalTendik || 0} Akun</span>
            </div>
          </div>
        </div>

        {/* Card 3: Sirkulasi Sedang Dipinjam */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
              {kpis.availableCopies || 0} di Rak
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Sedang Dipinjam</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {(kpis.borrowedCopies || 0).toLocaleString('id-ID')}
            </p>
            <span className="text-xs text-slate-500">Eksemplar</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Transaksi Peminjaman Aktif</span>
              <span className="font-mono font-semibold text-slate-900">{kpis.activeLoansCount || 0} Transaksi</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Buku dalam Reservasi</span>
              <span className="font-mono font-semibold text-slate-700">{kpis.reservedCopies || 0} Eksemplar</span>
            </div>
          </div>
        </div>

        {/* Card 4: Buku Jatuh Tempo / Overdue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                (kpis.overdueLoansCount || 0) > 0
                  ? 'text-rose-700 bg-rose-50 border border-rose-200'
                  : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
              }`}
            >
              {(kpis.overdueLoansCount || 0) > 0 ? 'Perlu Follow-up' : 'Nihil Terlambat'}
            </span>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Jatuh Tempo (Overdue)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {(kpis.overdueLoansCount || 0).toLocaleString('id-ID')}
            </p>
            <span className="text-xs text-slate-500">Transaksi</span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Denda Terkumpul</span>
              <span className="font-mono font-semibold text-emerald-600">
                Rp {(kpis.totalFinesCollected || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Denda Belum Dibayar</span>
              <span className="font-mono font-semibold text-rose-600">
                Rp {(kpis.totalUnpaidFines || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Main Workstation Grid: Tabbed Left Section + Right Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols / 66% width): Tabbed Main Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-xs">
          {/* Header & Tabs */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveMainTab('circulation')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeMainTab === 'circulation'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Sirkulasi Terkini
              </button>

              <button
                onClick={() => setActiveMainTab('trends')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeMainTab === 'trends'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tren Sirkulasi Bulanan
              </button>

              <button
                onClick={() => setActiveMainTab('activity')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeMainTab === 'activity'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Log Aktivitas
              </button>
            </div>

            <button
              onClick={() => navigate(activeMainTab === 'trends' ? 'reports' : 'circulation-active')}
              className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors flex items-center gap-1 self-end sm:self-center"
            >
              <span>{activeMainTab === 'trends' ? 'Buka Laporan Penuh' : 'Kelola Sirkulasi'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TAB 1: Sirkulasi Terkini */}
          {activeMainTab === 'circulation' && (
            <div className="flex flex-col flex-1">
              {/* Filter Sub-bar */}
              <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" />
                    Status:
                  </span>
                  {(
                    [
                      { id: 'all', label: 'Semua' },
                      { id: 'active', label: 'Dipinjam' },
                      { id: 'overdue', label: 'Jatuh Tempo' },
                      { id: 'returned', label: 'Kembali' }
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setCirculationFilter(f.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        circulationFilter === f.id
                          ? 'bg-white text-blue-600 font-semibold shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchCirculation}
                    onChange={(e) => setSearchCirculation(e.target.value)}
                    placeholder="Cari peminjam / buku..."
                    className="w-full sm:w-48 pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">Kode Trx</th>
                      <th className="px-4 py-3">Peminjam</th>
                      <th className="px-4 py-3">Koleksi Buku</th>
                      <th className="px-4 py-3">Tenggat Waktu</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLoans && filteredLoans.length > 0 ? (
                      filteredLoans.slice(0, 6).map((loan: any) => {
                        const firstItem = loan.items && loan.items[0];
                        const isOverdue =
                          loan.status === 'overdue' ||
                          (loan.dueDate && new Date(loan.dueDate) < new Date() && loan.status !== 'returned');

                        return (
                          <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-mono text-slate-500 font-semibold whitespace-nowrap">
                              #{loan.loanCode || (loan.id ? loan.id.substring(0, 8) : 'TRX')}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                  {(loan.memberName || 'A').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-800 truncate">{loan.memberName || 'Anggota'}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {loan.memberCode || loan.memberType || 'Siswa'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-700 max-w-[220px]">
                              <div className="font-medium truncate" title={firstItem?.bookTitle || 'Koleksi Perpustakaan'}>
                                {firstItem?.bookTitle || 'Koleksi Perpustakaan'}
                              </div>
                              {loan.items && loan.items.length > 1 && (
                                <span className="text-[10px] text-blue-600 font-semibold">
                                  +{loan.items.length - 1} buku lainnya
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-mono text-slate-700 font-medium">
                                {loan.dueDate
                                  ? new Date(loan.dueDate).toLocaleDateString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                  : '-'}
                              </div>
                              {isOverdue && loan.status !== 'returned' && (
                                <div className="text-[10px] text-rose-600 font-semibold">Lewat jatuh tempo</div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {loan.status === 'returned' ? (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">
                                  Kembali
                                </span>
                              ) : isOverdue ? (
                                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold uppercase">
                                  Terlambat
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold uppercase">
                                  Dipinjam
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-2">
                              <RotateCcw className="w-5 h-5" />
                            </div>
                            <p className="text-slate-800 font-semibold text-xs">Tidak Ada Transaksi Sesuai Filter</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">
                              Ubah opsi filter atau cari transaksi peminjaman lain.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Tren Bulanan */}
          {activeMainTab === 'trends' && (
            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Fluktuasi Sirkulasi Koleksi (6 Bulan Terakhir)</h3>
                  <p className="text-xs text-slate-500">Perbandingan volume buku dipinjam versus buku dikembalikan</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  Semester 2026
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPinjam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorKembali" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="peminjaman"
                      name="Peminjaman Buku"
                      stroke="#2563EB"
                      fillOpacity={1}
                      fill="url(#colorPinjam)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="pengembalian"
                      name="Pengembalian Buku"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorKembali)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Tingkat Pengembalian Tepat Waktu</p>
                  <p className="text-xl font-bold text-emerald-600 font-mono mt-0.5">
                    {kpis.overdueLoansCount === 0 ? '100%' : `${Math.round(((kpis.activeLoansCount || 1) / ((kpis.activeLoansCount || 1) + (kpis.overdueLoansCount || 0))) * 100)}%`}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Perputaran Koleksi (Turnover)</p>
                  <p className="text-xl font-bold text-blue-600 font-mono mt-0.5">
                    {kpis.totalCopies ? ((kpis.borrowedCopies || 0) / kpis.totalCopies * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Log Aktivitas Sistem */}
          {activeMainTab === 'activity' && (
            <div className="p-5 space-y-3 flex-1 overflow-y-auto max-h-[380px]">
              {recentLogs && recentLogs.length > 0 ? (
                recentLogs.map((log: any, i: number) => (
                  <div key={log.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-800">{log.action || 'Aktivitas Sirkulasi'}</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 truncate">{log.details || log.description || 'Pencatatan sirkulasi perpustakaan'}</p>
                      {log.userName && (
                        <p className="text-[10px] text-slate-400 mt-1">Oleh: {log.userName}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Belum ada catatan log aktivitas pada sesi ini.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col / 33% width): Institutional Intelligence */}
        <div className="flex flex-col space-y-4">
          {/* Card 1: Top Readers (Pembaca Paling Aktif) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-tight">Pembaca Teraktif</h3>
                  <p className="text-[10px] text-slate-500">Frekuensi peminjaman tertinggi</p>
                </div>
              </div>
              <button
                onClick={() => navigate('members-list')}
                className="text-[11px] text-blue-600 font-semibold hover:underline"
              >
                Semua
              </button>
            </div>

            <div className="space-y-2 mt-3">
              {activeMembers && activeMembers.length > 0 ? (
                activeMembers.slice(0, 4).map((member: any, idx: number) => (
                  <div
                    key={member.id || idx}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-md font-bold text-[10px] flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-900'
                            : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-800 truncate">{member.name || 'Anggota'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{member.memberCode || member.type || 'Siswa'}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold shrink-0">
                      {member.count} buku
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Belum ada data peringkat anggota.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Koleksi Terpopuler */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-tight">Koleksi Terpopuler</h3>
                  <p className="text-[10px] text-slate-500">Buku paling sering dipinjam</p>
                </div>
              </div>
              <button
                onClick={() => navigate('reports')}
                className="text-[11px] text-blue-600 font-semibold hover:underline"
              >
                Laporan
              </button>
            </div>

            <div className="space-y-2 mt-3">
              {popularBooks && popularBooks.length > 0 ? (
                popularBooks.slice(0, 3).map((book: any, idx: number) => (
                  <div
                    key={book.id || idx}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 flex items-center gap-2.5 transition-colors"
                  >
                    <span
                      className={`w-5 h-5 rounded-md font-bold text-[10px] flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-900'
                          : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-slate-800 truncate" title={book.title}>
                        {book.title || 'Judul Buku'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{book.author || 'Penulis'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-100 shrink-0">
                      {book.count || 0}x
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Belum ada data sirkulasi koleksi.
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Distribusi Kategori Koleksi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-tight">Kategori Terbanyak</h3>
              <span className="text-[10px] font-mono text-slate-400">DDC & Jurusan</span>
            </div>

            <div className="space-y-2.5">
              {categoryStats && categoryStats.length > 0 ? (
                categoryStats.slice(0, 3).map((cat: any, i: number) => {
                  const totalBooks = kpis.totalTitles || 1;
                  const pct = Math.min(100, Math.round((cat.count / totalBooks) * 100));
                  const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-slate-700'];
                  const barColor = colors[i % colors.length];

                  return (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span className="truncate pr-2">{cat.name || 'Umum'}</span>
                        <span className="text-slate-400 font-mono text-[11px] shrink-0">
                          {cat.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs">
                  Kategori akan tampil setelah buku diinput.
                </div>
              )}
            </div>
          </div>

          {/* Card 4: OPAC & Server Status */}
          <div className="bg-[#0B132B] p-4 rounded-2xl border border-slate-800 text-white flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Katalog Publik OPAC</p>
              </div>
              <p className="text-xs font-semibold text-white">Online Public Access Catalog</p>
              <p className="text-[10px] text-slate-400">Terbuka untuk penelusuran mandiri</p>
            </div>
            <button
              onClick={() => navigate('opac')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Buka OPAC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
