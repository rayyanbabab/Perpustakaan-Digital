import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, onSnapshot, query, where } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseError';
import {
  BookOpen,
  Users,
  Layers,
  ArrowLeftRight,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  Barcode,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  BookmarkCheck,
  Search,
  RotateCcw,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
  const { user, settings } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [realtimeStats, setRealtimeStats] = useState({
    visitorsToday: 0,
    activeLoans: 0,
    unpaidFines: 0
  });

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/reports/dashboard-stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listeners
    const today = new Date().toISOString().split('T')[0];
    const visitorsQuery = query(collection(db, 'visitors'), where('date', '==', today));
    const unsubscribeVisitors = onSnapshot(visitorsQuery, (snapshot) => {
      setRealtimeStats(prev => ({ ...prev, visitorsToday: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'visitors');
    });

    const loansQuery = query(collection(db, 'loans'), where('status', 'in', ['active', 'overdue']));
    const unsubscribeLoans = onSnapshot(loansQuery, (snapshot) => {
      setRealtimeStats(prev => ({ ...prev, activeLoans: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'loans');
    });

    const finesQuery = query(collection(db, 'fines'), where('status', 'in', ['unpaid', 'partial']));
    const unsubscribeFines = onSnapshot(finesQuery, (snapshot) => {
      setRealtimeStats(prev => ({ ...prev, unpaidFines: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'fines');
    });

    return () => {
      unsubscribeVisitors();
      unsubscribeLoans();
      unsubscribeFines();
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 bg-slate-200 rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = data.kpis;
  const PIE_COLORS = ['#1E3A8A', '#D4AF37', '#64748B', '#10B981', '#EC4899', '#6366F1'];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Real-time Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pengunjung Hari Ini</h3>
          <p className="text-2xl font-bold text-slate-800">{realtimeStats.visitorsToday}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Peminjaman Aktif</h3>
          <p className="text-2xl font-bold text-slate-800">{realtimeStats.activeLoans}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Denda Belum Dibayar</h3>
          <p className="text-2xl font-bold text-slate-800">{realtimeStats.unpaidFines}</p>
        </div>
      </section>

      {/* Top Section 4-KPI Grid (High Density archetype) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* KPI 1: Total Judul */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 text-[#1E3A8A] rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
              +{kpis.totalCopies} Eksemplar
            </span>
          </div>
          <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Judul</h3>
          <p className="text-2xl font-bold text-slate-800">{kpis.totalTitles?.toLocaleString('id-ID') || 0}</p>
        </div>

        {/* KPI 2: Total Anggota */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-yellow-50 text-[#D4AF37] rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {kpis.totalStudents} Siswa
            </span>
          </div>
          <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Anggota</h3>
          <p className="text-2xl font-bold text-slate-800">{kpis.totalMembers?.toLocaleString('id-ID') || 0}</p>
        </div>

        {/* KPI 3: Peminjaman Aktif */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 text-[#1E3A8A] rounded-lg">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {kpis.availableCopies} Tersedia
            </span>
          </div>
          <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Peminjaman Aktif</h3>
          <p className="text-2xl font-bold text-slate-800">{kpis.borrowedCopies?.toLocaleString('id-ID') || 0}</p>
        </div>

        {/* KPI 4: Overdue / Terlambat */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
              {kpis.overdueLoansCount > 0 ? 'Perlu Follow-up' : 'Nihil'}
            </span>
          </div>
          <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Buku Terlambat</h3>
          <p className="text-2xl font-bold text-slate-800">{kpis.overdueLoansCount || 0}</p>
        </div>
      </section>

      {/* Main 2-Column Workstation Grid: Recent Circulation Table + Collection Stats & OPAC */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sirkulasi Terbaru Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#1E3A8A]" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Sirkulasi Terbaru</h2>
            </div>
            <button
              onClick={() => navigate('circulation-active')}
              className="text-[10px] text-[#1E3A8A] font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3">ID Transaksi</th>
                  <th className="px-4 py-3">Nama Anggota</th>
                  <th className="px-4 py-3">Judul Buku</th>
                  <th className="px-4 py-3">Jatuh Tempo</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentTransactions && data.recentTransactions.length > 0 ? (
                  data.recentTransactions.slice(0, 5).map((trx: any) => (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500 font-medium">#{trx.loanCode || trx.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{trx.memberName || 'Anggota Perpus'}</div>
                        <div className="text-[10px] text-slate-400">{trx.memberClass || trx.memberCode || 'Umum'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]" title={trx.bookTitle}>
                        {trx.bookTitle || 'Koleksi Perpustakaan'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">
                        {trx.dueDate ? new Date(trx.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {trx.status === 'borrowed' ? (
                          new Date(trx.dueDate) < new Date() ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-bold uppercase">
                              Terlambat
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[9px] font-bold uppercase">
                              Dipinjam
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold uppercase">
                            Kembali
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">#TRX-8291</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">Andi Wijaya</div>
                        <div className="text-[10px] text-slate-400">Kelas XII-IPA 1</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[160px]">Laskar Pelangi - Andrea Hirata</td>
                      <td className="px-4 py-3 font-medium text-slate-600">14 Oct 2026</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[9px] font-bold uppercase">
                          Dipinjam
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">#TRX-8292</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">Siti Aminah</div>
                        <div className="text-[10px] text-slate-400">Kelas X-IPS 3</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[160px]">Matematika Kelas X - Erlangga</td>
                      <td className="px-4 py-3 font-medium text-slate-600">10 Oct 2026</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-bold uppercase">
                          Terlambat
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">#TRX-8293</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">Bambang S.</div>
                        <div className="text-[10px] text-slate-400">Guru - Biologi</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[160px]">The Origin of Species</td>
                      <td className="px-4 py-3 font-medium text-slate-600">22 Oct 2026</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[9px] font-bold uppercase">
                          Dipinjam
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">#TRX-8294</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">Rina Melati</div>
                        <div className="text-[10px] text-slate-400">Kelas XI-IPA 4</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[160px]">Bumi - Tere Liye</td>
                      <td className="px-4 py-3 font-medium text-slate-600">18 Oct 2026</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[9px] font-bold uppercase">
                          Kembali
                        </span>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Statistik Koleksi & OPAC Server Status */}
        <div className="flex flex-col space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4">Statistik Koleksi</h2>
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Fiksi & Sastra (800)</span>
                    <span>45%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[45%] h-full bg-[#1E3A8A] rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Sains & Teknologi (500-600)</span>
                    <span>30%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[30%] h-full bg-[#D4AF37] rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Buku Teks & Pelajaran</span>
                    <span>25%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[25%] h-full bg-slate-400 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#1E3A8A] rounded-lg text-white">
                <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider mb-0.5">System Notice</p>
                <p className="text-[11px] text-slate-200 leading-snug">
                  Stock opname fisik tahunan dijadwalkan per semester. Harap pastikan seluruh barcode eksemplar terpasang rapi.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1E3A8A] p-4 rounded-xl shadow-md flex items-center justify-between text-white">
            <div>
              <p className="text-[10px] font-bold text-[#93c5fd] uppercase tracking-widest">OPAC Status</p>
              <p className="text-base font-bold">Katalog Server Online</p>
              <p className="text-[10px] text-slate-300">SMA Negeri 3 Nganjuk</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-green-400/20 border border-green-400/40 flex items-center justify-center">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circulation Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Tren Sirkulasi Peminjaman</h3>
              <p className="text-xs text-slate-500">Statistik aktivitas peminjaman dan pengembalian buku</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Tahun Ajaran 2026
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPinjam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorKembali" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="peminjaman" name="Peminjaman" stroke="#1E3A8A" fillOpacity={1} fill="url(#colorPinjam)" strokeWidth={2} />
                <Area type="monotone" dataKey="pengembalian" name="Pengembalian" stroke="#D4AF37" fillOpacity={1} fill="url(#colorKembali)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Popular Books */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">Koleksi Terpopuler</h3>
            </div>
            <button
              onClick={() => navigate('reports')}
              className="text-[11px] text-[#1E3A8A] font-bold hover:underline"
            >
              Lihat Detail
            </button>
          </div>

          <div className="space-y-2">
            {data.popularBooks && data.popularBooks.slice(0, 4).map((book: any, idx: number) => (
              <div
                key={book.id}
                className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-3 hover:bg-slate-100/70 transition-colors"
              >
                <span className="w-5 h-5 rounded bg-blue-100 text-[#1E3A8A] font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <img src={book.coverUrl} alt={book.title} className="w-8 h-11 object-cover rounded shadow-xs shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-800 truncate">{book.title}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{book.author}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#1E3A8A] font-bold text-[10px] border border-blue-200">
                    {book.count}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
