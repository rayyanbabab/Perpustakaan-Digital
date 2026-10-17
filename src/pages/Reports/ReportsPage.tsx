import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Filter,
  BarChart3,
  BookOpen,
  Users,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import { ExportDropdown } from '../../components/common/ExportDropdown';
import { LOCALIZED_COLUMNS } from '../../services/exportService';

export const ReportsPage: React.FC = () => {
  const { user, settings } = useAuth();
  const { success, error } = useToast();
  const [reportType, setReportType] = useState<
    'circulation' | 'visitors' | 'books' | 'fines' | 'recap'
  >('circulation');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const chartData = useMemo(() => {
    if (reportType === 'circulation' && data.length > 0) {
      // Group by loan month
      const grouped: Record<string, number> = {};
      data.forEach(item => {
        const month = item.loanDate.slice(0, 7);
        grouped[month] = (grouped[month] || 0) + 1;
      });
      return Object.entries(grouped).map(([month, count]) => ({ month, count }));
    }
    return [];
  }, [reportType, data]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const url = new URL(`/api/reports/${reportType}`, window.location.origin);
      url.searchParams.append('startDate', startDate);
      url.searchParams.append('endDate', endDate);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${localStorage.getItem('widya_pustaka_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const getLocalizedReportColumns = () => {
    switch (reportType) {
      case 'circulation':
        return LOCALIZED_COLUMNS.loans;
      case 'visitors':
        return LOCALIZED_COLUMNS.visitors;
      case 'fines':
        return LOCALIZED_COLUMNS.fines;
      case 'books':
        return LOCALIZED_COLUMNS.books;
      default:
        return undefined;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Printable Screen View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Laporan Resmi Perpustakaan & Akreditasi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cetak rekapitulasi sirkulasi, data peminjam teraktif, buku terlaris, dan log denda untuk pelaporan sekolah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportDropdown
            data={data}
            columns={getLocalizedReportColumns()}
            filenamePrefix={`laporan_${reportType}_${startDate}_sd_${endDate}`}
            sheetName={`Laporan ${reportType}`}
            title={`Laporan Perpustakaan: ${reportType.toUpperCase()}`}
            subtitle={`Periode: ${startDate} s/d ${endDate} | SMA Negeri 3 Nganjuk`}
            label="Ekspor Laporan"
          />

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan Resmi (KOP Sekolah)
          </button>
        </div>
      </div>

      {/* Dashboard Summary Charts */}
      {reportType === 'circulation' && chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs print:hidden">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Tren Peminjaman Bulanan</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#2563eb" name="Jumlah Pinjaman" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setReportType('circulation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              reportType === 'circulation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Laporan Sirkulasi
          </button>
          <button
            onClick={() => setReportType('visitors')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              reportType === 'visitors'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Laporan Kunjungan
          </button>
          <button
            onClick={() => setReportType('books')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              reportType === 'books'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Statistik Koleksi Buku
          </button>
          <button
            onClick={() => setReportType('fines')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              reportType === 'fines'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Laporan Kas Denda
          </button>
          <button
            onClick={() => setReportType('recap')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              reportType === 'recap'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Rekap Eksekutif Akreditasi
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Rentang Tanggal:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
          <span className="text-slate-400">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Official Printable Document Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        {/* OFFICIAL KOP SURAT SEKOLAH */}
        <div className="border-b-4 border-double border-slate-900 dark:border-slate-100 pb-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80"
              alt="Logo SMAN 3 Nganjuk"
              className="w-16 h-16 object-cover rounded-full border border-slate-300"
            />
            <div className="text-center">
              <h4 className="text-xs font-bold tracking-widest text-slate-600 uppercase">
                PEMERINTAH PROVINSI JAWA TIMUR · DINAS PENDIDIKAN
              </h4>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight">
                {settings?.schoolName || 'SMA NEGERI 3 NGANJUK'}
              </h2>
              <h3 className="text-xs font-black text-blue-900 uppercase">
                UNIT PERPUSTAKAAN "WIDYA PUSTAKA"
              </h3>
              <p className="text-[10px] text-slate-500 font-serif">
                {settings?.address || 'Jl. Bengawan Solo 109 Begadung, Nganjuk, Jawa Timur Kode Pos 64413'} · Telp:{' '}
                {settings?.phone || '(0358) 321xxx'} · Email: {settings?.email || 'perpustakaan@sman3nganjuk.sch.id'}
              </p>
            </div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center space-y-1">
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white underline underline-offset-4">
            {reportType === 'circulation'
              ? 'LAPORAN TRANSAKSI SIRKULASI PEMINJAMAN DAN PENGEMBALIAN'
              : reportType === 'visitors'
                ? 'LAPORAN STATISTIK KUNJUNGAN PEMUSTAKA'
                : reportType === 'books'
                  ? 'LAPORAN INVENTARIS & DISTRIBUSI KOLEKSI BUKU'
                  : reportType === 'fines'
                    ? 'LAPORAN PENERIMAAN KAS DENDA KETERLAMBATAN'
                    : 'REKAPITULASI EKSEKUTIF KINERJA PERPUSTAKAAN'}
          </h3>
          <p className="text-xs text-slate-500 font-serif">
            Periode Laporan: {startDate} s/d {endDate}
          </p>
        </div>

        {/* Report Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Menyiapkan lembar laporan...</div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">Tidak ada transaksi pada periode ini.</div>
          ) : (
            <table className="w-full text-xs text-left border-collapse border border-slate-300 dark:border-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-300 dark:border-slate-700">
                <tr>
                  <th className="p-2 border border-slate-300 dark:border-slate-700 text-center w-10">No</th>
                  {reportType === 'circulation' && (
                    <>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Kode Transaksi</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Nama Peminjam</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Tipe / Kelas</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Buku Dipinjam</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Tgl Pinjam</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Tgl Kembali</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Status</th>
                    </>
                  )}
                  {reportType === 'visitors' && (
                    <>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Waktu Kunjungan</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Nama Pemustaka</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Identitas (NIS/NIP)</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Kategori</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Tujuan Kunjungan</th>
                    </>
                  )}
                  {reportType === 'fines' && (
                    <>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Kode Denda</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Nama Anggota</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Judul Buku</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Hari Terlambat</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Total Denda</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Terbayar</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Status</th>
                    </>
                  )}
                  {reportType === 'books' && (
                    <>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Judul Buku</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Pengarang</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Nomor Panggil (DDC)</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Kategori</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Total Eksemplar</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Sumber Dana</th>
                    </>
                  )}
                  {reportType === 'recap' && (
                    <>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Indikator Standar Perpustakaan</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Capaian Kuantitatif</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Satuan</th>
                      <th className="p-2 border border-slate-300 dark:border-slate-700">Keterangan Evaluasi</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-serif">
                {data.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border border-slate-300 dark:border-slate-700 text-center">{idx + 1}</td>
                    {reportType === 'circulation' && (
                      <>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold">
                          {row.loanCode}
                        </td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.memberName}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.memberType}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">
                          {row.items?.map((it: any) => it.bookTitle).join(', ')}
                        </td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.loanDate}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.returnDate || '-'}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 uppercase font-bold text-[10px]">
                          {row.status}
                        </td>
                      </>
                    )}
                    {reportType === 'visitors' && (
                      <>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">
                          {new Date(row.visitDate).toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-bold">{row.memberName}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono">{row.memberCode}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.memberType}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.purpose}</td>
                      </>
                    )}
                    {reportType === 'fines' && (
                      <>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold">
                          {row.fineCode}
                        </td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.memberName}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.bookTitle}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 text-center">{row.daysLate} hari</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-bold">
                          Rp {row.totalFine?.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-bold text-emerald-700">
                          Rp {row.paidAmount?.toLocaleString('id-ID')}
                        </td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 uppercase font-bold text-[10px]">
                          {row.status}
                        </td>
                      </>
                    )}
                    {reportType === 'books' && (
                      <>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-bold">{row.title}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.author}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono">{row.callNumber}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.category}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold">
                          {row.totalCopies}
                        </td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.source}</td>
                      </>
                    )}
                    {reportType === 'recap' && (
                      <>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 font-bold">{row.indicator}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold">
                          {row.value}
                        </td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.unit}</td>
                        <td className="p-2 border border-slate-300 dark:border-slate-700">{row.notes}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* SIGNATURE SECTION */}
        <div className="pt-8 grid grid-cols-2 text-center text-xs font-serif text-slate-900 dark:text-white">
          <div className="space-y-16">
            <p>
              Mengetahui,<br />
              <strong>Kepala SMA Negeri 3 Nganjuk</strong>
            </p>
            <div>
              <p className="font-bold underline">{settings?.headmasterName || 'Dra. Hj. Endang Sulistyowati, M.Pd.'}</p>
              <p className="text-[10px] text-slate-500 font-mono">NIP. {settings?.headmasterNip || '196705141992032008'}</p>
            </div>
          </div>

          <div className="space-y-16">
            <p>
              Nganjuk, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
              <strong>Kepala Perpustakaan Widya Pustaka</strong>
            </p>
            <div>
              <p className="font-bold underline">{settings?.headOfLibrary || 'Budi Santoso, S.Pd., M.A.'}</p>
              <p className="text-[10px] text-slate-500 font-mono">NIP. {settings?.headOfLibraryNip || '198204122008011012'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
