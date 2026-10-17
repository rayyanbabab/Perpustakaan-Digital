import ExcelJS from 'exceljs';

/**
 * Interface for parsed Book row from Excel or CSV
 */
export interface ParsedBookRow {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publishYear: number | string;
  category: string;
  classificationCode?: string;
  callNumber?: string;
  copiesCount?: number | string;
  totalCopies?: number | string;
  location?: string;
  defaultLocation?: string;
  source?: string;
  price?: number | string;
  pages?: number | string;
  description?: string;
  _rowNumber?: number;
  _isValid?: boolean;
  _errors?: string[];
}

/**
 * Interface for parsed Member row from Excel or CSV
 */
export interface ParsedMemberRow {
  name: string;
  type: 'SISWA' | 'GURU' | 'TENDIK' | string;
  identityNumber: string; // NIS / NIP
  gender: 'L' | 'P' | string;
  classGrade?: string; // e.g. "X-E 1"
  subject?: string; // e.g. "Fisika"
  phone?: string;
  email?: string;
  address?: string;
  _rowNumber?: number;
  _isValid?: boolean;
  _errors?: string[];
}

/**
 * Download stylized Excel (.xlsx) Template for Book Bulk Import
 */
export async function downloadBookImportExcelTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Widya Pustaka SMAN 3 Nganjuk';
  workbook.created = new Date();

  // 1. DATA SHEET
  const sheet = workbook.addWorksheet('Template Data Buku', {
    views: [{ showGridLines: true }]
  });

  // Define Columns
  sheet.columns = [
    { header: 'Judul Koleksi *', key: 'title', width: 34 },
    { header: 'Pengarang / Penulis *', key: 'author', width: 28 },
    { header: 'Nomor ISBN *', key: 'isbn', width: 22 },
    { header: 'Penerbit *', key: 'publisher', width: 22 },
    { header: 'Tahun Terbit *', key: 'publishYear', width: 14 },
    { header: 'Kategori Koleksi *', key: 'category', width: 26 },
    { header: 'Kode Klasifikasi (DDC)', key: 'classificationCode', width: 22 },
    { header: 'Nomor Panggil', key: 'callNumber', width: 18 },
    { header: 'Jumlah Eksemplar', key: 'copiesCount', width: 18 },
    { header: 'Lokasi Rak Fisik', key: 'location', width: 24 },
    { header: 'Sumber Pengadaan', key: 'source', width: 18 },
    { header: 'Jumlah Halaman', key: 'pages', width: 16 },
    { header: 'Deskripsi / Sinopsis Singkat', key: 'description', width: 40 }
  ];

  // Style Header Row
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Navy Blue
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF0F172A' } }
    };
  });

  // Add Rich Sample Data for SMAN 3 Nganjuk
  const sampleBooks = [
    {
      title: 'Fisika untuk SMA/MA Kelas XII (Kurikulum Merdeka)',
      author: 'Marthen Kanginan, M.Si.',
      isbn: '978-602-241-987-1',
      publisher: 'Erlangga',
      publishYear: 2023,
      category: 'Sains & Matematika',
      classificationCode: '530',
      callNumber: '530 KAN f',
      copiesCount: 5,
      location: 'Rak E-02 (Fisika)',
      source: 'BOS Reguler',
      pages: 280,
      description: 'Buku teks utama pembelajaran fisika SMA kelas XII kurikulum merdeka'
    },
    {
      title: 'Sejarah Peradaban Islam Klasik hingga Modern',
      author: 'Prof. Dr. Badri Yatim, M.A.',
      isbn: '978-979-421-337-7',
      publisher: 'Rajawali Pers',
      publishYear: 2022,
      category: 'Agama & Spiritualitas',
      classificationCode: '297',
      callNumber: '297 YAT s',
      copiesCount: 4,
      location: 'Rak C-01 (Agama)',
      source: 'BOS Reguler',
      pages: 340,
      description: 'Referensi komprehensif sejarah dan dinamika peradaban Islam dunia'
    },
    {
      title: 'Laskar Pelangi',
      author: 'Andrea Hirata',
      isbn: '978-979-3062-79-2',
      publisher: 'Bentang Pustaka',
      publishYear: 2021,
      category: 'Kesusastraan & Fiksi',
      classificationCode: '813',
      callNumber: '813 HIR l',
      copiesCount: 6,
      location: 'Rak B-01 (Sastra)',
      source: 'Hibah Alumni',
      pages: 529,
      description: 'Novel inspiratif tentang perjuangan pendidikan di Belitung'
    },
    {
      title: 'Biologi Sel & Molekuler Tingkat Lanjut',
      author: 'Dr. Subowo, M.Sc.',
      isbn: '978-602-8323-55-4',
      publisher: 'Alfabeta',
      publishYear: 2022,
      category: 'Sains & Matematika',
      classificationCode: '570',
      callNumber: '570 SUB b',
      copiesCount: 3,
      location: 'Rak E-01 (Biologi)',
      source: 'BOS Reguler',
      pages: 312,
      description: 'Buku penunjang olimpiade dan riset sains siswa SMA'
    },
    {
      title: 'Dasar-Dasar Pemrograman Python untuk Pemula',
      author: 'Jubilee Enterprise',
      isbn: '978-623-00-2415-3',
      publisher: 'Elex Media Komputindo',
      publishYear: 2023,
      category: 'Komputer & Teknologi Informasi',
      classificationCode: '005',
      callNumber: '005 JUB d',
      copiesCount: 4,
      location: 'Rak D-02 (Informatika)',
      source: 'BOS Kinerja',
      pages: 216,
      description: 'Panduan coding dan logika pemrograman siswa SMA'
    }
  ];

  sampleBooks.forEach((book) => {
    const row = sheet.addRow(book);
    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      if (colNumber === 5 || colNumber === 9 || colNumber === 12) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { vertical: 'middle' };
      }
    });
  });

  // 2. GUIDE SHEET
  const guideSheet = workbook.addWorksheet('Petunjuk Pengisian');
  guideSheet.columns = [
    { header: 'Nama Kolom', key: 'colName', width: 28 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Format / Ketentuan', key: 'rules', width: 35 },
    { header: 'Contoh Isian', key: 'example', width: 35 }
  ];

  const guideHeaderRow = guideSheet.getRow(1);
  guideHeaderRow.height = 26;
  guideHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF166534' } // Dark Green
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const guideRows = [
    { colName: 'Judul Koleksi', status: 'WAJIB', rules: 'Teks lengkap judul buku utama', example: 'Fisika SMA Kelas XII' },
    { colName: 'Pengarang / Penulis', status: 'WAJIB', rules: 'Nama penulis lengkap dengan gelar', example: 'Marthen Kanginan' },
    { colName: 'Nomor ISBN', status: 'WAJIB', rules: 'Nomor ISBN 10 atau 13 digit (unik)', example: '978-602-241-987-1' },
    { colName: 'Penerbit', status: 'WAJIB', rules: 'Nama penerbit resmi buku', example: 'Erlangga / Balai Pustaka' },
    { colName: 'Tahun Terbit', status: 'WAJIB', rules: 'Angka 4 digit tahun terbit', example: '2023' },
    { colName: 'Kategori Koleksi', status: 'WAJIB', rules: 'Pilih kategori sesuai DDC', example: 'Sains & Matematika / Kesusastraan' },
    { colName: 'Kode Klasifikasi (DDC)', status: 'Opsional', rules: '3 digit angka Dewey Decimal', example: '530 / 813 / 297 / 005' },
    { colName: 'Nomor Panggil', status: 'Opsional', rules: 'Kode DDC + 3 huruf pengarang + 1 huruf judul', example: '530 KAN f' },
    { colName: 'Jumlah Eksemplar', status: 'Opsional', rules: 'Angka jumlah copy fisik buku (default: 1)', example: '5' },
    { colName: 'Lokasi Rak Fisik', status: 'Opsional', rules: 'Nama rak / zona penyimpanan', example: 'Rak E-02 (Fisika)' },
    { colName: 'Sumber Pengadaan', status: 'Opsional', rules: 'BOS Reguler / BOS Kinerja / Hibah / Bantuan', example: 'BOS Reguler' },
    { colName: 'Jumlah Halaman', status: 'Opsional', rules: 'Angka ketebalan halaman', example: '280' },
    { colName: 'Deskripsi / Sinopsis', status: 'Opsional', rules: 'Ringkasan singkat isi buku', example: 'Buku pegangan siswa kelas XII' }
  ];

  guideRows.forEach((item) => {
    const row = guideSheet.addRow(item);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      if (colNumber === 2) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: item.status === 'WAJIB' ? 'FFDC2626' : 'FF166534' }
        };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerExcelDownload(buffer, `template_import_buku_sman3nganjuk.xlsx`);
}

