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
  Sparkles,
  Layers,
  BookOpen,
  Trash2
} from 'lucide-react';
import {
  downloadLoanImportExcelTemplate,
  parseLoanFile,
  ParsedLoanRow
} from '../../services/excelTemplateService';

export const LoanImport: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<ParsedLoanRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      await downloadLoanImportExcelTemplate();
      success('Template Excel (.xlsx) Import Peminjaman berhasil diunduh!');
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
      const result = await parseLoanFile(file);
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

  const handleProcessImport = async () => {
    const validRows = previewRows.filter((r) => r._isValid);
    if (validRows.length === 0) {
      warning('Tidak ada baris peminjaman yang valid untuk diimpor.');
      return;
    }

    setImporting(true);
    try {
      const res = await fetch('/api/circulation/bulk-loan-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}`
        },
        body: JSON.stringify({ loans: validRows })
      });
      const data = await res.json();
      if (res.ok) {
        success(`Berhasil mengimpor ${data.importedCount} data peminjaman.`);
        setPreviewRows([]);
        setSelectedFileName('');
        setValidCount(0);
        setInvalidCount(0);
      } else {
        error(data.error || 'Gagal mengimpor data peminjaman');
      }
    } catch (e) {
      error('Terjadi kesalahan koneksi saat mengirim data impor.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 rounded-2xl text-white shadow-lg">
        <h1 className="text-2xl font-black tracking-tight">Impor Peminjaman Massal</h1>
        <button
          onClick={handleDownloadTemplate}
          disabled={isDownloadingTemplate}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-2xl p-6 text-center cursor-pointer hover:bg-blue-50"
          >
            <Upload className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-xs font-bold">Unggah Berkas Excel / CSV</p>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            {selectedFileName && <p className="text-[11px] mt-2 text-blue-600">{selectedFileName}</p>}
          </div>

          <button
            onClick={handleProcessImport}
            disabled={previewRows.length === 0 || validCount === 0 || importing}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs"
          >
            {importing ? 'Memproses...' : `Proses Impor ${validCount} Data`}
          </button>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-bold text-slate-700">
              <tr>
                <th className="p-2">NIS/NIP</th>
                <th className="p-2">Barcode</th>
                <th className="p-2">Tgl Pinjam</th>
                <th className="p-2">Tgl Kembali</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-2">{row.memberCode}</td>
                  <td className="p-2">{row.barcode}</td>
                  <td className="p-2">{row.loanDate}</td>
                  <td className="p-2">{row.dueDate}</td>
                  <td className="p-2">
                    {row._isValid ? 'Valid' : 'Error'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
