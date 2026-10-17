import React from 'react';
import { BookItem, Book, LibrarySettings } from '../../types';
import { BarcodeCanvas } from './BarcodeCanvas';
import { Printer, X, Tag } from 'lucide-react';

interface SpineLabelPrintProps {
  book: Book;
  items: BookItem[];
  settings: LibrarySettings | null;
  onClose: () => void;
}

export const SpineLabelPrint: React.FC<SpineLabelPrintProps> = ({ book, items, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                Cetak Label Punggung & Barcode Buku
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {book.title} ({items.length} Eksemplar)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Cetak Label (A4 Grid)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Labels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="print-spine-label border-2 border-dashed border-slate-300 dark:border-slate-700 p-3 rounded-xl bg-white text-slate-900 flex flex-col justify-between items-center text-center shadow-xs print:border print:border-black print:break-inside-avoid print:p-2"
            >
              {/* Header */}
              <div className="w-full border-b border-slate-200 pb-1 mb-2">
                <div className="text-[10px] font-extrabold uppercase tracking-tight text-blue-900">
                  {settings?.schoolName || 'POLITEKNIK ASTRA'}
                </div>
                <div className="text-[8px] font-semibold text-amber-700">{settings?.shortName || 'ASTRA LIBRARY'}</div>
              </div>

              {/* Call Number / No Panggil Box */}
              <div className="my-1 py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-md w-full font-mono font-bold text-xs leading-tight tracking-wider text-slate-800">
                <div>{book.classificationCode}</div>
                <div>{book.author.slice(0, 3).toUpperCase()}</div>
                <div>{book.title[0]?.toLowerCase()}</div>
              </div>

              {/* Barcode & Inventory Code */}
              <div className="w-full flex flex-col items-center mt-2 pt-1 border-t border-slate-100">
                <BarcodeCanvas
                  value={item.barcode}
                  height={22}
                  width={1.2}
                  fontSize={9}
                  className="h-9"
                />
                <div className="text-[8px] font-mono text-slate-500 mt-0.5">{item.inventoryNumber}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-slate-400">
          Format label ini siap ditempelkan pada punggung fisik buku (Spine Label) dan bagian dalam sampul depan.
        </div>
      </div>
    </div>
  );
};