/**
 * Download stylized Excel (.xlsx) Template for Member Bulk Import
 */
export async function downloadMemberImportExcelTemplate(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Widya Pustaka SMAN 3 Nganjuk';
  workbook.created = new Date();

  // 1. DATA SHEET
  const sheet = workbook.addWorksheet('Template Data Anggota', {
    views: [{ showGridLines: true }]
  });

  sheet.columns = [
    { header: 'Nama Lengkap *', key: 'name', width: 32 },
    { header: 'Tipe Anggota *', key: 'type', width: 18 },
    { header: 'NIS / NIP / NUPTK *', key: 'identityNumber', width: 24 },
    { header: 'Jenis Kelamin (L/P) *', key: 'gender', width: 20 },
    { header: 'Kelas / Rombel (Khusus Siswa)', key: 'classGrade', width: 26 },
    { header: 'Mata Pelajaran / Tugas Guru', key: 'subject', width: 28 },
    { header: 'Nomor WhatsApp / HP', key: 'phone', width: 22 },
    { header: 'Alamat Email', key: 'email', width: 32 },
    { header: 'Alamat Domisili', key: 'address', width: 34 }
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' } // Emerald / Teal
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF134E4A' } },
      left: { style: 'thin', color: { argb: 'FF134E4A' } },
      bottom: { style: 'medium', color: { argb: 'FF134E4A' } },
      right: { style: 'thin', color: { argb: 'FF134E4A' } }
    };
  });

  // Add rich samples for SMAN 3 Nganjuk (Siswa and Guru)
  const sampleMembers = [
    {
      name: 'Ahmad Fauzi Ramadhan',
      type: 'SISWA',
      identityNumber: '202410106',
      gender: 'L',
      classGrade: 'X-E 1',
      subject: '',
      phone: '081234567801',
      email: 'ahmad.fauzi@sman3nganjuk.sch.id',
      address: 'Jl. Gatot Subroto No. 45, Nganjuk'
    },
    {
      name: 'Siti Nur Aini',
      type: 'SISWA',
      identityNumber: '202410107',
      gender: 'P',
      classGrade: 'X-E 2',
      subject: '',
      phone: '081234567802',
      email: 'siti.aini@sman3nganjuk.sch.id',
      address: 'Kec. Sukomoro, Kab. Nganjuk'
    },
    {
      name: 'Bima Arya Pratama',
      type: 'SISWA',
      identityNumber: '202310088',
      gender: 'L',
      classGrade: 'XI-F 1',
      subject: '',
      phone: '081234567803',
      email: 'bima.arya@sman3nganjuk.sch.id',
      address: 'Kec. Berbek, Kab. Nganjuk'
    },
    {
      name: 'Drs. Sugeng Raharjo, M.Pd.',
      type: 'GURU',
      identityNumber: '197808152003121004',
      gender: 'L',
      classGrade: '',
      subject: 'Fisika & Astronomi',
      phone: '081234567810',
      email: 'sugeng.raharjo@sman3nganjuk.sch.id',
      address: 'Jl. Mastrip No. 12, Nganjuk'
    },
    {
      name: 'Dra. Hj. Sri Wahyuni, M.Pd.',
      type: 'GURU',
      identityNumber: '197505102000032002',
      gender: 'P',
      classGrade: '',
      subject: 'Bahasa & Sastra Indonesia',
      phone: '081234567811',
      email: 'sri.wahyuni@sman3nganjuk.sch.id',
      address: 'Kec. Tanjunganom, Kab. Nganjuk'
    },
    {
      name: 'Bambang Eko Santoso, S.Kom.',
      type: 'TENDIK',
      identityNumber: '198902142019031008',
      gender: 'L',
      classGrade: '',
      subject: 'Laboran IT & Teknisi',
      phone: '081234567820',
      email: 'bambang.eko@sman3nganjuk.sch.id',
      address: 'Kec. Loceret, Kab. Nganjuk'
    }
  ];

  sampleMembers.forEach((mem) => {
    const row = sheet.addRow(mem);
    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      if (colNumber === 2 || colNumber === 4 || colNumber === 5) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { vertical: 'middle' };
      }
    });
  });

  // 2. GUIDE SHEET
  const guideSheet = workbook.addWorksheet('Petunjuk Pengisian');
  guideSheet.columns = [
    { header: 'Nama Kolom', key: 'colName', width: 28 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Format / Ketentuan', key: 'rules', width: 35 },
    { header: 'Contoh Isian', key: 'example', width: 35 }
  ];

  const guideHeaderRow = guideSheet.getRow(1);
  guideHeaderRow.height = 26;
  guideHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF166534' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const guideRows = [
    { colName: 'Nama Lengkap', status: 'WAJIB', rules: 'Nama lengkap siswa/guru', example: 'Ahmad Fauzi / Drs. Sugeng' },
    { colName: 'Tipe Anggota', status: 'WAJIB', rules: 'Ketik: SISWA atau GURU atau TENDIK', example: 'SISWA' },
    { colName: 'NIS / NIP / NUPTK', status: 'WAJIB', rules: 'Nomor induk unik tanpa spasi', example: '202410106 / 197808152003121004' },
    { colName: 'Jenis Kelamin', status: 'WAJIB', rules: 'Ketik: L (Laki-laki) atau P (Perempuan)', example: 'L atau P' },
    { colName: 'Kelas / Rombel', status: 'Wajib Siswa', rules: 'Nama rombongan belajar kelas', example: 'X-E 1, XI-F 2, XII-MIPA 1' },
    { colName: 'Mata Pelajaran / Tugas', status: 'Wajib Guru', rules: 'Mata pelajaran yang diampu guru', example: 'Fisika / Matematika / BK' },
    { colName: 'Nomor WhatsApp / HP', status: 'Opsional', rules: 'Nomor kontak aktif pemustaka', example: '081234567890' },
    { colName: 'Alamat Email', status: 'Opsional', rules: 'Email resmi sekolah / pribadi', example: 'nama@sman3nganjuk.sch.id' },
    { colName: 'Alamat Domisili', status: 'Opsional', rules: 'Alamat tempat tinggal', example: 'Jl. Mastrip, Nganjuk' }
  ];

  guideRows.forEach((item) => {
    const row = guideSheet.addRow(item);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      if (colNumber === 2) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: item.status.includes('WAJIB') ? 'FFDC2626' : 'FF166534' }
        };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerExcelDownload(buffer, `template_import_anggota_sman3nganjuk.xlsx`);
}

