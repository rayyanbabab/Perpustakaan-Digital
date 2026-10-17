/**
 * Export Utility Service
 * Provides centralized, localized CSV and Excel (.xls/XML) export capabilities
 * for Astra Library Management System.
 */

export interface ExportColumn<T = any> {
  key: keyof T | string;
  header: string; // Localized Indonesian header
  formatter?: (value: any, item: T) => string | number;
  width?: number; // Approximate Excel column width
}

export interface ExportOptions<T = any> {
  filename?: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  columns?: ExportColumn<T>[];
  delimiter?: ',' | ';';
}

/**
 * Standard Localized Column Dictionaries for Tables in Astra Library
 */
export const LOCALIZED_COLUMNS = {
  books: [
    { key: 'isbn', header: 'ISBN / ISSN' },
    { key: 'title', header: 'Judul Koleksi' },
    { key: 'author', header: 'Pengarang / Penulis' },
    { key: 'publisher', header: 'Penerbit' },
    { key: 'publishYear', header: 'Tahun Terbit' },
    { key: 'category', header: 'Kategori Koleksi' },
    { key: 'classificationCode', header: 'Kode Klasifikasi (DDC)' },
    { key: 'callNumber', header: 'Nomor Panggil' },
    { key: 'location', header: 'Lokasi Rak Fisik' },
    { key: 'totalCopies', header: 'Total Eksemplar' },
    { key: 'availableCopies', header: 'Eksemplar Tersedia' },
    { key: 'source', header: 'Sumber Pengadaan' }
  ],
  members: [
    { key: 'memberCode', header: 'Kode Anggota' },
    { key: 'identityNumber', header: 'NIS / NIP' },
    { key: 'name', header: 'Nama Lengkap' },
    { key: 'type', header: 'Tipe Keanggotaan' },
    { key: 'gender', header: 'Jenis Kelamin', formatter: (val: string) => (val === 'L' ? 'Laki-laki' : 'Perempuan') },
    { key: 'classGrade', header: 'Kelas / Rombel' },
    { key: 'subject', header: 'Mata Pelajaran / Tugas' },
    { key: 'phone', header: 'Nomor WhatsApp / HP' },
    { key: 'email', header: 'Alamat Email' },
    { key: 'status', header: 'Status Akun', formatter: (val: string) => (val === 'active' ? 'Aktif' : 'Nonaktif') },
    { key: 'registeredDate', header: 'Tanggal Terdaftar' },
    { key: 'expiryDate', header: 'Masa Berlaku Kartu' }
  ],
  loans: [
    { key: 'loanCode', header: 'Kode Peminjaman' },
    { key: 'memberCode', header: 'Kode Anggota' },
    { key: 'memberName', header: 'Nama Peminjam' },
    { key: 'memberType', header: 'Tipe Anggota' },
    {
      key: 'items',
      header: 'Daftar Buku',
      formatter: (items: any[]) => (Array.isArray(items) ? items.map((i) => `${i.bookTitle} [${i.barcode}]`).join(' | ') : '')
    },
    { key: 'loanDate', header: 'Tanggal Peminjaman' },
    { key: 'dueDate', header: 'Batas Jatuh Tempo' },
    { key: 'returnDate', header: 'Tanggal Pengembalian', formatter: (val: string) => val || '-' },
    {
      key: 'status',
      header: 'Status Sirkulasi',
      formatter: (val: string) => (val === 'active' ? 'Dipinjam' : val === 'returned' ? 'Dikembalikan' : 'Terlambat')
    },
    { key: 'extensionCount', header: 'Jumlah Perpanjangan' },
    { key: 'officerName', header: 'Petugas Sirkulasi' }
  ],
  fines: [
    { key: 'fineCode', header: 'Kode Transaksi Denda' },
    { key: 'memberCode', header: 'Kode Anggota' },
    { key: 'memberName', header: 'Nama Anggota' },
    { key: 'bookTitle', header: 'Judul Buku Terkait' },
    { key: 'barcode', header: 'Barcode Eksemplar' },
    { key: 'daysLate', header: 'Keterlambatan (Hari)' },
    {
      key: 'totalFine',
      header: 'Total Nominal Denda (Rp)',
      formatter: (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`
    },
    {
      key: 'paidAmount',
      header: 'Nominal Terbayar (Rp)',
      formatter: (val: number) => `Rp ${(val || 0).toLocaleString('id-ID')}`
    },
    {
      key: 'status',
      header: 'Status Pembayaran',
      formatter: (val: string) => (val === 'paid' ? 'Lunas' : val === 'unpaid' ? 'Belum Bayar' : 'Sebagian')
    },
    { key: 'reason', header: 'Alasan Denda' },
    { key: 'createdAt', header: 'Waktu Transaksi', formatter: (val: string) => (val ? new Date(val).toLocaleString('id-ID') : '-') }
  ],
  visitors: [
    { key: 'visitDate', header: 'Waktu Kunjungan', formatter: (val: string) => (val ? new Date(val).toLocaleString('id-ID') : '-') },
    { key: 'memberCode', header: 'Kode Anggota / ID' },
    { key: 'memberName', header: 'Nama Pemustaka' },
    { key: 'memberType', header: 'Kategori / Tipe' },
    { key: 'classGrade', header: 'Kelas / Instansi' },
    { key: 'purpose', header: 'Tujuan Kunjungan' }
  ],
  activityLogs: [
    { key: 'timestamp', header: 'Waktu Aktivitas', formatter: (val: string) => (val ? new Date(val).toLocaleString('id-ID') : '-') },
    { key: 'username', header: 'Username Akun' },
    { key: 'role', header: 'Role / Jabatan', formatter: (val: string) => val.toUpperCase() },
    { key: 'module', header: 'Modul Sistem' },
    { key: 'action', header: 'Tindakan (Aksi)' },
    { key: 'description', header: 'Deskripsi Detail Aktivitas' },
    { key: 'ipAddress', header: 'Alamat IP' }
  ],
  stockOpname: [
    { key: 'barcode', header: 'Barcode Buku' },
    { key: 'bookTitle', header: 'Judul Koleksi' },
    { key: 'expectedLocation', header: 'Lokasi Rak Terdaftar' },
    { key: 'scannedLocation', header: 'Lokasi Rak Fisik Ditemukan' },
    { key: 'scannedAt', header: 'Waktu Pemindaian', formatter: (val: string) => (val ? new Date(val).toLocaleString('id-ID') : '-') },
    { key: 'condition', header: 'Kondisi Fisik' },
    { key: 'status', header: 'Status Inventaris' },
    { key: 'officer', header: 'Petugas Pemeriksa' }
  ],
  users: [
    { key: 'fullName', header: 'Nama Lengkap' },
    { key: 'username', header: 'Username' },
    { key: 'email', header: 'Email Akun' },
    { key: 'role', header: 'Hak Akses (Role)', formatter: (val: string) => val?.toUpperCase() },
    { key: 'isActive', header: 'Status Akun', formatter: (val: boolean) => (val ? 'Aktif' : 'Nonaktif') },
    { key: 'lastLogin', header: 'Terakhir Login', formatter: (val: string) => (val ? new Date(val).toLocaleString('id-ID') : 'Belum pernah') },
    { key: 'createdAt', header: 'Tanggal Dibuat', formatter: (val: string) => (val ? new Date(val).toLocaleDateString('id-ID') : '-') }
  ],
  studentAccounts: [
    { key: 'nis', header: 'NIS / NIP' },
    { key: 'fullName', header: 'Nama Lengkap Siswa' },
    { key: 'classGrade', header: 'Kelas / Rombel' },
    { key: 'username', header: 'Username Login' },
    { key: 'plainPassword', header: 'Password Default' },
    { key: 'email', header: 'Email Akun' },
    { key: 'status', header: 'Status Pembuatan', formatter: (val: string) => (val === 'created' ? 'Akun Baru' : val === 'updated' ? 'Password Direset' : 'Sudah Ada') }
  ]
};

/**
 * Format and extract a value from a record using columns specification
 */
function extractRowData<T>(item: T, columns: ExportColumn<T>[]): string[] {
  return columns.map((col) => {
    const rawVal = (item as any)[col.key];
    let val: any;
    if (col.formatter) {
      val = col.formatter(rawVal, item);
    } else if (rawVal === null || rawVal === undefined) {
      val = '';
    } else if (typeof rawVal === 'object') {
      val = Array.isArray(rawVal) ? rawVal.join(', ') : JSON.stringify(rawVal);
    } else {
      val = String(rawVal);
    }
    return String(val ?? '');
  });
}

/**
 * Infer default column configuration from object keys if not explicitly provided
 */
function inferColumns<T>(data: T[]): ExportColumn<T>[] {
  if (data.length === 0) return [];
  const first = data[0] as Record<string, any>;
  return Object.keys(first).map((key) => ({
    key,
    header: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
  }));
}

/**
 * Export data array to CSV with UTF-8 BOM for full Indonesian/Unicode compatibility
 */
export function exportToCsv<T = any>(data: T[], options: ExportOptions<T> = {}): boolean {
  if (!data || data.length === 0) {
    console.warn('Export to CSV: No data to export');
    return false;
  }

  const columns = options.columns || inferColumns(data);
  const delimiter = options.delimiter || ',';
  const filename = options.filename || `export_${new Date().toISOString().slice(0, 10)}.csv`;

  // Build CSV Header line
  const headerLine = columns
    .map((col) => `"${col.header.replace(/"/g, '""')}"`)
    .join(delimiter);

  // Build CSV Data rows
  const dataLines = data.map((item) => {
    const rowValues = extractRowData(item, columns);
    return rowValues
      .map((val) => `"${val.replace(/"/g, '""')}"`)
      .join(delimiter);
  });

  const fullCsv = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');

  // Trigger download
  const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
  return true;
}

/**
 * Export data array to Microsoft Excel compatible HTML/XML Spreadsheet (.xls)
 * Includes proper Indonesian locale styling, header styling, title block, and grid borders.
 */
export function exportToExcel<T = any>(data: T[], options: ExportOptions<T> = {}): boolean {
  if (!data || data.length === 0) {
    console.warn('Export to Excel: No data to export');
    return false;
  }

  const columns = options.columns || inferColumns(data);
  const sheetName = options.sheetName || 'Data Perpustakaan';
  const title = options.title || 'Laporan Data Sistem Astra Library';
  const subtitle = options.subtitle || `Diekspor pada: ${new Date().toLocaleString('id-ID')} | Politeknik Astra`;
  const filename = options.filename || `export_${new Date().toISOString().slice(0, 10)}.xls`;

  // Build Excel Table HTML
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${sheetName.replace(/[:\\/?*\[\]]/g, '')}</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; }
        .title-row { font-size: 15pt; font-weight: bold; color: #1E3A8A; text-align: left; height: 32px; }
        .subtitle-row { font-size: 10pt; color: #64748b; font-style: italic; text-align: left; height: 22px; }
        .empty-row { height: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th {
          background-color: #1E3A8A;
          color: #ffffff;
          font-weight: bold;
          text-align: left;
          padding: 8px 12px;
          border: 1px solid #0f245a;
          white-space: nowrap;
        }
        td {
          padding: 6px 10px;
          border: 1px solid #cbd5e1;
          vertical-align: middle;
        }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .num-format { mso-number-format: "\\#\\,\\#\\#0"; }
        .currency-format { mso-number-format: "\\Rp\\#\\,\\#\\#0"; }
        .date-format { mso-number-format: "yyyy\\-mm\\-dd"; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${columns.length}" class="title-row">${escapeHtml(title)}</td>
        </tr>
        <tr>
          <td colspan="${columns.length}" class="subtitle-row">${escapeHtml(subtitle)}</td>
        </tr>
        <tr class="empty-row"><td colspan="${columns.length}"></td></tr>
        <thead>
          <tr>
            ${columns.map((col) => `<th>${escapeHtml(col.header)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  data.forEach((item) => {
    const rowValues = extractRowData(item, columns);
    html += '<tr>';
    rowValues.forEach((val) => {
      // Check if numeric or currency
      const isNum = !isNaN(Number(val)) && val.trim() !== '';
      const isCur = val.startsWith('Rp ');
      const alignClass = isCur || isNum ? 'text-right' : '';
      html += `<td class="${alignClass}">${escapeHtml(val)}</td>`;
    });
    html += '</tr>';
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename : `${filename}.xls`);
  return true;
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Trigger file download via invisible link
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
