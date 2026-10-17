import React, { useState, useEffect } from 'react';
import { Loan, LibrarySettings } from '../../types';
import {
  MessageCircle,
  X,
  Phone,
  Send,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  BookOpen,
  Calendar,
  ExternalLink,
  LayoutTemplate
} from 'lucide-react';

interface WhatsAppReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  settings?: LibrarySettings | null;
}

export const WhatsAppReminderModal: React.FC<WhatsAppReminderModalProps> = ({
  isOpen,
  onClose,
  loan,
  settings
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [templateType, setTemplateType] = useState<'overdue' | 'upcoming' | 'custom'>('overdue');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Calculate overdue details
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = loan?.dueDate ? new Date(loan.dueDate) : today;
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - dueDate.getTime();
  const daysLate = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isOverdue = loan?.status === 'overdue' || daysLate > 0;

  const finePerDay = settings?.finePerDay ?? 1000;
  const estimatedFine = daysLate * finePerDay;

  const libraryName = settings?.libraryName || 'Astra Library System';
  const schoolName = settings?.schoolName || 'Politeknik Astra';

  // Format book titles list
  const bookTitles = loan?.items.map((i) => `"${i.bookTitle}" (Barcode: ${i.barcode})`).join(', ') || 'Koleksi Perpustakaan';

  // Sanitize Indonesian phone numbers to 628xxx format
  const sanitizePhoneNumber = (raw: string): string => {
    let clean = raw.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    }
    return clean;
  };

  // Generate message based on template
  const generateMessage = (type: 'overdue' | 'upcoming' | 'custom') => {
    if (!loan) return '';

    const formattedDueDate = loan.dueDate
      ? new Date(loan.dueDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : '-';

    if (type === 'overdue') {
      return `Halo Sdr/i *${loan.memberName}* (${loan.memberCode}),

Kami dari *Perpustakaan ${schoolName}* ingin menginformasikan bahwa peminjaman buku berikut:
📚 *${bookTitles}*
🔖 No. Transaksi: *#${loan.loanCode}*

📅 Telah *JATUH TEMPO* pada: *${formattedDueDate}*
⚠️ Keterlambatan: *${daysLate} hari*
💰 Estimasi akumulasi denda: *Rp ${estimatedFine.toLocaleString('id-ID')}*

Mohon untuk segera mengembalikan atau memperpanjang buku ini di loket *${libraryName}* untuk menghindari penambahan denda harian.

Jika Anda telah mengembalikan buku ini, mohon abaikan pesan ini atau konfirmasikan ke petugas perpustakaan.

Terima kasih atas kerja samanya.
Salam,
*Tim Perpustakaan ${schoolName}*`;
    }

    if (type === 'upcoming') {
      return `Halo Sdr/i *${loan.memberName}* (${loan.memberCode}),

Pengingat ramah dari *Perpustakaan ${schoolName}*:
Peminjaman koleksi buku Anda:
📚 *${bookTitles}*
🔖 No. Transaksi: *#${loan.loanCode}*

📅 Akan *JATUH TEMPO* pada: *${formattedDueDate}*

Mohon pastikan buku tersebut dikembalikan tepat waktu atau lakukan perpanjangan masa pinjam sebelum tanggal jatuh tempo di loket *${libraryName}*.

Terima kasih atas perhatian dan kerja samanya.
Salam,
*Tim Perpustakaan ${schoolName}*`;
    }

    return message;
  };

  // Sync phone and message when modal opens or loan changes
  useEffect(() => {
    if (loan) {
      const initialPhone = loan.memberPhone || '';
      setPhoneNumber(initialPhone);
      setPhoneError('');
      setCopied(false);

      const defaultType = isOverdue ? 'overdue' : 'upcoming';
      setTemplateType(defaultType);
      setMessage(generateMessage(defaultType));
    }
  }, [loan, isOpen]);

  // Handle template switch
  const handleTemplateChange = (type: 'overdue' | 'upcoming' | 'custom') => {
    setTemplateType(type);
    if (type !== 'custom') {
      setMessage(generateMessage(type));
    }
  };

  const handleSendWhatsApp = () => {
    if (!phoneNumber.trim()) {
      setPhoneError('Nomor WhatsApp wajib diisi.');
      return;
    }

    const cleanPhone = sanitizePhoneNumber(phoneNumber);
    if (cleanPhone.length < 10) {
      setPhoneError('Format nomor WhatsApp tidak valid (minimal 10 digit).');
      return;
    }

    setPhoneError('');
    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    // Open WhatsApp Web or App in a new tab
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
              <MessageCircle className="w-5 h-5 fill-white text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Kirim Pengingat WhatsApp</h2>
              <p className="text-emerald-100 text-xs">Peringatan otomatis jatuh tempo & denda sirkulasi buku</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Recipient & Overdue Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pemustaka / Peminjam</p>
                <h3 className="font-bold text-slate-900 text-sm">{loan.memberName}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {loan.memberCode} · <span className="uppercase font-semibold">{loan.memberType}</span>
                </p>
              </div>

              {isOverdue ? (
                <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 shrink-0 animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Terlambat {daysLate} Hari</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Jatuh Tempo: {loan.dueDate}</span>
                </span>
              )}
            </div>

            {/* Book Item Info & Fine Estimation */}
            <div className="pt-2.5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate" title={bookTitles}>{loan.items[0]?.bookTitle || 'Buku Perpustakaan'}</span>
                {loan.items.length > 1 && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-bold shrink-0">
                    +{loan.items.length - 1}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 text-slate-700">
                <span className="text-slate-500 text-[11px]">Estimasi Denda:</span>
                <span className="font-bold font-mono text-rose-600">
                  Rp {estimatedFine.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Destination Phone Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nomor WhatsApp Tujuan</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError('');
                }}
                placeholder="Contoh: 08123456789 atau 628123456789"
                className={`w-full px-3.5 py-2.5 bg-white border ${
                  phoneError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-emerald-500'
                } rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:outline-hidden transition-all`}
              />
              {phoneNumber && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  +{sanitizePhoneNumber(phoneNumber)}
                </div>
              )}
            </div>
            {phoneError ? (
              <p className="text-[11px] text-rose-600 font-medium">{phoneError}</p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Format nomor otomatis disesuaikan ke kode negara Indonesia (+62).
              </p>
            )}
          </div>

          {/* Template Selection Tabs */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5 text-blue-600" />
              <span>Pilihan Template Pesan</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTemplateChange('overdue')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  templateType === 'overdue'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🚨 Peringatan Terlambat
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('upcoming')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  templateType === 'upcoming'
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ⏰ Pengingat Jatuh Tempo
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('custom')}
                className={`col-span-2 sm:col-span-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  templateType === 'custom'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                ✏️ Pesan Bebas
              </button>
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">Preview Pesan WhatsApp</label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setTemplateType('custom');
              }}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono leading-relaxed focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all custom-scrollbar"
              placeholder="Tulis pesan pengingat di sini..."
            />
            <p className="text-[11px] text-slate-400">
              *Teks dengan tanda bintang akan tercetak tebal di WhatsApp. Pesan dapat Anda edit sebelum dikirim.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Buka WhatsApp Web / App</span>
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