/**
 * Universal Excel / CSV Reader for Books
 */
export async function parseBookFile(file: File): Promise<{
  rows: ParsedBookRow[];
  totalValid: number;
  totalInvalid: number;
}> {
  let rawRows: any[] = [];

  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    const headers: string[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell) => {
          headers.push(String(cell.text || cell.value || '').trim());
        });
      } else {
        const rowObj: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1] || `col_${colNumber}`;
          let val = cell.value;
          if (val && typeof val === 'object' && 'text' in val) {
            val = (val as any).text;
          } else if (val && typeof val === 'object' && 'result' in val) {
            val = (val as any).result;
          }
          rowObj[header] = val !== null && val !== undefined ? String(val).trim() : '';
        });
        if (Object.keys(rowObj).length > 0) {
          rawRows.push(rowObj);
        }
      }
    });
  } else {
    // CSV / TXT fallback
    const text = await file.text();
    rawRows = parseDelimitedText(text);
  }

  // Normalize and validate rows
  return normalizeBookRows(rawRows);
}

/**
 * Universal Excel / CSV Reader for Members
 */
export async function parseMemberFile(file: File): Promise<{
  rows: ParsedMemberRow[];
  totalValid: number;
  totalInvalid: number;
}> {
  let rawRows: any[] = [];

  if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    const headers: string[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell) => {
          headers.push(String(cell.text || cell.value || '').trim());
        });
      } else {
        const rowObj: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1] || `col_${colNumber}`;
          let val = cell.value;
          if (val && typeof val === 'object' && 'text' in val) {
            val = (val as any).text;
          } else if (val && typeof val === 'object' && 'result' in val) {
            val = (val as any).result;
          }
          rowObj[header] = val !== null && val !== undefined ? String(val).trim() : '';
        });
        if (Object.keys(rowObj).length > 0) {
          rawRows.push(rowObj);
        }
      }
    });
  } else {
    // CSV / TXT fallback
    const text = await file.text();
    rawRows = parseDelimitedText(text);
  }

  return normalizeMemberRows(rawRows);
}

