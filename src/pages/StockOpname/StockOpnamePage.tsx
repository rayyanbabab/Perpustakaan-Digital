import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StockOpnameSession, StockOpnameItem } from '../../types';
import { BarcodeScannerModal } from '../../components/common/BarcodeScannerModal';
import {
  Boxes,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Search,
  Camera,
  XCircle,
  Clock,
  Printer
} from 'lucide-react';

export const StockOpnamePage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  const [sessions, setSessions] = useState<StockOpnameSession[]>([]);
  const [activeSession, setActiveSession] = useState<StockOpnameSession | null>(null);
  const [items, setItems] = useState<StockOpnameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'scanned' | 'missing'>('all');

  // Input barcode scanner
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  // New session modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('Stock Opname Semester Ganjil 2024/2025');
  const [newNotes, setNewNotes] = useState('Pemeriksaan fisik seluruh rak koleksi buku');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock-opname/sessions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setSessions(json.sessions);
        if (json.sessions.length > 0 && !activeSession) {
          const currentActive = json.sessions.find((s: any) => s.status === 'active') || json.sessions[0];
          loadSessionDetails(currentActive.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/stock-opname/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setActiveSession(json.session);
        setItems(json.items);
      }
    } catch (e) {
      error('Gagal memuat detail sesi stock opname');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/stock-opname/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({ title: newTitle, notes: newNotes })
      });
      const data = await res.json();
      if (res.ok) {
        success('Sesi Stock Opname baru berhasil dibuat!');
        setShowNewModal(false);
        fetchSessions();
      } else {
        error(data.error || 'Gagal membuat sesi');
      }
    } catch (e) {
      error('Terjadi kesalahan');
    }
  };

  const handleScanItem = async (barcode: string) => {
    if (!activeSession || activeSession.status !== 'active') {
      warning('Sesi Stock Opname tidak aktif.');
      return;
    }
    const clean = barcode.trim();
    if (!clean) return;

    try {
      const res = await fetch(`/api/stock-opname/sessions/${activeSession.id}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({ barcode: clean, condition: 'good' })
      });
      const data = await res.json();
      if (res.ok) {
        success(`Terverifikasi: "${data.item.bookTitle}" (${data.item.barcode})`);
        setBarcodeInput('');
        loadSessionDetails(activeSession.id);
      } else {
        error(data.error || 'Barcode tidak ditemukan pada inventaris');
      }
    } catch (e) {
      error('Gagal memproses pemindaian stock opname');
    }
  };

  const handleFinishSession = async () => {
    if (!activeSession) return;
    if (!confirm('Tutup dan kunci sesi Stock Opname ini? Buku yang belum terpindai akan ditandai sebagai hilang/selisih.')) return;

    try {
      const res = await fetch(`/api/stock-opname/sessions/${activeSession.id}/finish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        success('Sesi Stock Opname berhasil diselesaikan dan diarsipkan!');
        fetchSessions();
      }
    } catch (e) {
      error('Gagal menyelesaikan sesi');
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterTab === 'scanned') return item.isScanned;
    if (filterTab === 'missing') return !item.isScanned;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-500" />
            Stock Opname & Inventarisasi Koleksi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pemeriksaan fisik keberadaan buku di rak secara berkala menggunakan barcode scanner cepat.
          </p>
        </div>

        {['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Buka Sesi Stock Opname Baru
          </button>
        )}
      </div>

      {/* Session Selector & Stats Bar */}
      {activeSession && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    activeSession.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {activeSession.status === 'active' ? '● Sesi Aktif' : 'Selesai & Diarsipkan'}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{activeSession.title}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dibuat oleh: {activeSession.createdByName} · {activeSession.startDate}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeSession.status === 'active' && ['superadmin', 'admin', 'pustakawan'].includes(user?.role || '') && (
                <button
                  onClick={handleFinishSession}
                  className="px-3.5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl"
                >
                  Tutup & Selesaikan Sesi
                </button>
              )}
            </div>
          </div>

          {/* Progress Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Total Eksemplar</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">{activeSession.totalItems}</span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-emerald-600 dark:text-emerald-400 block text-[10px]">Terpindai (Ada)</span>
              <span className="text-lg font-black text-emerald-600">{activeSession.scannedCount || 0}</span>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/50">
              <span className="text-rose-600 dark:text-rose-400 block text-[10px]">Belum / Selisih</span>
              <span className="text-lg font-black text-rose-600">{activeSession.missingItems || 0}</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <span className="text-blue-600 dark:text-blue-400 block text-[10px]">Progres Fisik</span>
              <span className="text-lg font-black text-blue-600">
                {activeSession.totalItems && activeSession.totalItems > 0
                  ? Math.round(((activeSession.scannedCount || 0) / activeSession.totalItems) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>

          {/* Scanner Input for Active Session */}
          {activeSession.status === 'active' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
                <span>Pindai Barcode Eksemplar di Rak</span>
                <button
                  onClick={() => setScannerOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Buka Kamera Scanner
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleScanItem(barcodeInput);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode buku (Contoh: WPL-000001)..."
                  autoFocus
                  className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shrink-0"
                >
                  Verifikasi Buku
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                filterTab === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              onClick={() => setFilterTab('scanned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                filterTab === 'scanned' ? 'bg-emerald-600 text-white' : 'text-slate-500'
              }`}
            >
              Terpindai Ada ({items.filter((i) => i.isScanned).length})
            </button>
            <button
              onClick={() => setFilterTab('missing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                filterTab === 'missing' ? 'bg-rose-600 text-white' : 'text-slate-500'
              }`}
            >
              Belum Terpindai ({items.filter((i) => !i.isScanned).length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Barcode / No Inventaris</th>
                <th className="p-3.5">Judul Buku</th>
                <th className="p-3.5">No. Panggil</th>
                <th className="p-3.5">Lokasi Rak</th>
                <th className="p-3.5">Waktu Pindai</th>
                <th className="p-3.5 text-right">Status Fisik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    {item.barcode}
                  </td>
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{item.bookTitle}</td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{item.callNumber}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{item.location}</td>
                  <td className="p-3.5 text-slate-500 font-mono text-[10px]">
                    {item.scannedAt ? new Date(item.scannedAt).toLocaleTimeString('id-ID') : '-'}
                  </td>
                  <td className="p-3.5 text-right">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.isScanned
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {item.isScanned ? 'Ada & Terverifikasi' : 'Belum Terpindai'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Session Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Buka Sesi Stock Opname Baru</h3>
            <form onSubmit={handleCreateSession} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Judul / Periode Sesi *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan / Keterangan
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl"
                >
                  Mulai Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scanner Camera Modal */}
      {scannerOpen && (
        <BarcodeScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={(scanned) => handleScanItem(scanned)}
          title="Stock Opname - Pindai Barcode Buku"
        />
      )}
    </div>
  );
};
