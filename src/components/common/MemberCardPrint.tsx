import React, { useRef } from 'react';
import { Member, LibrarySettings } from '../../types';
import { BarcodeCanvas } from './BarcodeCanvas';
import { Printer, Download, X, BookOpen } from 'lucide-react';

interface MemberCardPrintProps {
  member: Member;
  settings: LibrarySettings | null;
  onClose: () => void;
}

export const MemberCardPrint: React.FC<MemberCardPrintProps> = ({ member, settings, onClose }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
              Cetak Kartu Anggota Perpustakaan
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Cetak Kartu
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="space-y-6 flex flex-col items-center">
          {/* FRONT CARD */}
          <div
            ref={cardRef}
            className="print-member-card w-[480px] h-[280px] rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 shadow-xl border border-amber-400/40 relative flex flex-col justify-between overflow-hidden print:shadow-none print:m-0"
          >
            {/* Background Decorative Gold Crest Curves */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/10 rounded-full blur-2xl pointer-events-none print:hidden" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl pointer-events-none print:hidden" />

            {/* Top School Header */}
            <div className="flex items-center justify-between border-b border-amber-400/30 pb-2 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 flex items-center justify-center shrink-0 shadow-md print:border print:border-amber-400">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-400 font-black text-sm tracking-tighter">
                    SMAGA
                  </div>
                </div>
                <div>
                  <h4 className="font-extrabold text-xs tracking-wider text-amber-300 uppercase leading-none">
                    {settings?.schoolName || 'SMA NEGERI 3 NGANJUK'}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-200 tracking-wide mt-0.5">
                    {settings?.libraryName || 'WIDYA PUSTAKA LIBRARY SYSTEM'}
                  </p>
                  <p className="text-[8px] text-slate-400">Jl. Bengawan Solo 109 Begadung, Nganjuk</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                  {member.type}
                </span>
              </div>
            </div>

            {/* Middle Section: Photo & Details */}
            <div className="flex gap-4 items-center my-auto relative z-10">
              <div className="w-20 h-24 rounded-lg bg-slate-800 border-2 border-amber-400/60 overflow-hidden shrink-0 shadow-md flex items-center justify-center">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-xl font-bold text-amber-400">{member.name.charAt(0)}</div>
                )}
              </div>

              <div className="space-y-1 flex-1 text-xs">
                <div>
                  <div className="text-[9px] text-amber-300/80 font-medium">NAMA LENGKAP</div>
                  <div className="font-bold text-white text-sm truncate max-w-[280px]">{member.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <div className="text-[9px] text-amber-300/80 font-medium">
                      {member.type === 'SISWA' ? 'NIS / NISN' : 'NIP / ID PEGAWAI'}
                    </div>
                    <div className="font-mono font-bold text-slate-100 text-xs">
                      {member.identityNumber}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-amber-300/80 font-medium">
                      {member.type === 'SISWA' ? 'KELAS / JURUSAN' : 'JABATAN / MAPEL'}
                    </div>
                    <div className="font-semibold text-slate-100 text-xs truncate">
                      {member.type === 'SISWA'
                        ? member.classGrade || 'Siswa'
                        : member.subject || member.position || 'Guru'}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-400">
                    Masa Berlaku s/d:{' '}
                    <span className="text-amber-200 font-mono font-medium">{member.expiryDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Barcode */}
            <div className="bg-white rounded-lg px-2 py-1 flex items-center justify-between relative z-10 shadow-sm">
              <div className="flex-1 flex justify-center">
                <BarcodeCanvas
                  value={member.memberCode}
                  height={24}
                  width={1.3}
                  fontSize={10}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          {/* BACK CARD */}
          <div className="print-member-card w-[480px] h-[280px] rounded-2xl bg-slate-900 text-slate-200 p-5 shadow-xl border border-slate-800 relative flex flex-col justify-between text-xs print:shadow-none">
            <div>
              <h5 className="font-bold text-amber-400 text-xs uppercase tracking-wide border-b border-slate-800 pb-1.5 flex items-center justify-between">
                <span>TATA TERTIB PERPUSTAKAAN</span>
                <span className="text-[9px] text-slate-400 font-normal">SMA Negeri 3 Nganjuk</span>
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-[10px] text-slate-300 mt-2.5 leading-relaxed">
                <li>Kartu ini adalah bukti keanggotaan sah Perpustakaan Widya Pustaka SMAN 3 Nganjuk.</li>
                <li>Wajib membawa kartu anggota setiap meminjam, mengembalikan, atau membaca koleksi.</li>
                <li>Maksimal peminjaman: Siswa 3 buku (7 hari), Guru/Tendik 5 buku (14 hari).</li>
                <li>Keterlambatan pengembalian buku dikenakan denda sesuai peraturan yang berlaku.</li>
                <li>Dilarang merusak, mencoret, melipat, atau menghilangkan buku pustaka sekolah.</li>
                <li>Apabila kartu ini hilang, segera laporkan ke Meja Sirkulasi Perpustakaan.</li>
              </ol>
            </div>

            <div className="border-t border-slate-800 pt-2 flex items-end justify-between text-[9px] text-slate-400">
              <div>
                <p>Nganjuk, Jawa Timur</p>
                <p className="font-semibold text-slate-200">Kepala Perpustakaan SMA Negeri 3 Nganjuk</p>
                <p className="text-amber-300 font-medium mt-3">
                  {settings?.headOfLibrary || 'Dra. Endang Sulistyowati, M.Pd.'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[8px] text-slate-500">ID: {member.id}</p>
                <p className="text-amber-400/80 font-bold">WIDYA PUSTAKA</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 dark:text-slate-500">
          Tip: Gunakan kertas PVC Card standar CR80 (85.60 × 53.98 mm) atau Photo Glossy Paper untuk hasil cetak terbaik.
        </div>
      </div>
    </div>
  );
};
