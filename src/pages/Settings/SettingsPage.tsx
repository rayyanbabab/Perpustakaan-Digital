import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SystemSettings, ActivityLog } from '../../types';
import { UserManagementView } from './UserManagementView';
import {
  Settings,
  Shield,
  Users,
  Database,
  History,
  Sliders,
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  Key
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, settings, updateSettings, reloadSettings } = useAuth();
  const { success, error, warning } = useToast();

  const [activeTab, setActiveTab] = useState<
    'general' | 'users' | 'master' | 'logs' | 'backup' | 'google'
  >('general');

  // Google Sync state
  const [syncingGas, setSyncingGas] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Form Settings State
  const [formData, setFormData] = useState<SystemSettings>(
    settings || {
      schoolName: 'SMA NEGERI 3 NGANJUK',
      address: 'Jl. Bengawan Solo 109 Begadung, Nganjuk, Jawa Timur Kode Pos 64413',
      phone: '(0358) 321xxx',
      email: 'perpustakaan@sman3nganjuk.sch.id',
      headmasterName: 'Dra. Hj. Endang Sulistyowati, M.Pd.',
      headmasterNip: '196705141992032008',
      headOfLibrary: 'Budi Santoso, S.Pd., M.A.',
      headOfLibraryNip: '198204122008011012',
      loanQuotaSiswa: 3,
      loanQuotaGuru: 5,
      loanDurationDaysSiswa: 7,
      loanDurationDaysGuru: 14,
      finePerDay: 1000,
      maxExtensionsAllowed: 2,
      receiptFooterMessage: 'Terima kasih telah berkunjung & meminjam di Perpustakaan SMAN 3 Nganjuk.'
    }
  );

  // Master Data State
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [newCatInput, setNewCatInput] = useState('');
  const [newLocInput, setNewLocInput] = useState('');

  // Audit Logs State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Restore State
  const [restoreJson, setRestoreJson] = useState('');

  useEffect(() => {
    if (settings) setFormData(settings);
    fetchMaster();
    fetchLogs();
  }, [settings]);

  const fetchMaster = async () => {
    try {
      const res = await fetch('/api/settings/master');
      if (res.ok) {
        const json = await res.json();
        const cats = Array.isArray(json.categories)
          ? json.categories.map((c: any) => (typeof c === 'object' && c !== null ? c.name : String(c)))
          : [];
        const locs = Array.isArray(json.locations)
          ? json.locations.map((l: any) => (typeof l === 'object' && l !== null ? l.name : String(l)))
          : [];
        setCategories(cats);
        setLocations(locs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/settings/logs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Save General Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(formData);
      success('Pengaturan perpustakaan berhasil diperbarui!');
    } catch (err: any) {
      error(err.message || 'Gagal menyimpan pengaturan');
    }
  };

  // Master Data modifications
  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    if (categories.includes(newCatInput.trim())) return;
    const updated = [...categories, newCatInput.trim()];
    setCategories(updated);
    saveMasterData(updated, locations);
    setNewCatInput('');
  };

  const handleDeleteCategory = (cat: string) => {
    const updated = categories.filter((c) => c !== cat);
    setCategories(updated);
    saveMasterData(updated, locations);
  };

  const handleAddLocation = () => {
    if (!newLocInput.trim()) return;
    if (locations.includes(newLocInput.trim())) return;
    const updated = [...locations, newLocInput.trim()];
    setLocations(updated);
    saveMasterData(categories, updated);
    setNewLocInput('');
  };

  const handleDeleteLocation = (loc: string) => {
    const updated = locations.filter((l) => l !== loc);
    setLocations(updated);
    saveMasterData(categories, updated);
  };

  const saveMasterData = async (cats: string[], locs: string[]) => {
    try {
      await fetch('/api/settings/master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({ categories: cats, locations: locs })
      });
      success('Master data berhasil diperbarui.');
    } catch (e) {
      error('Gagal menyimpan master data');
    }
  };

  // Backup & Restore
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/settings/backup', {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_widya_pustaka_${Date.now()}.json`;
        a.click();
        success('Cadangan database berhasil diunduh!');
      }
    } catch (e) {
      error('Gagal mengunduh backup');
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRestoreJson(ev.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreJson.trim()) {
      warning('Silakan pilih file backup JSON terlebih dahulu.');
      return;
    }
    if (!confirm('PERINGATAN: Memulihkan database akan menimpa seluruh data perpustakaan saat ini. Lanjutkan?'))
      return;

    try {
      const parsed = JSON.parse(restoreJson);
      const res = await fetch('/api/settings/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({ data: parsed })
      });
      if (res.ok) {
        success('Database perpustakaan berhasil dipulihkan!');
        reloadSettings();
      } else {
        error('Gagal memulihkan database.');
      }
    } catch (e) {
      error('Format file backup JSON tidak valid.');
    }
  };

  const handleTriggerGasSync = async () => {
    setSyncingGas(true);
    try {
      const res = await fetch('/api/settings/gas-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({ gasWebAppUrl: formData.gasWebAppUrl })
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message || 'Sinkronisasi ke Google Spreadsheet & Drive berhasil!');
      } else {
        error(data.error || 'Gagal mengirim data ke Google Apps Script Web App.');
      }
    } catch (e: any) {
      error('Gagal menghubungkan ke server sinkronisasi: ' + e.message);
    } finally {
      setSyncingGas(false);
    }
  };

  const gasScriptCode = `// =========================================================================
// GOOGLE APPS SCRIPT (GAS) CODE - WIDYA PUSTAKA LIBRARY SYSTEM
// SMAN 3 NGANJUK
// =========================================================================

const SPREADSHEET_ID = "${formData.googleSpreadsheetId || '1VlKdmIhyMOIQtdgGu5SebRy4wP216THGt9dMPuQfyOA'}";
const DRIVE_FOLDER_ID = "${formData.googleDriveFolderId || '1KpUK7yn2CZeTQGKAjdvQWdC662dkOna3'}";

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Web App Google Apps Script Widya Pustaka SMAN 3 Nganjuk Aktif & Siap!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const data = contents.data;

    if (data.books) updateSheet(ss, "Katalog_Buku", data.books);
    if (data.members) updateSheet(ss, "Anggota", data.members);
    if (data.loans) updateSheet(ss, "Peminjaman", data.loans);
    if (data.fines) updateSheet(ss, "Denda", data.fines);
    if (data.visitors) updateSheet(ss, "Presensi_Pengunjung", data.visitors);

    // Backup ke Google Drive Folder
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const fileName = "Backup_WidyaPustaka_" + Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd_HHmmss") + ".json";
    folder.createFile(fileName, JSON.stringify(contents, null, 2), MimeType.PLAIN_TEXT);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data berhasil dicatat ke Google Sheets & disalin ke Google Drive!"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateSheet(ss, sheetName, items) {
  if (!items || items.length === 0) return;
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }

  const headers = Object.keys(items[0]);
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1E3A8A").setFontColor("#FFFFFF");

  const rows = items.map(item => headers.map(h => item[h]));
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}`;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            Pengaturan Sistem & Konfigurasi Perpustakaan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kustomisasi profil sekolah, kuota sirkulasi, manajemen hak akses, master DDC, dan audit log.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Profil & Kebijakan Sirkulasi
        </button>

        {['superadmin', 'admin'].includes(user?.role || '') && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Manajemen User & RBAC
          </button>
        )}

        <button
          onClick={() => setActiveTab('master')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'master'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          Master Data Rak & DDC
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Log Aktivitas
        </button>

        {['superadmin', 'admin'].includes(user?.role || '') && (
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Backup & Restore
          </button>
        )}

        {['superadmin', 'admin'].includes(user?.role || '') && (
          <button
            onClick={() => setActiveTab('google')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-300" />
            Integrasi Google Sheets & Drive
          </button>
        )}
      </div>

      {/* TAB 1: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Identitas Sekolah */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
              Identitas Sekolah & Perpustakaan (KOP Surat & Laporan)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Resmi Sekolah
                </label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={formData.headmasterName}
                  onChange={(e) => setFormData({ ...formData, headmasterName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={formData.headmasterNip}
                  onChange={(e) => setFormData({ ...formData, headmasterNip: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Kepala Perpustakaan
                </label>
                <input
                  type="text"
                  value={formData.headOfLibrary}
                  onChange={(e) => setFormData({ ...formData, headOfLibrary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  NIP Kepala Perpustakaan
                </label>
                <input
                  type="text"
                  value={formData.headOfLibraryNip}
                  onChange={(e) => setFormData({ ...formData, headOfLibraryNip: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Kebijakan Sirkulasi */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
              Kebijakan Sirkulasi & Denda Keterlambatan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kuota Maksimal Siswa (Buku)
                </label>
                <input
                  type="number"
                  value={formData.loanQuotaSiswa}
                  onChange={(e) => setFormData({ ...formData, loanQuotaSiswa: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Durasi Pinjam Siswa (Hari)
                </label>
                <input
                  type="number"
                  value={formData.loanDurationDaysSiswa}
                  onChange={(e) => setFormData({ ...formData, loanDurationDaysSiswa: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kuota Maksimal Guru (Buku)
                </label>
                <input
                  type="number"
                  value={formData.loanQuotaGuru}
                  onChange={(e) => setFormData({ ...formData, loanQuotaGuru: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Durasi Pinjam Guru (Hari)
                </label>
                <input
                  type="number"
                  value={formData.loanDurationDaysGuru}
                  onChange={(e) => setFormData({ ...formData, loanDurationDaysGuru: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tarif Denda per Hari (Rp)
                </label>
                <input
                  type="number"
                  value={formData.finePerDay}
                  onChange={(e) => setFormData({ ...formData, finePerDay: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-rose-600"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Batas Kali Perpanjangan
                </label>
                <input
                  type="number"
                  value={formData.maxExtensionsAllowed}
                  onChange={(e) => setFormData({ ...formData, maxExtensionsAllowed: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pesan Footer Struk Thermal
              </label>
              <input
                type="text"
                value={formData.receiptFooterMessage}
                onChange={(e) => setFormData({ ...formData, receiptFooterMessage: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20"
            >
              <Save className="w-4 h-4" />
              Simpan Perubahan Pengaturan
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: USER MANAGEMENT & RBAC */}
      {activeTab === 'users' && <UserManagementView />}

      {/* TAB 3: MASTER DATA */}
      {activeTab === 'master' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Klasifikasi Kategori Koleksi DDC ({categories.length})
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="Tambah kategori baru..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shrink-0"
              >
                Tambah
              </button>
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto">
              {categories.map((c) => (
                <div
                  key={c}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-medium"
                >
                  <span>{c}</span>
                  <button onClick={() => handleDeleteCategory(c)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Daftar Rak & Lokasi Fisik Perpustakaan ({locations.length})
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newLocInput}
                onChange={(e) => setNewLocInput(e.target.value)}
                placeholder="Tambah rak baru (Contoh: Rak F-01)..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={handleAddLocation}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shrink-0"
              >
                Tambah
              </button>
            </div>

            <div className="space-y-1 max-h-80 overflow-y-auto">
              {locations.map((l) => (
                <div
                  key={l}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-medium"
                >
                  <span>{l}</span>
                  <button onClick={() => handleDeleteLocation(l)} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT ACTIVITY LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Audit Rekaman Aktivitas Sistem
            </h3>
            <button
              onClick={fetchLogs}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Segarkan Log
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                <tr>
                  <th className="p-3.5">Waktu</th>
                  <th className="p-3.5">Petugas / User</th>
                  <th className="p-3.5">Modul & Aksi</th>
                  <th className="p-3.5">Detail Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {log.userName}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] uppercase font-bold">
                        {log.module} · {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <Download className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Unduh Cadangan Database (JSON)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Simpan seluruh data bibliografi, eksemplar, anggota, sirkulasi, denda, dan log sistem ke dalam berkas JSON mandiri.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Database Backup (.JSON)
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <Upload className="w-8 h-8 text-amber-500" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Pulihkan Database (Restore)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Unggah file cadangan JSON untuk memulihkan seluruh data perpustakaan.
              </p>
            </div>

            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400"
            />

            <button
              onClick={handleExecuteRestore}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Pulihkan Database Sekarang
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: INTEGRASI GOOGLE SHEETS & DRIVE (GAS) */}
      {activeTab === 'google' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/60 pb-4">
              <div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Realtime Cloud Sync
                </span>
                <h2 className="text-xl font-black mt-2 flex items-center gap-2">
                  Integrasi Google Spreadsheet & Google Drive
                </h2>
                <p className="text-xs text-emerald-200/80 mt-1">
                  Seluruh data katalog buku, anggota, transaksi peminjaman, denda, dan presensi otomatis tersimpan ke Google Sheets & Folder Google Drive SMAN 3 Nganjuk.
                </p>
              </div>

              <button
                onClick={handleTriggerGasSync}
                disabled={syncingGas}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncingGas ? 'animate-spin' : ''}`} />
                {syncingGas ? 'Menyinkronkan...' : 'Sinkronkan Sekarang Ke Google Sheets'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/40 rounded-xl space-y-1">
                <span className="text-emerald-400 font-semibold block">Google Spreadsheet Target:</span>
                <a
                  href={formData.googleSpreadsheetUrl || 'https://docs.google.com/spreadsheets/d/1VlKdmIhyMOIQtdgGu5SebRy4wP216THGt9dMPuQfyOA/edit?usp=sharing'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-300 underline font-mono break-all hover:text-white"
                >
                  {formData.googleSpreadsheetUrl || 'https://docs.google.com/spreadsheets/d/1VlKdmIhyMOIQtdgGu5SebRy4wP216THGt9dMPuQfyOA/edit?usp=sharing'}
                </a>
              </div>

              <div className="p-3.5 bg-teal-950/60 border border-teal-800/40 rounded-xl space-y-1">
                <span className="text-teal-400 font-semibold block">Folder Google Drive Target:</span>
                <a
                  href={formData.googleDriveFolderUrl || 'https://drive.google.com/drive/folders/1KpUK7yn2CZeTQGKAjdvQWdC662dkOna3?usp=sharing'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-300 underline font-mono break-all hover:text-white"
                >
                  {formData.googleDriveFolderUrl || 'https://drive.google.com/drive/folders/1KpUK7yn2CZeTQGKAjdvQWdC662dkOna3?usp=sharing'}
                </a>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Konfigurasi Google Apps Script (GAS) Web App</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Web App Google Apps Script (Selesai Deploy)
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={formData.gasWebAppUrl || ''}
                  onChange={(e) => setFormData({ ...formData, gasWebAppUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Dapatkan URL Web App ini dari menu <strong>Deploy &gt; New Deployment &gt; Web App</strong> di Google Apps Script.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={formData.googleSpreadsheetId || '1VlKdmIhyMOIQtdgGu5SebRy4wP216THGt9dMPuQfyOA'}
                  onChange={(e) => setFormData({ ...formData, googleSpreadsheetId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Drive Folder ID
                </label>
                <input
                  type="text"
                  value={formData.googleDriveFolderId || '1KpUK7yn2CZeTQGKAjdvQWdC662dkOna3'}
                  onChange={(e) => setFormData({ ...formData, googleDriveFolderId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Interval Otomatis Sinkronisasi
                </label>
                <select
                  value={formData.autoSyncIntervalMinutes || 5}
                  onChange={(e) => setFormData({ ...formData, autoSyncIntervalMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                >
                  <option value={1}>Setiap 1 Menit (Realtime High Priority)</option>
                  <option value={5}>Setiap 5 Menit (Standar)</option>
                  <option value={15}>Setiap 15 Menit</option>
                  <option value={60}>Setiap 1 Jam</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan Konfigurasi Integrasi
              </button>
            </div>
          </form>

          {/* Script Code Display & Copy Instructions */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-emerald-400 text-sm">Kode Google Apps Script (Copy & Paste)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Salin kode di bawah ini lalu tempel di editor Google Apps Script spreadsheet Anda.
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(gasScriptCode);
                  setCopiedScript(true);
                  setTimeout(() => setCopiedScript(false), 2000);
                  success('Kode Google Apps Script berhasil disalin!');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
              >
                {copiedScript ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {copiedScript ? 'Tersalin!' : 'Salin Kode GAS'}
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-slate-800 max-h-80 leading-relaxed">
              {gasScriptCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
