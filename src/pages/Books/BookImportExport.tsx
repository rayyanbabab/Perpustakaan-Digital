import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  HelpCircle,
  Trash2,
  RefreshCw,
  FileCheck,
  Layers,
  BookOpen
} from 'lucide-react';
import {
  downloadBookImportExcelTemplate,
  parseBookFile,
  parseDelimitedText,
  normalizeBookRows,
  ParsedBookRow
} from '../../services/excelTemplateService';
import { ExportDropdown } from '../../components/common/ExportDropdown';
import { LOCALIZED_COLUMNS } from '../../services/exportService';

export const BookImportExport: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<ParsedBookRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [allBooksForExport, setAllBooksForExport] = useState<any[]>([]);

  // Fetch current books for export dropdown
  React.useEffect(() => {
    fetch('/api/books?limit=2000')
      .then((res) => res.json())
      .then((data) => {
        if (data.books) setAllBooksForExport(data.books);
      })
      .catch(() => {});
  }, []);

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadBookImportExcelTemplate();
      success('Template Excel (.xlsx) Import Buku berhasil diunduh!');
    } catch (e) {
      error('Gagal mengunduh template Excel. Silakan coba lagi.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    try {
      const result = await parseBookFile(file);
      setPreviewRows(result.rows);
      setValidCount(result.totalValid);
      setInvalidCount(result.totalInvalid);

      if (result.rows.length === 0) {
        warning('File Excel/CSV tidak memiliki data baris yang dapat dibaca.');
      } else {
        success(`Berhasil membaca ${result.rows.length} baris dari "${file.name}"`);
      }
    } catch (err: any) {
      console.error(err);
      error('Gagal memproses file Excel: Pastikan format file sesuai dengan template.');
    }
  };

  const handleLoadSample = () => {
    const sampleTsv = `Judul Koleksi\tPengarang / Penulis\tNomor ISBN\tPenerbit\tTahun Terbit\tKategori Koleksi\tKode Klasifikasi (DDC)\tNomor Panggil\tJumlah Eksemplar\tLokasi Rak Fisik\tSumber Pengadaan\tJumlah Halaman\tDeskripsi / Sinopsis Singkat
Fisika untuk SMA/MA Kelas XII (Kurikulum Merdeka)\tMarthen Kanginan, M.Si.\t978-602-241-987-1\tErlangga\t2023\tSains & Matematika\t530\t530 KAN f\t5\tRak E-02 (Fisika)\tBOS Reguler\t280\tBuku teks utama pembelajaran fisika SMA kelas XII kurikulum merdeka
Sejarah Peradaban Islam Klasik hingga Modern\tProf. Dr. Badri Yatim, M.A.\t978-979-421-337-7\tRajawali Pers\t2022\tAgama & Spiritualitas\t297\t297 YAT s\t4\tRak C-01 (Agama)\tBOS Reguler\t340\tReferensi komprehensif sejarah dan dinamika peradaban Islam dunia
Laskar Pelangi\tAndrea Hirata\t978-979-3062-79-2\tBentang Pustaka\t2021\tKesusastraan & Fiksi\t813\t813 HIR l\t6\tRak B-01 (Sastra)\tHibah Alumni\t529\tNovel inspiratif tentang perjuangan pendidikan di Belitung
Biologi Sel & Molekuler Tingkat Lanjut\tDr. Subowo, M.Sc.\t978-602-8323-55-4\tAlfabeta\t2022\tSains & Matematika\t570\t570 SUB b\t3\tRak E-01 (Biologi)\tBOS Reguler\t312\tBuku penunjang olimpiade dan riset sains siswa SMA
Dasar-Dasar Pemrograman Python untuk Pemula\tJubilee Enterprise\t978-623-00-2415-3\tElex Media Komputindo\t2023\tKomputer & Teknologi Informasi\t005\t005 JUB d\t4\tRak D-02 (Informatika)\tBOS Kinerja\t216\tPanduan coding dan logika pemrograman siswa SMA`;

    setPastedText(sampleTsv);
    const raw = parseDelimitedText(sampleTsv);
    const result = normalizeBookRows(raw);
    setPreviewRows(result.rows);
    setValidCount(result.totalValid);
    setInvalidCount(result.totalInvalid);
    setSelectedFileName('Contoh Data Buku Excel');
    info('Contoh data buku telah dimuat ke dalam preview.');
  };

  const handleTextChange = (text: string) => {
    setPastedText(text);
    if (!text.trim()) {
      setPreviewRows([]);
      setValidCount(0);
      setInvalidCount(0);
      return;
    }
    const raw = parseDelimitedText(text);
    const result = normalizeBookRows(raw);
    setPreviewRows(result.rows);
    setValidCount(result.totalValid);
    setInvalidCount(result.totalInvalid);
  };

  const handleClear = () => {
    setPastedText('');
    setPreviewRows([]);
    setSelectedFileName('');
    setValidCount(0);
    setInvalidCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessImport = async () => {
    const validRows = previewRows.filter((r) => r._isValid);
    if (validRows.length === 0) {
      warning('Tidak ada baris buku yang valid untuk diimpor. Periksa kembali kolom Judul, Penulis, dan ISBN.');
      return;
    }

    setImporting(true);
    try {
      const res = await fetch('/api/books/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({ books: validRows })
      });
      const data = await res.json();
      if (res.ok) {
        success(`Selamat! Berhasil mengimpor ${data.importedCount} judul buku baru beserta eksemplar dan nomor inventaris barcode.`);
        handleClear();
      } else {
        error(data.error || 'Gagal mengimpor data buku');
      }
    } catch (e) {
      error('Terjadi kesalahan koneksi saat mengirim data impor.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Integrasi Format Microsoft Excel & CSV Perpustakaan
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Import Koleksi Bibliografi Buku (Excel)
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Daftarkan ratusan judul buku teks, vokasi, teknik, dan referensi sekaligus dengan mengunggah template Excel resmi Astra Library Politeknik Astra.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
          >
            <Download className="w-4 h-4" />
            {isDownloadingTemplate ? 'Menyiapkan...' : 'Download Template Excel (.xlsx)'}
          </button>

          <ExportDropdown
            data={allBooksForExport}
            columns={LOCALIZED_COLUMNS.books}
            filenamePrefix="katalog_seluruh_buku_politeknik_astra"
            sheetName="Katalog Buku"
            title="Katalog Bibliografi Perpustakaan Politeknik Astra"
            subtitle="Astra Library - Data Koleksi Aktif"
            label="Export Data Buku"
          />
        </div>

        {/* Decorative Background Accents */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3 Step Instruction Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-sm flex items-center justify-center shrink-0">
            1
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Unduh Template Excel</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Klik tombol hijau di atas untuk mengunduh berkas <code>.xlsx</code> resmi dengan petunjuk kolom & DDC.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center shrink-0">
            2
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Isi Data Koleksi</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Lengkapi Judul, Pengarang, ISBN, Penerbit, Tahun, dan Eksemplar. Kolom bertanda (*) bersifat wajib.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-sm flex items-center justify-center shrink-0">
            3
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload & Barcode Otomatis</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unggah file Excel Anda. Sistem akan memeriksa validitas dan mencetak nomor barcode unik secara otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Main Import Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Tab Selector */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'upload'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Unggah File Excel
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'paste'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Paste Tabel Excel
                </button>
              </div>

              <button
                onClick={handleLoadSample}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                title="Muat 5 contoh data buku"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Contoh Data
              </button>
            </div>

            {/* Upload Tab View */}
            {activeTab === 'upload' ? (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 hover:border-blue-500 dark:border-blue-900/60 dark:hover:border-blue-700 rounded-2xl p-6 text-center space-y-3 bg-blue-50/40 dark:bg-blue-950/20 cursor-pointer transition-all hover:bg-blue-50/80"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Klik atau Seret Berkas Excel / CSV ke Sini
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mendukung format Microsoft Excel <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>
                    </p>
                  </div>

                  {selectedFileName && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span className="truncate max-w-[200px]">{selectedFileName}</span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>File belum ada?</span>
                  <button
                    onClick={handleDownloadTemplate}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Unduh Template .xlsx
                  </button>
                </div>
              </div>
            ) : (
              /* Paste Tab View */
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tempel (Paste) Salinan Baris dari Excel / Spreadsheet:
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  rows={8}
                  placeholder={`Judul\tPengarang\tISBN\tPenerbit\tTahun\tKategori\tDDC...\n(Salin sel dari Microsoft Excel lalu paste di sini)`}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[11px] text-slate-400">
                  Sistem otomatis mendeteksi pemisah Tab (Excel) maupun Koma (CSV).
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleProcessImport}
                disabled={previewRows.length === 0 || validCount === 0 || importing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                {importing
                  ? 'Sedang Memproses & Menerbitkan Barcode...'
                  : `Proses Impor ${validCount} Judul Buku Valid`}
              </button>

              {previewRows.length > 0 && (
                <button
                  onClick={handleClear}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  Bersihkan Data Preview
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Preview Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Preview Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Preview Validasi Data Buku
                </h3>
                <p className="text-[11px] text-slate-400">
                  Periksa kelengkapan kolom sebelum disimpan ke database utama
                </p>
              </div>

              {previewRows.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {validCount} Siap
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold rounded-lg flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      {invalidCount} Tidak Lengkap
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Preview Table */}
            {previewRows.length === 0 ? (
              <div className="p-12 text-center space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Belum Ada Data Buku yang Dimuat
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Unggah berkas Excel (<code>.xlsx</code>) atau klik <strong>"Contoh Data"</strong> untuk melihat simulasi hasil parsing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[380px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5 w-10 text-center">No</th>
                        <th className="p-2.5">Judul Buku & Penulis</th>
                        <th className="p-2.5">ISBN</th>
                        <th className="p-2.5">DDC / Rak</th>
                        <th className="p-2.5 text-center">Eks</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={row._isValid ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40' : 'bg-rose-50/50 dark:bg-rose-950/20'}
                        >
                          <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 max-w-[200px]">
                            <p className="font-bold text-slate-900 dark:text-white truncate" title={row.title}>
                              {row.title || <span className="text-rose-500 italic">[Judul Kosong]</span>}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate" title={row.author}>
                              {row.author || <span className="text-rose-500 italic">[Penulis Kosong]</span>} • {row.publisher} ({row.publishYear})
                            </p>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {row.isbn || <span className="text-rose-500 italic">[ISBN Kosong]</span>}
                          </td>
                          <td className="p-2.5">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block text-[11px]">
                              {row.classificationCode || '000'}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[100px]">
                              {row.location}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-800 dark:text-slate-200">
                            {row.copiesCount || 1}
                          </td>
                          <td className="p-2.5 text-center">
                            {row._isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] rounded-full">
                                Valid
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-[10px] rounded-full cursor-help"
                                title={row._errors?.join(', ')}
                              >
                                Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Setiap eksemplar akan langsung didaftarkan dengan barcode inventaris berformat <code>WPL-XXXX</code> dan siap dicetak label punggungnya.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
