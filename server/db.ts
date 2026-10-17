import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  User,
  LibrarySettings,
  Book,
  BookItem,
  Member,
  Loan,
  Fine,
  Reservation,
  StockOpnameSession,
  SerialPublication,
  ActivityLog,
  DatabaseBackup,
  MasterCategory,
  MasterLocation,
  MasterPublisher,
  MasterAuthor
} from '../src/types';
import { initNeonTables, fetchAllFromNeon, pushAllToNeon } from './neonSync';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'library_db.json');

export interface DatabaseSchema {
  settings: LibrarySettings;
  users: User[];
  books: Book[];
  items: BookItem[];
  members: Member[];
  loans: Loan[];
  fines: Fine[];
  reservations: Reservation[];
  stockOpnames: StockOpnameSession[];
  serials: SerialPublication[];
  categories: MasterCategory[];
  locations: MasterLocation[];
  publishers: MasterPublisher[];
  authors: MasterAuthor[];
  activityLogs: ActivityLog[];
  backups: DatabaseBackup[];
}

// Initial default settings
const defaultSettings: LibrarySettings = {
  libraryName: 'ASTRA LIBRARY SYSTEM',
  shortName: 'ASTRA LIBRARY',
  schoolName: 'POLITEKNIK ASTRA',
  address: 'Kawasan Industri Delta Silicon II, Cikarang',
  city: 'Bekasi',
  postalCode: '17550',
  province: 'Jawa Barat',
  phone: '(021) 50227888',
  email: 'perpustakaan@polytechnic.astra.ac.id',
  website: 'https://polytechnic.astra.ac.id',
  tagline: 'Membaca, Mengelola, Menginspirasi',
  headOfLibrary: 'Rayyan Ammar',
  headmaster: 'Direktur Politeknik Astra',
  finePerDay: 1000,
  gracePeriodDays: 1,
  fineDamagedPercent: 50,
  fineLostMultiplier: 100,
  loanRules: {
    siswa: { maxItems: 3, loanDurationDays: 7, maxExtensions: 2 },
    guru: { maxItems: 5, loanDurationDays: 14, maxExtensions: 3 },
    tendik: { maxItems: 5, loanDurationDays: 14, maxExtensions: 3 }
  },
  enableSelfReservation: true,
  enableAiAssistant: true,
  themeColor: '#1E3A8A',
  googleSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1VlKdmIhyMOIQtdgGu5SebRy4wP216THGt9dMPuQfyOA/edit?usp=sharing',
  googleSpreadsheetId: '1VlKdmIhyMOIQtdgGu5SebRy4wP216THGt9dMPuQfyOA',
  googleDriveFolderUrl: 'https://drive.google.com/drive/folders/1KpUK7yn2CZeTQGKAjdvQWdC662dkOna3?usp=sharing',
  googleDriveFolderId: '1KpUK7yn2CZeTQGKAjdvQWdC662dkOna3',
  gasWebAppUrl: '',
  enableGoogleSheetsSync: true,
  autoSyncIntervalMinutes: 5
};

