import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from 'lucide-react';
import { exportToCsv, exportToExcel, ExportColumn, ExportOptions } from '../../services/exportService';
import { useToast } from '../../context/ToastContext';

interface ExportDropdownProps<T = any> {
  data: T[];
  columns?: ExportColumn<T>[];
  filenamePrefix: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const ExportDropdown = <T extends any>({
  data,
  columns,
  filenamePrefix,
  sheetName,
  title,
  subtitle,
  label = 'Export',
  className = '',
  disabled = false
}: ExportDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastExported, setLastExported] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { success, warning } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCsv = () => {
    if (!data || data.length === 0) {
      warning('Tidak ada data untuk diekspor.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const filename = `${filenamePrefix}_${today}.csv`;
    const res = exportToCsv(data, {
      filename,
      columns,
      title
    });
    if (res) {
      setLastExported('csv');
      success(`Data berhasil diekspor ke ${filename} (${data.length} baris)`);
    }
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      warning('Tidak ada data untuk diekspor.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const filename = `${filenamePrefix}_${today}.xls`;
    const res = exportToExcel(data, {
      filename,
      sheetName: sheetName || filenamePrefix.slice(0, 25),
      title: title || `Ekspor Data ${filenamePrefix}`,
      subtitle: subtitle || `Diekspor dari Astra Library Politeknik Astra - Total: ${data.length} data`,
      columns
    });
    if (res) {
      setLastExported('excel');
      success(`Data berhasil diekspor ke format Excel ${filename} (${data.length} baris)`);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled || data.length === 0}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed`}
        title={`Export ${data.length} data`}
      >
        <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>{label}</span>
        {data.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono rounded-md font-semibold">
            {data.length}
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            Pilihan Format Ekspor
          </div>

          <button
            onClick={handleExportExcel}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center justify-between font-medium transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold leading-tight text-xs">Microsoft Excel</p>
                <p className="text-[10px] text-slate-400">Format .XLS / Spreadsheet</p>
              </div>
            </div>
            {lastExported === 'excel' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>

          <button
            onClick={handleExportCsv}
            className="w-full text-left px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-400 flex items-center justify-between font-medium transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold leading-tight text-xs">CSV Text (BOM UTF-8)</p>
                <p className="text-[10px] text-slate-400">Kompatibel Universal</p>
              </div>
            </div>
            {lastExported === 'csv' && <Check className="w-3.5 h-3.5 text-blue-600" />}
          </button>

          <div className="px-3 py-1.5 text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-800 italic">
            Headers kolom otomatis dilokalisasi dalam Bahasa Indonesia.
          </div>
        </div>
      )}
    </div>
  );
};
