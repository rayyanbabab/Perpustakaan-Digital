import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  GraduationCap,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  Users,
  Layers,
  UserCheck
} from 'lucide-react';
import {
  downloadMemberImportExcelTemplate,
  parseMemberFile,
  parseDelimitedText,
  normalizeMemberRows,
  ParsedMemberRow
} from '../../services/excelTemplateService';
import { ExportDropdown } from '../../components/common/ExportDropdown';
import { LOCALIZED_COLUMNS } from '../../services/exportService';

export const MemberImportExport: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<ParsedMemberRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [allMembersForExport, setAllMembersForExport] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/members?limit=2000', {
      headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.members) setAllMembersForExport(data.members);
      })
      .catch(() => {});
  }, []);

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadMemberImportExcelTemplate();
      success('Template Excel (.xlsx) Import Anggota Siswa & Guru berhasil diunduh!');
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
      const result = await parseMemberFile(file);
      setPreviewRows(result.rows);
      setValidCount(result.totalValid);
      setInvalidCount(result.totalInvalid);

      if (result.rows.length === 0) {
        warning('File Excel/CSV tidak memiliki data baris yang dapat dibaca.');
      } else {
        success(`Berhasil membaca ${result.rows.length} anggota dari "${file.name}"`);
      }
    } catch (err: any) {
      console.error(err);
      error('Gagal memproses berkas Excel: Pastikan format file sesuai template.');
    }
  };

  const handleLoadSample = () => {
    const sampleTsv = `Nama Lengkap\tTipe Anggota\tNIS / NIP / NUPTK\tJenis Kelamin (L/P)\tKelas / Rombel\tMata Pelajaran / Tugas\tNomor WhatsApp\tAlamat Email\tAlamat Domisili
Ahmad Fauzi Ramadhan\tSISWA\t202410106\tL\tKelas 10-A\t\t081234567801\tahmad.fauzi@sman3nganjuk.sch.id\tJl. Gatot Subroto No. 45, Nganjuk
Siti Nur Aini\tSISWA\t202410107\tP\tKelas 10-B\t\t081234567802\tsiti.aini@sman3nganjuk.sch.id\tKec. Sukomoro, Kab. Nganjuk
Bima Arya Pratama\tSISWA\t202310088\tL\tKelas 11-A\t\t081234567803\tbima.arya@sman3nganjuk.sch.id\tKec. Berbek, Kab. Nganjuk
Drs. Sugeng Raharjo, M.Pd.\tGURU\t197808152003121004\tL\t\tFisika & Astronomi\t081234567810\tsugeng.raharjo@sman3nganjuk.sch.id\tJl. Mastrip No. 12, Nganjuk
Dra. Hj. Sri Wahyuni, M.Pd.\tGURU\t197505102000032002\tP\t\tBahasa & Sastra Indonesia\t081234567811\tsri.wahyuni@sman3nganjuk.sch.id\tKec. Tanjunganom, Kab. Nganjuk
Bambang Eko Santoso, S.Kom.\tTENDIK\t198902142019031008\tL\t\tLaboran IT & Teknisi\t081234567820\tbambang.eko@sman3nganjuk.sch.id\tKec. Loceret, Kab. Nganjuk`;

    setPastedText(sampleTsv);
    const raw = parseDelimitedText(sampleTsv);
    const result = normalizeMemberRows(raw);
    setPreviewRows(result.rows);
    setValidCount(result.totalValid);
    setInvalidCount(result.totalInvalid);
    setSelectedFileName('Contoh Data Anggota Excel');
    info('Contoh data anggota Siswa & Guru telah dimuat ke dalam preview.');
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
    const result = normalizeMemberRows(raw);
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
      warning('Tidak ada data anggota yang valid. Pastikan kolom Nama dan NIS/NIP terisi.');
      return;
    }

    setImporting(true);
    try {
      const res = await fetch('/api/members/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({ members: validRows })
      });
      const data = await res.json();
      if (res.ok) {
        success(`Sukses! Berhasil mengimpor ${data.importedCount} akun anggota perpustakaan.`);
        handleClear();
      } else {
        error(data.error || 'Gagal mengimpor data anggota');
      }
    } catch (e) {
      error('Terjadi kesalahan jaringan saat proses impor anggota.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-800 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
            Integrasi Format Microsoft Excel Data Pemustaka
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Import Anggota Siswa, Guru & Tendik (Excel)
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
            Daftarkan seluruh mahasiswa per program studi atau dewan dosen dan tenaga kependidikan secara massal ke dalam database perpustakaan Politeknik Astra.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 active:scale-95 text-emerald-900 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            {isDownloadingTemplate ? 'Menyiapkan...' : 'Download Template Excel (.xlsx)'}
          </button>

          <ExportDropdown
            data={allMembersForExport}
            columns={LOCALIZED_COLUMNS.members}
            filenamePrefix="data_seluruh_anggota_politeknik_astra"
            sheetName="Data Anggota"
            title="Direktori Anggota Perpustakaan Politeknik Astra"
            subtitle="Astra Library - Mahasiswa, Dosen & Tendik"
            label="Export Data Anggota"
          />
        </div>

        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3 Step Instruction Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-black text-sm flex items-center justify-center shrink-0">
            1
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Unduh Template Excel</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Klik tombol putih di atas untuk mengunduh template <code>.xlsx</code> resmi dengan contoh isian Siswa & Guru.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-sm flex items-center justify-center shrink-0">
            2
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Salin Data Dapodik / Absensi</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Isi Nama Lengkap, Tipe (SISWA/GURU), NIS/NIP, Gender (L/P), dan Kelas Rombel.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center shrink-0">
            3
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload & Terbitkan Kartu</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unggah file Excel. Kartu anggota digital beserta barcode scan langsung siap digunakan di sirkulasi.
            </p>
          </div>
        </div>
      </div>

      {/* Main Import Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Tab Selector */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'upload'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Unggah File Excel
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'paste'
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Paste Tabel Excel
                </button>
              </div>

              <button
                onClick={handleLoadSample}
                className="text-xs text-teal-700 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1"
                title="Muat contoh data siswa dan guru"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                Contoh Data
              </button>
            </div>

            {/* Upload Tab View */}
            {activeTab === 'upload' ? (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-teal-300 hover:border-teal-500 dark:border-teal-900/60 dark:hover:border-teal-700 rounded-2xl p-6 text-center space-y-3 bg-teal-50/40 dark:bg-teal-950/20 cursor-pointer transition-all hover:bg-teal-50/80"
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 mx-auto flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Klik atau Seret Berkas Excel Anggota
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mendukung format Microsoft Excel <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>
                    </p>
                  </div>

                  {selectedFileName && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-teal-200 dark:border-teal-900 text-xs font-bold text-teal-800 dark:text-teal-300">
                      <FileSpreadsheet className="w-4 h-4 text-teal-600" />
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
                    className="text-teal-700 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1"
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
                  placeholder={`Nama Lengkap\tTipe\tNIS/NIP\tGender\tKelas\tMapel...\n(Salin baris siswa/guru dari Excel lalu paste di sini, contoh: Kelas 10-A)`}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
                <p className="text-[11px] text-slate-400">
                  Format teks dipisahkan dengan Tab otomatis dari tabel Excel.
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
                  ? 'Sedang Memproses Akun Anggota...'
                  : `Proses Impor ${validCount} Anggota Baru`}
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

        {/* Right Preview Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Preview Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-700" />
                  Preview Validasi Data Anggota
                </h3>
                <p className="text-[11px] text-slate-400">
                  Data yang tertera di bawah siap didaftarkan ke sistem keanggotaan
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
                      {invalidCount} Perlu Perbaikan
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Preview Table */}
            {previewRows.length === 0 ? (
              <div className="p-12 text-center space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Belum Ada Data Anggota yang Dimuat
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Unggah file Excel (<code>.xlsx</code>) atau klik <strong>"Contoh Data"</strong> untuk menguji sistem.
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
                        <th className="p-2.5">Nama Pemustaka</th>
                        <th className="p-2.5">Tipe & NIS/NIP</th>
                        <th className="p-2.5">Kelas / Mapel</th>
                        <th className="p-2.5 text-center">Gender</th>
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
                          <td className="p-2.5 max-w-[180px]">
                            <p className="font-bold text-slate-900 dark:text-white truncate" title={row.name}>
                              {row.name || <span className="text-rose-500 italic">[Nama Kosong]</span>}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate" title={row.email}>
                              {row.email}
                            </p>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`inline-block px-1.5 py-0.5 text-[10px] font-black rounded-md mr-1.5 ${
                                row.type === 'GURU'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                  : row.type === 'TENDIK'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              }`}
                            >
                              {row.type}
                            </span>
                            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {row.identityNumber || <span className="text-rose-500 italic">[NIS/NIP Kosong]</span>}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300">
                            {row.classGrade || row.subject || '-'}
                          </td>
                          <td className="p-2.5 text-center font-bold font-mono">
                            {row.gender}
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

                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900 text-[11px] text-teal-900 dark:text-teal-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>
                    Setelah diimpor, kartu anggota berformat standar CR80 (Barcode Scanner Ready) langsung dapat dicetak pada menu <strong>Data Siswa & Guru</strong>.
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