function getSeedData(): DatabaseSchema {
  const superadminHash = bcrypt.hashSync('wplsadmin', 10);
  const adminHash = bcrypt.hashSync('admin123', 10);
  const pustakawanHash = bcrypt.hashSync('widya123', 10);
  const kepsekHash = bcrypt.hashSync('kswidya', 10);
  const teacherHash = bcrypt.hashSync('guru123', 10);
  const studentHash = bcrypt.hashSync('siswa123', 10);

  const users: User[] = [
    {
      id: 'usr-superadmin',
      username: 'superadmin',
      email: 'superadmin@sman3nganjuk.sch.id',
      fullName: 'Super Administrator',
      role: 'superadmin',
      passwordHash: superadminHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: '2025-01-01T08:00:00Z'
    },
    {
      id: 'usr-admin',
      username: 'admin',
      email: 'admin.perpus@sman3nganjuk.sch.id',
      fullName: 'Bambang Sudarmono, S.Sos.',
      role: 'admin',
      passwordHash: adminHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: '2025-01-02T08:00:00Z'
    },
    {
      id: 'usr-pustakawan',
      username: 'pustakawan',
      email: 'pustakawan@sman3nganjuk.sch.id',
      fullName: 'Siti Rahmawati, S.I.Pust.',
      role: 'pustakawan',
      passwordHash: pustakawanHash,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: '2025-01-03T08:00:00Z'
    },
    {
      id: 'usr-kepsek',
      username: 'kepsek',
      email: 'kepsek@sman3nganjuk.sch.id',
      fullName: 'Drs. H. Sukadi, M.Pd.',
      role: 'kepala_sekolah',
      passwordHash: kepsekHash,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: '2025-01-01T08:00:00Z'
    },
    {
      id: 'usr-guru1',
      username: 'guru1',
      email: 'guru.matematika@sman3nganjuk.sch.id',
      fullName: 'Ahmad Fauzi, S.Pd., M.Si.',
      role: 'guru',
      passwordHash: teacherHash,
      memberId: 'mem-guru-001',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: '2025-01-05T08:00:00Z'
    },
    {
      id: 'usr-siswa1',
      username: 'siswa1',
      email: 'dimas.pratama@siswa.sman3nganjuk.sch.id',
      fullName: 'Dimas Arya Pratama',
      role: 'siswa',
      passwordHash: studentHash,
      memberId: 'mem-siswa-001',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: '2025-01-06T08:00:00Z'
    }
  ];

  const categories: MasterCategory[] = [
    { id: 'cat-1', code: '000', name: 'Karya Umum & Komputer', ddcRange: '000 - 099' },
    { id: 'cat-2', code: '100', name: 'Filsafat & Psikologi', ddcRange: '100 - 199' },
    { id: 'cat-3', code: '200', name: 'Agama', ddcRange: '200 - 299' },
    { id: 'cat-4', code: '300', name: 'Ilmu Sosial & Pendidikan', ddcRange: '300 - 399' },
    { id: 'cat-5', code: '400', name: 'Bahasa & Linguistik', ddcRange: '400 - 499' },
    { id: 'cat-6', code: '500', name: 'Sains & Matematika', ddcRange: '500 - 599' },
    { id: 'cat-7', code: '600', name: 'Teknologi & Ilmu Terapan', ddcRange: '600 - 699' },
    { id: 'cat-8', code: '700', name: 'Seni, Musik & Olahraga', ddcRange: '700 - 799' },
    { id: 'cat-9', code: '800', name: 'Kesusastraan & Fiksi', ddcRange: '800 - 899' },
    { id: 'cat-10', code: '900', name: 'Sejarah & Geografi', ddcRange: '900 - 999' },
    { id: 'cat-11', code: 'TEX', name: 'Buku Teks Pelajaran', ddcRange: 'Pelajaran SMA' },
    { id: 'cat-12', code: 'REF', name: 'Referensi & Ensiklopedia', ddcRange: 'R' }
  ];

  const locations: MasterLocation[] = [
    { id: 'loc-1', code: 'RAK-A1', name: 'Rak A1 - Sains & MIPA', room: 'Ruang Koleksi Utama', shelf: 'Lantai 1, Baris 1', capacity: 150 },
    { id: 'loc-2', code: 'RAK-A2', name: 'Rak A2 - Teknologi & Terapan', room: 'Ruang Koleksi Utama', shelf: 'Lantai 1, Baris 2', capacity: 150 },
    { id: 'loc-3', code: 'RAK-B1', name: 'Rak B1 - Sastra & Fiksi', room: 'Ruang Koleksi Utama', shelf: 'Lantai 1, Baris 3', capacity: 200 },
    { id: 'loc-4', code: 'RAK-B2', name: 'Rak B2 - Novel & Antologi', room: 'Ruang Baca Santai', shelf: 'Lantai 1, Baris 4', capacity: 200 },
    { id: 'loc-5', code: 'RAK-C1', name: 'Rak C1 - Pelajaran Kelas X', room: 'Ruang Buku Teks', shelf: 'Lantai 2, Baris 1', capacity: 300 },
    { id: 'loc-6', code: 'RAK-C2', name: 'Rak C2 - Pelajaran Kelas XI', room: 'Ruang Buku Teks', shelf: 'Lantai 2, Baris 2', capacity: 300 },
    { id: 'loc-7', code: 'RAK-C3', name: 'Rak C3 - Pelajaran Kelas XII', room: 'Ruang Buku Teks', shelf: 'Lantai 2, Baris 3', capacity: 300 },
    { id: 'loc-8', code: 'RAK-R1', name: 'Rak R1 - Referensi & Kamus', room: 'Ruang Referensi', shelf: 'Lantai 1, Sudut R', capacity: 100 },
    { id: 'loc-9', code: 'RAK-D1', name: 'Rak D1 - Karya Ilmiah & Majalah', room: 'Ruang Berkala', shelf: 'Lantai 1, Sisi Timur', capacity: 120 }
  ];

  const publishers: MasterPublisher[] = [
    { id: 'pub-1', name: 'Pusat Perbukuan Kemendikbudristek', city: 'Jakarta', country: 'Indonesia', phone: '(021) 3804248', email: 'buku@kemdikbud.go.id' },
    { id: 'pub-2', name: 'Erlangga', city: 'Jakarta', country: 'Indonesia', phone: '(021) 8717085', email: 'customercare@erlangga.co.id' },
    { id: 'pub-3', name: 'Gramedia Pustaka Utama', city: 'Jakarta', country: 'Indonesia', phone: '(021) 53650110', email: 'customercare@gramedia.com' },
    { id: 'pub-4', name: 'Bentang Pustaka', city: 'Yogyakarta', country: 'Indonesia', phone: '(0274) 885408', email: 'bentang.pustaka@mizan.com' },
    { id: 'pub-5', name: 'Mizan', city: 'Bandung', country: 'Indonesia', phone: '(022) 7834310', email: 'redaksi@mizan.com' },
    { id: 'pub-6', name: 'Balai Pustaka', city: 'Jakarta', country: 'Indonesia', phone: '(021) 8583377', email: 'info@balaipustaka.co.id' }
  ];

  const authors: MasterAuthor[] = [
    { id: 'aut-1', name: 'Pramoedya Ananta Toer', type: 'Personal', nationality: 'Indonesia' },
    { id: 'aut-2', name: 'Andrea Hirata', type: 'Personal', nationality: 'Indonesia' },
    { id: 'aut-3', name: 'Tere Liye', type: 'Personal', nationality: 'Indonesia' },
    { id: 'aut-4', name: 'Ahmad Fuadi', type: 'Personal', nationality: 'Indonesia' },
    { id: 'aut-5', name: 'Eka Kurniawan', type: 'Personal', nationality: 'Indonesia' },
    { id: 'aut-6', name: 'Tim Kemendikbud', type: 'Organisasi', nationality: 'Indonesia' },
    { id: 'aut-7', name: 'Marthen Kanginan', type: 'Personal', nationality: 'Indonesia' },
    { id: 'aut-8', name: 'Sukino', type: 'Personal', nationality: 'Indonesia' },
    { id: 'aut-9', name: 'Siti Nurul Hidayah', type: 'Personal', nationality: 'Indonesia' }
  ];

  const books: Book[] = [
    {
      id: 'bk-001',
      isbn: '978-602-244-325-4',
      title: 'Matematika Tingkat Lanjut untuk SMA/MA Kelas XI',
      subtitle: 'Kurikulum Merdeka - Edisi Revisi',
      author: 'Al Azhary Masta, dkk.',
      editor: 'Pusat Kurikulum dan Perbukuan',
      publisher: 'Pusat Perbukuan Kemendikbudristek',
      publishYear: 2023,
      publishCity: 'Jakarta',
      edition: 'Cetakan Ke-1',
      language: 'Indonesia',
      category: 'Buku Teks Pelajaran',
      subject: 'Matematika SMA, Aljabar, Trigonometri, Geometri Analitik',
      classificationCode: '510',
      callNumber: '510 MAS m',
      description: 'Buku teks resmi Matematika Tingkat Lanjut SMA Kelas XI berbasis Kurikulum Merdeka yang menekankan pemahaman konsep, eksplorasi matematis, dan pemecahan masalah kontekstual berorientasi Profil Pelajar Pancasila.',
      pages: 312,
      dimension: '17.6 x 25 cm',
      source: 'BOS',
      defaultLocation: 'Rak C2 - Pelajaran Kelas XI',
      coverUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=80',
      digitalFileUrl: 'https://buku.kemdikbud.go.id/katalog/matematika-tingkat-lanjut-sma-xi',
      isOpacVisible: true,
      createdAt: '2025-01-10T08:00:00Z',
      updatedAt: '2025-01-10T08:00:00Z'
    },
    {
      id: 'bk-002',
      isbn: '978-602-244-380-3',
      title: 'Fisika untuk SMA/MA Kelas XI',
      subtitle: 'Kurikulum Merdeka - Pemahaman Konsep dan Praktikum',
      author: 'Marianna Magdalena Radjawane, dkk.',
      publisher: 'Pusat Perbukuan Kemendikbudristek',
      publishYear: 2023,
      publishCity: 'Jakarta',
      edition: 'Cetakan Ke-2',
      language: 'Indonesia',
      category: 'Sains & Matematika',
      subject: 'Fisika SMA, Mekanika Fluida, Gelombang, Termodinamika',
      classificationCode: '530',
      callNumber: '530 RAD f',
      description: 'Buku Fisika SMA kelas XI menyajikan fenomena alam secara empiris, dilengkapi kegiatan laboratorium, simulasi digital, serta aplikasi teknologi terbarukan dalam kehidupan sehari-hari.',
      pages: 256,
      dimension: '17.6 x 25 cm',
      source: 'BOS',
      defaultLocation: 'Rak C2 - Pelajaran Kelas XI',
      coverUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&auto=format&fit=crop&q=80',
      isOpacVisible: true,
      createdAt: '2025-01-10T08:00:00Z',
      updatedAt: '2025-01-10T08:00:00Z'
    },
    {
      id: 'bk-003',
      isbn: '978-602-291-662-8',
      title: 'Bumi Manusia',
      subtitle: 'Tetralogi Buru Bagian Pertama',
      author: 'Pramoedya Ananta Toer',
      publisher: 'Lentera Dipantara',
      publishYear: 2021,
      publishCity: 'Jakarta',
      edition: 'Edisi Khusus',
      language: 'Indonesia',
      category: 'Kesusastraan & Fiksi',
      subject: 'Novel Sejarah Indonesia, Pergerakan Nasional, Humanisme',
      classificationCode: '813',
      callNumber: '813 TOE b',
      description: 'Karya sastra legendaris mahakarya Pramoedya Ananta Toer yang mengisahkan perjuangan Minke, seorang pribumi cerdas di era Hindia Belanda, menegakkan harkat kemanusiaan dan cinta sejati bersama Annelies Mellema.',
      pages: 535,
      dimension: '13 x 20.5 cm',
      source: 'Pembelian',
      defaultLocation: 'Rak B1 - Sastra & Fiksi',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
      isOpacVisible: true,
      createdAt: '2025-01-11T08:00:00Z',
      updatedAt: '2025-01-11T08:00:00Z'
    },
    {
      id: 'bk-004',
      isbn: '978-979-3062-79-2',
      title: 'Laskar Pelangi',
      subtitle: 'Kisah Inspiratif Sepuluh Sahabat Pengukir Mimpi',
      author: 'Andrea Hirata',
      publisher: 'Bentang Pustaka',
      publishYear: 2022,
      publishCity: 'Yogyakarta',
      edition: 'Cetakan Ke-40',
      language: 'Indonesia',
      category: 'Kesusastraan & Fiksi',
      subject: 'Novel Motivasi, Pendidikan Belitung, Persahabatan',
      classificationCode: '813',
      callNumber: '813 HIR l',
      description: 'Novel best seller fenomena sastra Indonesia tentang tekad baja anak-anak pulau Belitong meraih cita-cita di bawah bimbingan guru penuh dedikasi Bu Muslimah dan Pak Harfan.',
      pages: 529,
      dimension: '13.5 x 20.5 cm',
      source: 'Hibah / Donasi',
      defaultLocation: 'Rak B2 - Novel & Antologi',
      coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
      isOpacVisible: true,
      createdAt: '2025-01-12T08:00:00Z',
      updatedAt: '2025-01-12T08:00:00Z'
    },
    {
      id: 'bk-005',
      isbn: '978-602-03-2478-4',
      title: 'Hujan',
      subtitle: 'Kisah Cinta, Persahabatan dan Melupakan',
      author: 'Tere Liye',
      publisher: 'Gramedia Pustaka Utama',
      publishYear: 2022,
      publishCity: 'Jakarta',
      edition: 'Cetakan Ke-25',
      language: 'Indonesia',
      category: 'Kesusastraan & Fiksi',
      subject: 'Fiksi Sains Masa Depan, Drama, Hubungan Kemanusiaan',
      classificationCode: '813',
      callNumber: '813 TER h',
      description: 'Mengambil latar tahun 2042 setelah bencana gunung meletus dahsyat, mengisahkan Lail dan Esok dalam pergulatan teknologi memori, kepedulian sosial, dan keikhlasan melepaskan masa lalu.',
      pages: 320,
      dimension: '13.5 x 20 cm',
      source: 'Pembelian',
      defaultLocation: 'Rak B2 - Novel & Antologi',
      coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80',
      isOpacVisible: true,
      createdAt: '2025-01-13T08:00:00Z',
      updatedAt: '2025-01-13T08:00:00Z'
    },
    {
      id: 'bk-006',
      isbn: '978-602-244-657-6',
      title: 'Biologi untuk SMA/MA Kelas XII',
      subtitle: 'Kurikulum Merdeka - Bioteknologi & Genetika Terapan',
      author: 'Shilviana Rahayu, dkk.',
      publisher: 'Pusat Perbukuan Kemendikbudristek',
      publishYear: 2024,
      publishCity: 'Jakarta',
      edition: 'Cetakan Ke-1',
      language: 'Indonesia',
      category: 'Sains & Matematika',
      subject: 'Biologi SMA, Enzim Metabolisme, DNA/RNA, Rekayasa Genetika, Evolusi',
      classificationCode: '570',
      callNumber: '570 RAH b',
      description: 'Membahas konsep mutakhir biologi sel, sintesis protein, genetika Mendel, hereditas manusia, serta bioteknologi modern dengan pendekatan saintifik dan studi kasus riset.',
      pages: 288,
      dimension: '17.6 x 25 cm',
      source: 'BOS',
      defaultLocation: 'Rak C3 - Pelajaran Kelas XII',
      coverUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&auto=format&fit=crop&q=80',
      isOpacVisible: true,
      createdAt: '2025-01-14T08:00:00Z',
      updatedAt: '2025-01-14T08:00:00Z'
    },
    {
      id: 'bk-007',
      isbn: '978-602-06-3843-0',
      title: 'Atomic Habits: Perubahan Kecil yang Memberikan Hasil Luar Biasa',
      subtitle: 'Cara Mudah & Terbukti Membangun Kebiasaan Baik dan Membuang Kebiasaan Buruk',
      author: 'James Clear',
      editor: 'Alex Tri Kantjono Widodo (Penerjemah)',
      publisher: 'Gramedia Pustaka Utama',
      publishYear: 2023,
      publishCity: 'Jakarta',
      edition: 'Cetakan Ke-18',
      language: 'Indonesia',
      category: 'Filsafat & Psikologi',
      subject: 'Pengembangan Diri, Psikologi Perilaku, Produktivitas Siswa',
      classificationCode: '158',
      callNumber: '158 CLE a',
      description: 'Panduan praktis berbasis ilmu biologi, psikologi, dan neurosains untuk membentuk kebiasaan positif 1% setiap hari dan mencapai lompatan prestasi belajar serta pembentukan karakter disiplin.',
      pages: 356,
      dimension: '15 x 23 cm',
      source: 'Pembelian',
      defaultLocation: 'Rak A2 - Teknologi & Terapan',
      coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&auto=format&fit=crop&q=80',
      isOpacVisible: true,
      createdAt: '2025-01-15T08:00:00Z',
      updatedAt: '2025-01-15T08:00:00Z'
    },
    {
      id: 'bk-008',
      isbn: '978-979-403-888-9',
      title: 'Kamus Besar Bahasa Indonesia (KBBI) Edisi Kelima',
      subtitle: 'Rujukan Utama Kosakata Bahasa Indonesia Baku',
      author: 'Badan Pengembangan dan Pembinaan Bahasa',
      publisher: 'Balai Pustaka & Kemdikbud',
      publishYear: 2022,
      publishCity: 'Jakarta',
      edition: 'Edisi V Lux',
      language: 'Indonesia',
      category: 'Referensi & Ensiklopedia',
      subject: 'Leksikografi, Tata Bahasa, Kamus Referensi Nasional',
      classificationCode: 'R 499.221',
      callNumber: 'R 499.221 BAD k',
      description: 'Kamus resmi terlengkap bahasa Indonesia memuat lebih dari 127.000 lema dan makna, mencakup istilah ilmiah mutakhir, etimologi kata, ungkapan, dan peribahasa nusantara.',
      pages: 2040,
      dimension: '21 x 28 cm',
      source: 'Pemerintah',
      defaultLocation: 'Rak R1 - Referensi & Kamus',
      coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&auto=format&fit=crop&q=80',
      isOpacVisible: true,
      createdAt: '2025-01-15T08:00:00Z',
      updatedAt: '2025-01-15T08:00:00Z'
    }
  ];

  const items: BookItem[] = [
    // bk-001 (Matematika XI) - 4 eksemplar
    { id: 'itm-001-1', bookId: 'bk-001', barcode: 'WPL-000001', inventoryNumber: 'INV/2024/001/01', location: 'Rak C2 - Pelajaran Kelas XI', status: 'borrowed', condition: 'good', entryDate: '2024-07-15', source: 'BOS', price: 75000 },
    { id: 'itm-001-2', bookId: 'bk-001', barcode: 'WPL-000002', inventoryNumber: 'INV/2024/001/02', location: 'Rak C2 - Pelajaran Kelas XI', status: 'available', condition: 'good', entryDate: '2024-07-15', source: 'BOS', price: 75000 },
    { id: 'itm-001-3', bookId: 'bk-001', barcode: 'WPL-000003', inventoryNumber: 'INV/2024/001/03', location: 'Rak C2 - Pelajaran Kelas XI', status: 'available', condition: 'good', entryDate: '2024-07-15', source: 'BOS', price: 75000 },
    { id: 'itm-001-4', bookId: 'bk-001', barcode: 'WPL-000004', inventoryNumber: 'INV/2024/001/04', location: 'Rak C2 - Pelajaran Kelas XI', status: 'available', condition: 'fair', entryDate: '2024-07-15', source: 'BOS', price: 75000 },

    // bk-002 (Fisika XI) - 3 eksemplar
    { id: 'itm-002-1', bookId: 'bk-002', barcode: 'WPL-000005', inventoryNumber: 'INV/2024/002/01', location: 'Rak C2 - Pelajaran Kelas XI', status: 'borrowed', condition: 'good', entryDate: '2024-07-15', source: 'BOS', price: 82000 },
    { id: 'itm-002-2', bookId: 'bk-002', barcode: 'WPL-000006', inventoryNumber: 'INV/2024/002/02', location: 'Rak C2 - Pelajaran Kelas XI', status: 'available', condition: 'good', entryDate: '2024-07-15', source: 'BOS', price: 82000 },
    { id: 'itm-002-3', bookId: 'bk-002', barcode: 'WPL-000007', inventoryNumber: 'INV/2024/002/03', location: 'Rak C2 - Pelajaran Kelas XI', status: 'available', condition: 'good', entryDate: '2024-07-15', source: 'BOS', price: 82000 },

    // bk-003 (Bumi Manusia) - 3 eksemplar
    { id: 'itm-003-1', bookId: 'bk-003', barcode: 'WPL-000008', inventoryNumber: 'INV/2023/003/01', location: 'Rak B1 - Sastra & Fiksi', status: 'borrowed', condition: 'good', entryDate: '2023-09-10', source: 'Pembelian', price: 135000 },
    { id: 'itm-003-2', bookId: 'bk-003', barcode: 'WPL-000009', inventoryNumber: 'INV/2023/003/02', location: 'Rak B1 - Sastra & Fiksi', status: 'available', condition: 'good', entryDate: '2023-09-10', source: 'Pembelian', price: 135000 },
    { id: 'itm-003-3', bookId: 'bk-003', barcode: 'WPL-000010', inventoryNumber: 'INV/2023/003/03', location: 'Rak B1 - Sastra & Fiksi', status: 'reserved', condition: 'good', entryDate: '2023-09-10', source: 'Pembelian', price: 135000 },

    // bk-004 (Laskar Pelangi) - 3 eksemplar
    { id: 'itm-004-1', bookId: 'bk-004', barcode: 'WPL-000011', inventoryNumber: 'INV/2023/004/01', location: 'Rak B2 - Novel & Antologi', status: 'available', condition: 'good', entryDate: '2023-10-01', source: 'Hibah / Donasi', price: 98000 },
    { id: 'itm-004-2', bookId: 'bk-004', barcode: 'WPL-000012', inventoryNumber: 'INV/2023/004/02', location: 'Rak B2 - Novel & Antologi', status: 'available', condition: 'good', entryDate: '2023-10-01', source: 'Hibah / Donasi', price: 98000 },
    { id: 'itm-004-3', bookId: 'bk-004', barcode: 'WPL-000013', inventoryNumber: 'INV/2023/004/03', location: 'Rak B2 - Novel & Antologi', status: 'damaged', condition: 'damaged', entryDate: '2023-10-01', source: 'Hibah / Donasi', price: 98000, notes: 'Cover lepas, butuh perbaikan jilid' },

    // bk-005 (Hujan) - 2 eksemplar
    { id: 'itm-005-1', bookId: 'bk-005', barcode: 'WPL-000014', inventoryNumber: 'INV/2023/005/01', location: 'Rak B2 - Novel & Antologi', status: 'available', condition: 'good', entryDate: '2023-11-20', source: 'Pembelian', price: 95000 },
    { id: 'itm-005-2', bookId: 'bk-005', barcode: 'WPL-000015', inventoryNumber: 'INV/2023/005/02', location: 'Rak B2 - Novel & Antologi', status: 'borrowed', condition: 'good', entryDate: '2023-11-20', source: 'Pembelian', price: 95000 },

    // bk-006 (Biologi XII) - 3 eksemplar
    { id: 'itm-006-1', bookId: 'bk-006', barcode: 'WPL-000016', inventoryNumber: 'INV/2024/006/01', location: 'Rak C3 - Pelajaran Kelas XII', status: 'available', condition: 'good', entryDate: '2024-07-20', source: 'BOS', price: 88000 },
    { id: 'itm-006-2', bookId: 'bk-006', barcode: 'WPL-000017', inventoryNumber: 'INV/2024/006/02', location: 'Rak C3 - Pelajaran Kelas XII', status: 'available', condition: 'good', entryDate: '2024-07-20', source: 'BOS', price: 88000 },

    // bk-007 (Atomic Habits) - 2 eksemplar
    { id: 'itm-007-1', bookId: 'bk-007', barcode: 'WPL-000018', inventoryNumber: 'INV/2023/007/01', location: 'Rak A2 - Teknologi & Terapan', status: 'available', condition: 'good', entryDate: '2023-12-05', source: 'Pembelian', price: 108000 },
    { id: 'itm-007-2', bookId: 'bk-007', barcode: 'WPL-000019', inventoryNumber: 'INV/2023/007/02', location: 'Rak A2 - Teknologi & Terapan', status: 'available', condition: 'good', entryDate: '2023-12-05', source: 'Pembelian', price: 108000 },

    // bk-008 (KBBI V) - 2 eksemplar
    { id: 'itm-008-1', bookId: 'bk-008', barcode: 'WPL-000020', inventoryNumber: 'INV/2022/008/01', location: 'Rak R1 - Referensi & Kamus', status: 'available', condition: 'good', entryDate: '2022-05-10', source: 'Pemerintah', price: 450000 },
    { id: 'itm-008-2', bookId: 'bk-008', barcode: 'WPL-000021', inventoryNumber: 'INV/2022/008/02', location: 'Rak R1 - Referensi & Kamus', status: 'available', condition: 'good', entryDate: '2022-05-10', source: 'Pemerintah', price: 450000 }
  ];

  const members: Member[] = [
    {
      id: 'mem-siswa-001',
      memberCode: '202410101',
      type: 'SISWA',
      identityNumber: '10101',
      nisn: '0067891234',
      name: 'Dimas Arya Pratama',
      gender: 'L',
      classGrade: 'XI MIPA 1',
      major: 'MIPA (Kurikulum Merdeka)',
      entryYear: 2023,
      phone: '081234567890',
      email: 'dimas.pratama@siswa.sman3nganjuk.sch.id',
      address: 'Jl. Ahmad Yani No. 45, Nganjuk',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      registeredDate: '2023-07-17',
      expiryDate: '2026-06-30',
      notes: 'Siswa aktif, ketua ekskul KIR'
    },
    {
      id: 'mem-siswa-002',
      memberCode: '202410102',
      type: 'SISWA',
      identityNumber: '10102',
      nisn: '0067891235',
      name: 'Anindya Putri Maharani',
      gender: 'P',
      classGrade: 'XI MIPA 2',
      major: 'MIPA (Kurikulum Merdeka)',
      entryYear: 2023,
      phone: '081298765432',
      email: 'anindya.putri@siswa.sman3nganjuk.sch.id',
      address: 'Perumahan Griya Indah Begadung Blok C-12, Nganjuk',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      registeredDate: '2023-07-17',
      expiryDate: '2026-06-30'
    },
    {
      id: 'mem-siswa-003',
      memberCode: '202410103',
      type: 'SISWA',
      identityNumber: '10103',
      nisn: '0071234567',
      name: 'Muhammad Rizky Ramadhan',
      gender: 'L',
      classGrade: 'X-E 3',
      major: 'Fase E (Kurikulum Merdeka)',
      entryYear: 2024,
      phone: '085712349988',
      email: 'rizky.ramadhan@siswa.sman3nganjuk.sch.id',
      address: 'Jl. Supriyadi No. 18, Sukomoro, Nganjuk',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      registeredDate: '2024-07-15',
      expiryDate: '2027-06-30'
    },
    {
      id: 'mem-siswa-004',
      memberCode: '202410104',
      type: 'SISWA',
      identityNumber: '10104',
      nisn: '0059988776',
      name: 'Nabila Zahra Khairunnisa',
      gender: 'P',
      classGrade: 'XII IPS 1',
      major: 'IPS',
      entryYear: 2022,
      phone: '082133445566',
      email: 'nabila.zahra@siswa.sman3nganjuk.sch.id',
      address: 'Jl. Dermojoyo No. 88, Berbek, Nganjuk',
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      registeredDate: '2022-07-18',
      expiryDate: '2025-06-30'
    },
    {
      id: 'mem-guru-001',
      memberCode: '197805122005011003',
      type: 'GURU',
      identityNumber: '197805122005011003',
      name: 'Ahmad Fauzi, S.Pd., M.Si.',
      gender: 'L',
      subject: 'Matematika Peminatan & Tingkat Lanjut',
      position: 'Guru Madya / Pembina Olimpiade Sains',
      phone: '081335789012',
      email: 'fauzi.guru@sman3nganjuk.sch.id',
      address: 'Jl. Panglima Sudirman No. 102, Nganjuk',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      registeredDate: '2020-01-10',
      expiryDate: '2030-12-31'
    },
    {
      id: 'mem-guru-002',
      memberCode: '198203152008012015',
      type: 'GURU',
      identityNumber: '198203152008012015',
      name: 'Dra. Sri Wahyuni, M.Pd.',
      gender: 'P',
      subject: 'Bahasa dan Sastra Indonesia',
      position: 'Guru Pembina Literasi & Majalah Sekolah',
      phone: '081230456781',
      email: 'sri.wahyuni@sman3nganjuk.sch.id',
      address: 'Jl. Mastrip No. 34, Loceret, Nganjuk',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      registeredDate: '2020-01-10',
      expiryDate: '2030-12-31'
    },
    {
      id: 'mem-tendik-001',
      memberCode: 'TK-19880914-001',
      type: 'TENDIK',
      identityNumber: '198809142010011002',
      name: 'Joko Susilo, S.Kom.',
      gender: 'L',
      position: 'Kepala Laboratorium Komputer & IT Support',
      phone: '085649123888',
      email: 'joko.it@sman3nganjuk.sch.id',
      address: 'Jl. Diponegoro No. 27, Nganjuk',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      registeredDate: '2021-03-01',
      expiryDate: '2030-12-31'
    }
  ];

  const loans: Loan[] = [
    {
      id: 'loan-001',
      loanCode: 'PJ-202608-0001',
      memberId: 'mem-siswa-001',
      memberCode: '202410101',
      memberName: 'Dimas Arya Pratama',
      memberType: 'SISWA',
      officerId: 'usr-pustakawan',
      officerName: 'Siti Rahmawati, S.I.Pust.',
      loanDate: '2026-08-15',
      dueDate: '2026-08-22', // Overdue relative to current time Aug 23
      status: 'overdue',
      extensionCount: 0,
      maxExtensions: 2,
      items: [
        {
          itemId: 'itm-001-1',
          bookId: 'bk-001',
          barcode: 'WPL-000001',
          bookTitle: 'Matematika Tingkat Lanjut untuk SMA/MA Kelas XI',
          author: 'Al Azhary Masta, dkk.',
          callNumber: '510 MAS m',
          coverUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&auto=format&fit=crop&q=80'
        }
      ],
      notes: 'Dipinjam untuk persiapan olimpiade matematika sekolah'
    },
    {
      id: 'loan-002',
      loanCode: 'PJ-202608-0002',
      memberId: 'mem-guru-001',
      memberCode: '197805122005011003',
      memberName: 'Ahmad Fauzi, S.Pd., M.Si.',
      memberType: 'GURU',
      officerId: 'usr-pustakawan',
      officerName: 'Siti Rahmawati, S.I.Pust.',
      loanDate: '2026-08-18',
      dueDate: '2026-09-01',
      status: 'active',
      extensionCount: 0,
      maxExtensions: 3,
      items: [
        {
          itemId: 'itm-002-1',
          bookId: 'bk-002',
          barcode: 'WPL-000005',
          bookTitle: 'Fisika untuk SMA/MA Kelas XI',
          author: 'Marianna Magdalena Radjawane, dkk.',
          callNumber: '530 RAD f',
          coverUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&auto=format&fit=crop&q=80'
        }
      ]
    },
    {
      id: 'loan-003',
      loanCode: 'PJ-202608-0003',
      memberId: 'mem-siswa-002',
      memberCode: '202410102',
      memberName: 'Anindya Putri Maharani',
      memberType: 'SISWA',
      officerId: 'usr-pustakawan',
      officerName: 'Siti Rahmawati, S.I.Pust.',
      loanDate: '2026-08-20',
      dueDate: '2026-08-27',
      status: 'active',
      extensionCount: 0,
      maxExtensions: 2,
      items: [
        {
          itemId: 'itm-003-1',
          bookId: 'bk-003',
          barcode: 'WPL-000008',
          bookTitle: 'Bumi Manusia',
          author: 'Pramoedya Ananta Toer',
          callNumber: '813 TOE b',
          coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80'
        },
        {
          itemId: 'itm-005-2',
          bookId: 'bk-005',
          barcode: 'WPL-000015',
          bookTitle: 'Hujan',
          author: 'Tere Liye',
          callNumber: '813 TER h',
          coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80'
        }
      ]
    },
    {
      id: 'loan-004',
      loanCode: 'PJ-202608-0004',
      memberId: 'mem-siswa-004',
      memberCode: '202410104',
      memberName: 'Nabila Zahra Khairunnisa',
      memberType: 'SISWA',
      officerId: 'usr-pustakawan',
      officerName: 'Siti Rahmawati, S.I.Pust.',
      loanDate: '2026-08-01',
      dueDate: '2026-08-08',
      returnDate: '2026-08-10',
      status: 'returned',
      extensionCount: 0,
      maxExtensions: 2,
      items: [
        {
          itemId: 'itm-004-1',
          bookId: 'bk-004',
          barcode: 'WPL-000011',
          bookTitle: 'Laskar Pelangi',
          author: 'Andrea Hirata',
          callNumber: '813 HIR l',
          coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
          returnedAt: '2026-08-10',
          returnCondition: 'good',
          fineAmount: 2000,
          finePaid: true
        }
      ]
    }
  ];

  const fines: Fine[] = [
    {
      id: 'fn-001',
      fineCode: 'FN-202608-0001',
      loanId: 'loan-004',
      memberId: 'mem-siswa-004',
      memberName: 'Nabila Zahra Khairunnisa',
      memberCode: '202410104',
      itemId: 'itm-004-1',
      bookTitle: 'Laskar Pelangi',
      barcode: 'WPL-000011',
      daysLate: 2,
      finePerDay: 1000,
      damageFine: 0,
      lostFine: 0,
      totalFine: 2000,
      paidAmount: 2000,
      status: 'paid',
      reason: 'Keterlambatan',
      officerId: 'usr-pustakawan',
      officerName: 'Siti Rahmawati, S.I.Pust.',
      createdAt: '2026-08-10T09:30:00Z',
      paidAt: '2026-08-10T09:32:00Z',
      notes: 'Lunas dibayar tunai di meja sirkulasi'
    },
    {
      id: 'fn-002',
      fineCode: 'FN-202608-0002',
      loanId: 'loan-001',
      memberId: 'mem-siswa-001',
      memberName: 'Dimas Arya Pratama',
      memberCode: '202410101',
      itemId: 'itm-001-1',
      bookTitle: 'Matematika Tingkat Lanjut untuk SMA/MA Kelas XI',
      barcode: 'WPL-000001',
      daysLate: 1,
      finePerDay: 1000,
      damageFine: 0,
      lostFine: 0,
      totalFine: 1000,
      paidAmount: 0,
      status: 'unpaid',
      reason: 'Keterlambatan',
      officerId: 'usr-pustakawan',
      officerName: 'Siti Rahmawati, S.I.Pust.',
      createdAt: '2026-08-23T00:00:00Z',
      notes: 'Otomatis dihitung sistem saat jatuh tempo terlewati'
    }
  ];

  const reservations: Reservation[] = [
    {
      id: 'res-001',
      bookId: 'bk-003',
      bookTitle: 'Bumi Manusia',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
      memberId: 'mem-siswa-003',
      memberName: 'Muhammad Rizky Ramadhan',
      memberCode: '202410103',
      requestDate: '2026-08-21',
      expiryDate: '2026-08-26',
      status: 'waiting',
      notes: 'Reservasi via OPAC mandiri'
    }
  ];

  const stockOpnames: StockOpnameSession[] = [
    {
      id: 'so-2026-01',
      sessionCode: 'SO-SMAN3-2026-01',
      title: 'Stock Opname Koleksi Sastra & Pelajaran Semester Ganjil 2026',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      status: 'completed',
      officerName: 'Bambang Sudarmono, S.Sos.',
      totalCatalogItems: 21,
      scannedCount: 21,
      foundCount: 19,
      missingCount: 1,
      damagedCount: 1,
      misplacedCount: 0,
      notes: 'Audit tahunan buku perpustakaan SMAN 3 Nganjuk selesai dengan akurasi 95%',
      scannedItems: [
        {
          barcode: 'WPL-000001',
          bookTitle: 'Matematika Tingkat Lanjut untuk SMA/MA Kelas XI',
          expectedLocation: 'Rak C2 - Pelajaran Kelas XI',
          scannedLocation: 'Rak C2 - Pelajaran Kelas XI',
          scannedAt: '2026-08-01T10:15:00Z',
          officer: 'Siti Rahmawati',
          condition: 'good',
          status: 'matched'
        },
        {
          barcode: 'WPL-000013',
          bookTitle: 'Laskar Pelangi',
          expectedLocation: 'Rak B2 - Novel & Antologi',
          scannedLocation: 'Rak B2 - Novel & Antologi',
          scannedAt: '2026-08-02T11:20:00Z',
          officer: 'Siti Rahmawati',
          condition: 'damaged',
          status: 'damaged'
        }
      ]
    }
  ];

  const serials: SerialPublication[] = [
    {
      id: 'ser-001',
      title: 'Gema Smaga - Majalah Komunitas SMAN 3 Nganjuk',
      type: 'Majalah',
      issn: '2549-887X',
      publisher: 'OSIS & Tim Jurnalistik SMA Negeri 3 Nganjuk',
      frequency: 'Triwulan',
      editionNumber: 'Edisi 42 / Agustus 2026',
      publishDate: '2026-08-01',
      location: 'Rak D1 - Karya Ilmiah & Majalah',
      totalCopies: 10,
      availableCopies: 8,
      coverUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
      notes: 'Liputan prestasi olimpiade sains, pentas seni sekolah, dan rubrik karya sastra siswa'
    },
    {
      id: 'ser-002',
      title: 'Jurnal Edukasi & Pedagogi Jawa Timur',
      type: 'Jurnal',
      issn: '2301-4455',
      publisher: 'Dinas Pendidikan Provinsi Jawa Timur',
      frequency: 'Bulanan',
      editionNumber: 'Vol. 14 No. 2 (2026)',
      publishDate: '2026-07-15',
      location: 'Rak D1 - Karya Ilmiah & Majalah',
      totalCopies: 5,
      availableCopies: 5,
      coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
      notes: 'Kumpulan artikel penelitian tindakan kelas (PTK) guru SMA/SMK se-Jawa Timur'
    }
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: 'log-001',
      timestamp: new Date().toISOString(),
      userId: 'usr-pustakawan',
      username: 'pustakawan',
      role: 'pustakawan',
      module: 'LOANS',
      action: 'BORROW',
      recordId: 'loan-003',
      recordIdentifier: 'PJ-202608-0003',
      description: 'Peminjaman 2 buku oleh Anindya Putri Maharani (XI MIPA 2)',
      ipAddress: '127.0.0.1'
    },
    {
      id: 'log-002',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userId: 'usr-admin',
      username: 'admin',
      role: 'admin',
      module: 'BOOKS',
      action: 'CREATE',
      recordId: 'bk-001',
      recordIdentifier: '978-602-244-325-4',
      description: 'Input bibliografi baru: Matematika Tingkat Lanjut SMA Kelas XI',
      ipAddress: '127.0.0.1'
    },
    {
      id: 'log-003',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      userId: 'usr-superadmin',
      username: 'superadmin',
      role: 'superadmin',
      module: 'AUTH',
      action: 'LOGIN',
      description: 'Super Administrator berhasil login ke sistem',
      ipAddress: '127.0.0.1'
    }
  ];

  const backups: DatabaseBackup[] = [
    {
      id: 'bak-001',
      filename: 'backup_sman3nganjuk_initial_20260820.json',
      createdAt: '2026-08-20T17:00:00Z',
      createdBy: 'Super Administrator',
      fileSizeKb: 48,
      itemCount: 21,
      status: 'success',
      notes: 'Backup rutin mingguan database Widya Pustaka'
    }
  ];

  return {
    settings: defaultSettings,
    users,
    books,
    items,
    members,
    loans,
    fines,
    reservations,
    stockOpnames,
    serials,
    categories,
    locations,
    publishers,
    authors,
    activityLogs,
    backups
  };
}