/**
 * Parse raw text (CSV, TSV, or pasted Excel cells)
 */
export function parseDelimitedText(text: string): any[] {
  const clean = text.trim();
  if (!clean) return [];

  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  // Determine delimiter: tab (\t), comma (,), semicolon (;)
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  const headers = splitRow(lines[0], delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());

  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitRow(lines[i], delimiter);
    const rowObj: Record<string, any> = {};
    headers.forEach((h, idx) => {
      const v = values[idx] !== undefined ? values[idx].replace(/^["']|["']$/g, '').trim() : '';
      rowObj[h] = v;
    });
    rows.push(rowObj);
  }

  return rows;
}

function splitRow(line: string, delimiter: string): string[] {
  if (delimiter === '\t') {
    return line.split('\t');
  }
  // CSV regex with quotes support
  const matches = line.match(/(".*?"|[^",;\s]+)(?=\s*[,;]|\s*$)/g);
  return matches ? matches.map((m) => m.trim()) : line.split(delimiter);
}

/**
 * Intelligent normalization of raw Book rows matching Indonesian & English column names
 */
export function normalizeBookRows(rawRows: any[]): {
  rows: ParsedBookRow[];
  totalValid: number;
  totalInvalid: number;
} {
  let validCount = 0;
  let invalidCount = 0;

  const normalized: ParsedBookRow[] = rawRows.map((raw, idx) => {
    const errors: string[] = [];

    // Helper to find value across multiple possible column aliases
    const getVal = (aliases: string[]) => {
      for (const key of Object.keys(raw)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const alias of aliases) {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanKey.includes(cleanAlias) || cleanAlias.includes(cleanKey)) {
            return String(raw[key] ?? '').trim();
          }
        }
      }
      return '';
    };

    const title = getVal(['judul', 'title', 'judulkoleksi', 'namabuku']);
    const author = getVal(['pengarang', 'penulis', 'author', 'namapengarang']);
    const isbn = getVal(['isbn', 'nomorisbn', 'issn']);
    const publisher = getVal(['penerbit', 'publisher']) || 'Penerbit Nasional';
    const publishYearRaw = getVal(['tahunterbit', 'tahun', 'publishyear', 'year']) || '2024';
    const publishYear = parseInt(publishYearRaw, 10) || 2024;
    const category = getVal(['kategori', 'category', 'kategorikoleksi']) || 'Koleksi Umum';
    const classificationCode = getVal(['kodeklasifikasi', 'ddc', 'klasifikasi', 'classificationcode']) || '000';
    const callNumber = getVal(['nomorpanggil', 'callnumber', 'nopanggil']) || `${classificationCode} ${author.slice(0, 3).toUpperCase()} ${title[0]?.toLowerCase() || 'b'}`;
    const copiesRaw = getVal(['jumlaheksemplar', 'eksemplar', 'copies', 'copiescount', 'totalcopies', 'stok']) || '1';
    const copiesCount = Math.max(1, parseInt(copiesRaw, 10) || 1);
    const location = getVal(['lokasirak', 'lokasi', 'rak', 'location', 'defaultlocation']) || 'Rak Koleksi Utama';
    const source = getVal(['sumberpengadaan', 'sumber', 'source', 'dana']) || 'BOS Reguler';
    const pagesRaw = getVal(['jumlahhalaman', 'halaman', 'pages']) || '200';
    const pages = parseInt(pagesRaw, 10) || 200;
    const description = getVal(['deskripsi', 'sinopsis', 'description', 'keterangan']) || 'Koleksi perpustakaan SMAN 3 Nganjuk';

    if (!title) errors.push('Judul buku tidak boleh kosong.');
    if (!author) errors.push('Pengarang / Penulis tidak boleh kosong.');
    if (!isbn) errors.push('ISBN wajib diisi untuk entri buku.');

    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else invalidCount++;

    return {
      title,
      author,
      isbn,
      publisher,
      publishYear,
      category,
      classificationCode,
      callNumber,
      copiesCount,
      totalCopies: copiesCount,
      location,
      defaultLocation: location,
      source,
      pages,
      description,
      _rowNumber: idx + 1,
      _isValid: isValid,
      _errors: errors
    };
  });

  return {
    rows: normalized,
    totalValid: validCount,
    totalInvalid: invalidCount
  };
}

/**
 * Intelligent normalization of raw Member rows matching Indonesian & English column names
 */
export function normalizeMemberRows(rawRows: any[]): {
  rows: ParsedMemberRow[];
  totalValid: number;
  totalInvalid: number;
} {
  let validCount = 0;
  let invalidCount = 0;

  const normalized: ParsedMemberRow[] = rawRows.map((raw, idx) => {
    const errors: string[] = [];

    const getVal = (aliases: string[]) => {
      for (const key of Object.keys(raw)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const alias of aliases) {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanKey.includes(cleanAlias) || cleanAlias.includes(cleanKey)) {
            return String(raw[key] ?? '').trim();
          }
        }
      }
      return '';
    };

    const name = getVal(['namalengkap', 'nama', 'name', 'fullname', 'anggotanama']);
    let typeRaw = getVal(['tipeanggota', 'tipe', 'type', 'statuskeanggotaan', 'role']).toUpperCase();
    let type: 'SISWA' | 'GURU' | 'TENDIK' = 'SISWA';
    if (typeRaw.includes('GURU') || typeRaw.includes('TEACHER') || typeRaw.includes('PENDIDIK')) {
      type = 'GURU';
    } else if (typeRaw.includes('TENDIK') || typeRaw.includes('STAF') || typeRaw.includes('STAFF') || typeRaw.includes('KARYAWAN')) {
      type = 'TENDIK';
    } else {
      type = 'SISWA';
    }

    const identityNumber = getVal(['nis', 'nip', 'nuptk', 'nomoridentitas', 'identitynumber', 'nik', 'noinduk', 'id']);
    let genderRaw = getVal(['jeniskelamin', 'gender', 'jk', 'kelamin', 'sex']).toUpperCase();
    let gender: 'L' | 'P' = 'L';
    if (genderRaw.startsWith('P') || genderRaw.includes('FEMALE') || genderRaw.includes('WANITA')) {
      gender = 'P';
    } else {
      gender = 'L';
    }

    const classGrade = getVal(['kelas', 'rombel', 'classgrade', 'kelasrombel', 'tingkat']);
    const subject = getVal(['matapelajaran', 'mapel', 'subject', 'tugas', 'jabatan', 'posisi']);
    const phone = getVal(['nomorwhatsapp', 'whatsapp', 'phone', 'telepon', 'nohp', 'hp']) || '-';
    const email = getVal(['alamatemail', 'email', 'surel']) || (identityNumber ? `${identityNumber}@sman3nganjuk.sch.id` : '');
    const address = getVal(['alamatdomisili', 'alamat', 'address', 'tempattinggal']) || 'Nganjuk, Jawa Timur';

    if (!name) errors.push('Nama lengkap tidak boleh kosong.');
    if (!identityNumber) errors.push('Nomor NIS / NIP wajib diisi sebagai identitas unik.');

    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else invalidCount++;

    return {
      name,
      type,
      identityNumber,
      gender,
      classGrade: type === 'SISWA' ? classGrade : '',
      subject: type !== 'SISWA' ? subject : '',
      phone,
      email,
      address,
      _rowNumber: idx + 1,
      _isValid: isValid,
      _errors: errors
    };
  });

  return {
    rows: normalized,
    totalValid: validCount,
    totalInvalid: invalidCount
  };
}

/**
 * Trigger file download from ArrayBuffer/Uint8Array
 */
function triggerExcelDownload(buffer: ArrayBuffer | Uint8Array, filename: string) {
  const blob = new Blob([buffer as any], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
