import React from 'react';
import { Loan, Fine, LibrarySettings } from '../../types';
import { Printer, X, Receipt } from 'lucide-react';
import { BarcodeCanvas } from './BarcodeCanvas';

interface ReceiptPrintProps {
  type: 'loan' | 'return' | 'fine';
  loan?: Loan;
  fine?: Fine;
  settings: LibrarySettings | null;
  onClose: () => void;
}

export const ReceiptPrint: React.FC<ReceiptPrintProps> = ({ type, loan, fine, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              {type === 'loan' ? 'Struk Peminjaman Buku' : type === 'return' ? 'Bukti Pengembalian Buku' : 'Bukti Pembayaran Denda'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt (80mm Width Look) */}
        <div className="print-thermal-receipt bg-white text-slate-900 p-5 rounded-xl border border-slate-200 font-mono text-xs shadow-inner space-y-3 print:border-none print:shadow-none print:m-0 print:p-0">
          {/* School Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3">
            <h4 className="font-bold text-sm uppercase tracking-tight">{settings?.schoolName || 'SMA NEGERI 3 NGANJUK'}</h4>
            <p className="text-[10px] font-semibold text-slate-700">{settings?.libraryName || 'WIDYA PUSTAKA LIBRARY SYSTEM'}</p>
            <p className="text-[9px] text-slate-500">{settings?.address || 'Jl. Bengawan Solo 109 Begadung, Nganjuk'}</p>
            <p className="text-[9px] text-slate-500">{settings?.phone || '(0358) 321855'}</p>
          </div>

          {/* Transaction Meta */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
            {loan && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Transaksi:</span>
                  <span className="font-bold">{loan.loanCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span>{loan.loanDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jatuh Tempo:</span>
                  <span className="font-bold text-rose-600">{loan.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Anggota:</span>
                  <span className="font-semibold">{loan.memberName} ({loan.memberCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas:</span>
                  <span>{loan.officerName}</span>
                </div>
              </>
            )}

            {fine && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Denda:</span>
                  <span className="font-bold">{fine.fineCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span>{fine.createdAt.slice(0, 10)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Anggota:</span>
                  <span className="font-semibold">{fine.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold uppercase text-emerald-700">{fine.status}</span>
                </div>
              </>
            )}
          </div>

          {/* Item List */}
          {loan && (
            <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
              <div className="text-[10px] font-bold uppercase text-slate-500">Daftar Buku Dipinjam:</div>
              {loan.items.map((item, idx) => (
                <div key={idx} className="text-[11px] leading-tight">
                  <div className="font-bold">{idx + 1}. {item.bookTitle}</div>
                  <div className="text-[9px] text-slate-500 flex justify-between">
                    <span>Barcode: {item.barcode}</span>
                    <span>No.Panggil: {item.callNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fine && (
            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 text-[11px]">
              <div className="font-bold">{fine.bookTitle}</div>
              <div className="text-[10px] text-slate-500">Barcode: {fine.barcode}</div>
              <div className="flex justify-between pt-1">
                <span>Alasan:</span>
                <span>{fine.reason} ({fine.daysLate} hari)</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                <span>Total Denda:</span>
                <span>Rp {fine.totalFine.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Dibayar:</span>
                <span>Rp {fine.paidAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          {/* Footer Barcode & Notes */}
          <div className="text-center pt-1 space-y-2">
            <div className="flex justify-center">
              <BarcodeCanvas
                value={loan ? loan.loanCode : fine ? fine.fineCode : 'WPL-TRANSACTION'}
                height={22}
                width={1.1}
                fontSize={9}
                className="h-8"
              />
            </div>
            <p className="text-[9px] text-slate-500 italic">
              "Membaca, Mengelola, Menginspirasi" - Harap simpan struk ini sebagai bukti transaksi yang sah.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