class DatabaseService {
  private data: DatabaseSchema;
  private isNeonEnabled: boolean = false;
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncingToNeon: boolean = false;
  private pendingSyncToNeon: boolean = false;

  constructor() {
    this.ensureDirectoryExists();
    this.data = this.loadDatabase();
    this.ensureStudentAndCatalogData();
  }

  public async init(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      console.log('[DATABASE] No DATABASE_URL configured. Running with local JSON database.');
      return;
    }

    try {
      console.log('[NEON POSTGRES] Initializing Neon connection...');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Neon connection timed out')), 2000)
      );
      await Promise.race([initNeonTables(), timeoutPromise]);
      const neonData = (await Promise.race([fetchAllFromNeon(), timeoutPromise])) as any;

      if (neonData && neonData.users && neonData.users.length > 0) {
        console.log(`[NEON POSTGRES] Synced data from Neon (${neonData.users.length} users, ${neonData.books.length} books, ${neonData.categories.length} categories).`);
        this.data = neonData;
        this.ensureStudentAndCatalogData();
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
        } catch {}
      } else {
        console.log('[NEON POSTGRES] Neon database is fresh/empty. Migrating initial data to Neon...');
        this.ensureStudentAndCatalogData();
        await pushAllToNeon(this.data);
        console.log('[NEON POSTGRES] Initial data successfully migrated to Neon PostgreSQL!');
      }

      this.isNeonEnabled = true;
      console.log('[NEON POSTGRES] Neon PostgreSQL is connected and active.');
    } catch (err) {
      console.error('[NEON POSTGRES] Failed to connect to Neon PostgreSQL. Continuing with local JSON file:', err);
      this.isNeonEnabled = false;
    }
  }

  public ensureStudentAndCatalogData(): void {
    let changed = false;
    const studentHash = bcrypt.hashSync('siswa123', 10);

    // 1. Ensure student user account 'siswa'
    let studentUser = this.data.users.find((u) => u.username === 'siswa');
    if (!studentUser) {
      studentUser = {
        id: 'usr-siswa',
        username: 'siswa',
        email: 'siswa@polytechnic.astra.ac.id',
        fullName: 'Dimas Arya Pratama (Mahasiswa)',
        name: 'Dimas Arya Pratama',
        role: 'siswa',
        passwordHash: studentHash,
        memberId: 'mem-siswa-001',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        isActive: true,
        createdAt: '2025-01-06T08:00:00Z'
      };
      this.data.users.push(studentUser);
      changed = true;
    }

    // Also support username 'siswa1'
    if (!this.data.users.some((u) => u.username === 'siswa1')) {
      this.data.users.push({
        id: 'usr-siswa1',
        username: 'siswa1',
        email: 'dimas.pratama@siswa.astra.ac.id',
        fullName: 'Dimas Arya Pratama',
        name: 'Dimas Arya Pratama',
        role: 'siswa',
        passwordHash: studentHash,
        memberId: 'mem-siswa-001',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        isActive: true,
        createdAt: '2025-01-06T08:00:00Z'
      });
      changed = true;
    }

    // 2. Ensure member record for student
    let studentMember = this.data.members.find((m) => m.id === 'mem-siswa-001' || m.memberCode === '202410101');
    if (!studentMember) {
      this.data.members.push({
        id: 'mem-siswa-001',
        memberCode: '202410101',
        type: 'SISWA',
        identityNumber: '202410101',
        nisn: '0067891234',
        name: 'Dimas Arya Pratama',
        gender: 'L',
        classGrade: 'Tingkat 2 (Teknik Manufaktur)',
        major: 'Teknik Rekayasa Pembuatan Perkakas Presisi',
        entryYear: 2024,
        phone: '081234567890',
        email: 'siswa@polytechnic.astra.ac.id',
        address: 'Kawasan Industri Delta Silicon II, Cikarang',
        photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        status: 'active',
        registeredDate: '2024-08-01',
        expiryDate: '2027-08-01',
        notes: 'Mahasiswa aktif Politeknik Astra'
      });
      changed = true;
    }

    // 3. Ensure rich catalog books exist if books length is small (< 3)
    if (!this.data.books || this.data.books.length < 3) {
      const seed = getSeedData();
      for (const b of seed.books) {
        if (!this.data.books.some((existing) => existing.id === b.id)) {
          this.data.books.push(b);
          changed = true;
        }
      }
      for (const itm of seed.items) {
        if (!this.data.items.some((existing) => existing.id === itm.id || existing.barcode === itm.barcode)) {
          this.data.items.push(itm);
          changed = true;
        }
      }
    }

    if (changed) {
      this.saveDatabase();
    }
  }

  private ensureDirectoryExists() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {
      // Ignored in read-only environment like Vercel Serverless
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (e) {
      console.error('Error loading library database file, reinitializing with seed data:', e);
    }
    const seed = getSeedData();
    this.saveDatabase(seed);
    return seed;
  }

  public saveDatabase(newData?: DatabaseSchema) {
    if (newData) {
      this.data = newData;
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving library database file:', e);
    }

    if (this.isNeonEnabled) {
      this.scheduleNeonSync();
      // Ensure sync also triggers immediately in serverless environment
      this.flushToNeon().catch(() => {});
    }
  }

  private scheduleNeonSync() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    this.syncTimeout = setTimeout(() => {
      this.flushToNeon();
    }, 250);
  }

  public async flushToNeon(): Promise<void> {
    if (!this.isNeonEnabled) return;
    if (this.isSyncingToNeon) {
      this.pendingSyncToNeon = true;
      return;
    }

    this.isSyncingToNeon = true;
    try {
      await pushAllToNeon(this.data);
    } catch (e) {
      console.error('[NEON POSTGRES] Background sync to Neon failed:', e);
    } finally {
      this.isSyncingToNeon = false;
      if (this.pendingSyncToNeon) {
        this.pendingSyncToNeon = false;
        this.scheduleNeonSync();
      }
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // Helper log activity
  public logActivity(log: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const newLog: ActivityLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      ...log
    };
    this.data.activityLogs.unshift(newLog);
    if (this.data.activityLogs.length > 500) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 500);
    }
    this.saveDatabase();
    return newLog;
  }

  // Synchronize overdue loans, fine calculation, and expired reservations
  public syncOverdueLoans() {
    const today = new Date().toISOString().split('T')[0];
    const todayMidnight = new Date(today + 'T00:00:00Z').getTime();
    let changed = false;

    // 1. Process overdue loans and fines
    this.data.loans.forEach((loan) => {
      if (loan.status === 'active' && loan.dueDate < today) {
        loan.status = 'overdue';
        changed = true;
      }

      if (loan.status === 'overdue' || (loan.status === 'active' && loan.dueDate < today)) {
        const dueMidnight = new Date(loan.dueDate.slice(0, 10) + 'T00:00:00Z').getTime();
        const daysLate = Math.max(0, Math.floor((todayMidnight - dueMidnight) / (1000 * 60 * 60 * 24)));
        const gracePeriod = this.data.settings.gracePeriodDays || 0;

        loan.items.forEach((item) => {
          const existingFine = this.data.fines.find(
            (f) => f.loanId === loan.id && f.itemId === item.itemId && f.status !== 'paid' && f.status !== 'waived'
          );

          if (daysLate > gracePeriod) {
            const fineAmount = daysLate * (this.data.settings.finePerDay || 1000);
            if (existingFine) {
              if (existingFine.daysLate !== daysLate || existingFine.totalFine !== fineAmount) {
                existingFine.daysLate = daysLate;
                existingFine.totalFine = fineAmount;
                changed = true;
              }
            } else {
              this.data.fines.push({
                id: 'fn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                fineCode: 'FN-' + new Date().toISOString().slice(0, 7).replace('-', '') + '-' + (this.data.fines.length + 1).toString().padStart(4, '0'),
                loanId: loan.id,
                memberId: loan.memberId,
                memberName: loan.memberName,
                memberCode: loan.memberCode,
                itemId: item.itemId,
                bookTitle: item.bookTitle,
                barcode: item.barcode,
                daysLate,
                finePerDay: this.data.settings.finePerDay || 1000,
                damageFine: 0,
                lostFine: 0,
                totalFine: fineAmount,
                paidAmount: 0,
                status: 'unpaid',
                reason: 'Keterlambatan',
                officerId: loan.officerId,
                officerName: loan.officerName,
                createdAt: new Date().toISOString(),
                notes: 'Otomatis dihitung sistem'
              });
              changed = true;
            }
          }
        });
      }
    });

    // 2. Process expired reservations and reallocate or release items
    if (this.data.reservations && this.data.reservations.length > 0) {
      this.data.reservations.forEach((resv) => {
        if ((resv.status === 'ready' || resv.status === 'pending' || resv.status === 'waiting') && resv.expiryDate && resv.expiryDate < today) {
          resv.status = 'expired';
          changed = true;

          // If reservation had an allocated barcode, release or pass to next waiting patron
          if (resv.allocatedBarcode) {
            const item = this.data.items.find((i) => i.barcode === resv.allocatedBarcode);
            if (item && item.status === 'reserved') {
              const nextResv = this.data.reservations
                .filter((r) => r.id !== resv.id && r.bookId === resv.bookId && (r.status === 'pending' || r.status === 'waiting'))
                .sort((a, b) => new Date(a.requestDate || a.reservationDate || 0).getTime() - new Date(b.requestDate || b.reservationDate || 0).getTime())[0];

              if (nextResv) {
                nextResv.status = 'ready';
                nextResv.allocatedBarcode = item.barcode;
                nextResv.readyDate = today;
              } else {
                item.status = 'available';
              }
            }
            resv.allocatedBarcode = undefined;
          }
        }
      });
    }

    if (changed) {
      this.saveDatabase();
    }
  }
}

export const db = new DatabaseService();
