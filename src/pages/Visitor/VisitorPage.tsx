import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { VisitorLog } from '../../types';
import { BarcodeScannerModal } from '../../components/common/BarcodeScannerModal';
import {
  UserCheck,
  Camera,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Sparkles
} from 'lucide-react';

export const VisitorPage: React.FC = () => {
  const { settings } = useAuth();
  const { success, error, warning } = useToast();
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCodeInput, setMemberCodeInput] = useState('');
  const [purpose, setPurpose] = useState('Membaca & Meminjam Buku');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lastVisitor, setLastVisitor] = useState<any>(null);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/visitors?limit=50', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setVisitors(json.visitors);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleRecordVisit = async (code: string) => {
    if (!code.trim()) return;
    try {
      const res = await fetch('/api/reports/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({
          memberCode: code.trim(),
          purpose
        })
      });

      const data = await res.json();
      if (res.ok) {
        setLastVisitor(data.visitor);
        setMemberCodeInput('');
        success(`Selamat datang di Perpustakaan, ${data.visitor.memberName}!`);
        fetchVisitors();
      } else {
        error(data.error || 'Data anggota tidak ditemukan');
      }
    } catch (e) {
      error('Gagal mencatat kunjungan');
    }
  };

  const todayCount = visitors.filter(
    (v) => new Date(v.visitDate).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Buku Tamu Digital (Presensi Pengunjung)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Anjungan mandiri presensi kehadiran siswa, guru, dan staf di Perpustakaan Widya Pustaka SMA Negeri 3 Nganjuk.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-slate-600 dark:text-slate-300">Pengunjung Hari Ini:</span>
          <span className="font-black text-sm text-blue-700 dark:text-blue-300">{todayCount} Orang</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kiosk Scan Card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Presensi Kunjungan</h3>
            <p className="text-xs text-slate-500">Scan barcode kartu anggota Anda atau masukkan NIS/NIP</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRecordVisit(memberCodeInput);
            }}
            className="space-y-3.5"
          >
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tujuan Kunjungan
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="Membaca & Meminjam Buku">Membaca & Meminjam Buku</option>
                <option value="Mengerjakan Tugas / Diskusi">Mengerjakan Tugas / Diskusi</option>
                <option value="Akses Komputer & Koleksi Digital">Akses Komputer & Koleksi Digital</option>
                <option value="Kunjungan Kelas Literasi">Kunjungan Kelas Literasi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Barcode / NIS / NIP
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memberCodeInput}
                  onChange={(e) => setMemberCodeInput(e.target.value)}
                  placeholder="Scan barcode kartu..."
                  autoFocus
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200"
                  title="Gunakan Kamera"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Catat Kehadiran Saya
            </button>
          </form>

          {/* Last visitor flash card */}
          {lastVisitor && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl space-y-1 text-center animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                Presensi Berhasil Terdaftar
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{lastVisitor.memberName}</h4>
              <p className="text-xs text-slate-500">{lastVisitor.memberType} · {lastVisitor.purpose}</p>
            </div>
          )}
        </div>

        {/* Live Visitor Feed Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Daftar Log Pengunjung Terkini
            </h3>
            <span className="text-xs text-slate-400">Real-time Presensi</span>
          </div>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Nama Pengunjung</th>
                  <th className="p-3">Kategori & Kelas</th>
                  <th className="p-3">Tujuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(v.visitDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{v.memberName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase mr-1.5">
                        {v.memberType}
                      </span>
                      <span className="text-slate-500">{v.classGrade || '-'}</span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{v.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {scannerOpen && (
        <BarcodeScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={(code) => handleRecordVisit(code)}
          title="Buku Tamu - Pindai Kartu Anggota"
        />
      )}
    </div>
  );
};
