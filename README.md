# 📚 Astra Library - Sistem Manajemen Perpustakaan Terpadu (Perpustakaan Digital)

<p align="center">
  <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&auto=format&fit=crop&q=80" alt="Astra Library Banner" width="100%" style="border-radius: 12px; max-height: 380px; object-fit: cover;" />
</p>

<p align="center">
  <strong>Solusi Sistem Otomasi & Manajemen Perpustakaan Berbasis Web Terintegrasi</strong><br>
  Dirancang khusus untuk modernisasi operasional, digitalisasi layanan literasi, dan efisiensi tata kelola perpustakaan di lingkungan <strong>Politeknik Astra</strong> serta institusi pendidikan vokasi/sekolah.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0.1-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon_Cloud-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Google_Gemini_AI-2.5_Flash-8E75C2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Deploy-Vercel_Ready-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel Ready" />
</p>

---

## 📖 Tentang Aplikasi

**Astra Library (Perpustakaan Digital)** adalah aplikasi sistem informasi manajemen perpustakaan modern (*Integrated Library System*) *full-stack* yang dibangun untuk menggantikan pencatatan manual berbasis kertas dengan ekosistem digital yang cepat, akurat, dan transparan.

Aplikasi ini mencakup seluruh siklus operasional perpustakaan: mulai dari katalogisasi terstandarisasi, sirkulasi peminjaman/pengembalian ber-barcode, buku tamu pengunjung digital, kartu anggota terverifikasi, perhitungan denda otomatis, stok opname berkala, hingga laporan analitik eksekutif. Sistem ini juga dilengkapi dengan kecerdasan buatan **Google Gemini AI** untuk rekomendasi bahan pustaka dan asisten katalog DDC otomatis.

---

## 🌟 Fitur Unggulan

### 1. 🔍 OPAC (Online Public Access Catalog) & Portal Pemustaka
* **Pencarian Multi-parameter Cepat:** Pencarian buku seketika berdasarkan judul, penulis, subjek, penerbit, atau ISBN.
* **Filter Koleksi Dinamis:** Pemilahan kategori, ketersediaan rak (*Tersedia, Dipinjam, Dalam Pemeliharaan*), serta jenis koleksi (Buku Cetak vs e-Book/Digital).
* **Reservasi Buku Mandiri:** Mahasiswa dan dosen dapat melakukan reservasi buku yang sedang dipinjam langsung melalui portal.
* **Detail & Sinopsis Interaktif:** Pratinjau sampul buku, detail bibliografi, nomor panggil rak, dan unduhan/baca materi digital (PDF).

### 2. 🤖 Asisten AI Cerdas Perpustakaan (Powered by Google Gemini 2.5 Flash)
* **Smart Book Recommendations:** Memberikan rekomendasi buku terpersonalisasi berdasarkan topik minat baca atau bidang studi mahasiswa/dosen.
* **AI Cataloging Assistant:** Membantu pustakawan menentukan nomor klasifikasi **DDC (Dewey Decimal Classification)**, nomor panggil (*Call Number*), subjek kata kunci, dan membuat sinopsis buku secara otomatis hanya dari judul dan nama penulis.

### 3. ⚡ Sirkulasi Kilat & Manajemen Denda
* **Quick Circulation Barcode:** Peminjaman dan pengembalian buku cepat dengan memindai barcode kartu anggota dan barcode eksemplar buku.
* **Kalkulasi Denda Otomatis:** Perhitungan keterlambatan hari dan nominal denda secara presisi berdasarkan aturan operasional perpustakaan.
* **Cetak Struk Transaksi (Receipt Print):** Cetak bukti fisik peminjaman dan pengembalian dalam format struk kasir/thermal printer.
* **WhatsApp Reminder Gateway:** Kirim notifikasi pengingat jatuh tempo atau tagihan denda ke nomor WhatsApp anggota dengan template pesan resmi hanya dalam 1 klik (tanpa biaya API pihak ketiga).

### 4. 📚 Manajemen Katalog & Inventaris Koleksi
* **Data Bibliografi Komprehensif:** Nomor ISBN, edisi, tahun terbit, bahasa, klasifikasi DDC, rak lokasi penyimpanan, dan jumlah eksemplar.
* **Cetak Label Punggung Buku (Spine Label Print):** Cetak label punggung buku lengkap dengan Barcode Code128 dan Call Number standar perpustakaan.
* **Import & Export Excel:** Unggah ribuan data buku sekaligus via template Microsoft Excel (`.xlsx`) serta ekspor katalog lengkap sewaktu-waktu.
* **Digital Collections:** Manajemen e-Book dan publikasi elektronik kampus.

### 5. 👥 Manajemen Keanggotaan & Identitas Digital
* **Data Anggota Terpadu:** Pengelompokan siswa/mahasiswa, guru/dosen, serta staf umum lengkap dengan informasi NIS/NIP, kontak WhatsApp, dan program studi.
* **Cetak Kartu Anggota Resmi (Member ID Card):** Template kartu anggota bolak-balik dengan barcode/QR Code unik, foto profil, dan stempel digital.
* **Otomatisasi Akun Pengguna:** Fitur *bulk generate* akun login pengguna otomatis dengan basis username NIS/NIP.
* **Import & Export Anggota:** Migrasi data pemustaka massal melalui spreadsheet Excel.

### 6. 📖 Buku Tamu Pengunjung Mandiri (Digital Visitor Kiosk)
* **Kiosk Presensi Mandiri:** Layar presensi pengunjung perpustakaan harian dengan pemindaian barcode kartu atau input nomor identitas.
* **Statistik Kunjungan:** Rekapitulasi tujuan kunjungan (baca di tempat, pinjam buku, diskusi, riset) untuk laporan akreditasi.

### 7. 📦 Stock Opname (Audit Fisik Koleksi)
* **Audit Fisik Real-time:** Proses inventarisasi stok buku menggunakan scanner barcode untuk mencocokkan keberadaan fisik di rak dengan database.
* **Laporan Selisih:** Otomatisasi pendeteksian buku yang hilang, salah letak rak, rusak, atau berstatus tidak sah.

### 8. 📊 Laporan Analitik & Dashboard Eksekutif
* **Statistik Visual Recharts:** Grafik tren peminjaman bulanan, buku paling sering dipinjam (*most borrowed*), dan rasio keaktifan anggota.
* **Ekspor Laporan Resmi:** Unduh data transaksi, keuangan denda, katalog buku, dan log kunjungan ke format Microsoft Excel siap cetak.

### 9. 🔐 Keamanan & Role-Based Access Control (RBAC)
Mendukung 6 tingkatan hak akses yang terisolasi secara ketat:
* **Superadmin:** Akses tanpa batas ke seluruh modul, konfigurasi sistem, database, dan manajemen user admin.
* **Administrator:** Manajemen sirkulasi, buku, anggota, stok opname, dan laporan.
* **Pustakawan:** Operasional harian meja sirkulasi, pengembalian, denda, dan katalogisasi.
* **Kepala Sekolah / Dekan:** Akses analitik, audit log, dan persetujuan laporan eksekutif.
* **Guru / Dosen:** Peminjaman durasi khusus, usulan buku baru, dan pencarian bahan ajar.
* **Siswa / Mahasiswa:** Akses mandiri OPAC, riwayat peminjaman, perpanjangan buku, dan informasi denda.

---

## 🛠️ Tech Stack & Arsitektur Sistem

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | Antarmuka reaktif berkecepatan tinggi dengan tipe data kuat |
| **Build Tool & Bundler** | Vite 6.2 | Modul hot-reload instan dan optimasi bundle produksi |
| **CSS & Styling** | Tailwind CSS v4 | Utilitas CSS modern dan responsif |
| **Motion & Visuals** | Framer Motion + Canvas Confetti | Mikro-animasi interaktif dan transisi mulus |
| **Icons & Visual Asset** | Lucide React | Ikonografi modern dan konsisten |
| **Data Visualization** | Recharts 3 | Visualisasi grafik batang, garis, dan donat interaktif |
| **Barcode Engine** | JsBarcode | Pembuatan barcode Code128 dinamis untuk buku dan kartu |
| **Spreadsheet Engine** | ExcelJS | Generator template dan parser file `.xlsx` dengan validasi cell |
| **Backend Framework** | Node.js + Express.js 4.21 | RESTful API server dengan modular routing |
| **AI Integration** | `@google/genai` (Gemini 2.5 Flash) | Rekomendasi buku cerdas dan asisten DDC bibliografi |
| **Authentication** | JWT (JSON Web Tokens) + bcryptjs | Otentikasi stateless dengan enkripsi password salt hash |
| **Database (Dual Storage)** | Neon PostgreSQL + Local JSON DB | Sinkronisasi cloud PostgreSQL serverless & cache backup lokal |
| **Deployment Target** | Vercel Serverless / Node Server | Dukungan arsitektur monorepo serverless & containerized |

---

## 📁 Struktur Direktori Proyek

```text
perpustakaan-app/
├── api/                        # Serverless function entrypoint (Vercel)
│   └── index.js                # Handler API bundling
├── data/                       # Local file database fallback
│   └── library_db.json         # Data JSON lokal lengkap
├── public/                     # Static public assets (Favicon, Logo, Gambar)
├── server/                     # Backend Express.js Server
│   ├── routes/                 # API Endpoint Controllers
│   │   ├── ai.ts               # Integrasi Gemini AI (Rekomendasi & Katalog DDC)
│   │   ├── auth.ts             # Login, Register, Verify JWT Token
│   │   ├── books.ts            # Manajemen Buku, Eksemplar, Label Barcode
│   │   ├── circulation.ts      # Pinjam, Kembali, Denda, WhatsApp Reminder
│   │   ├── members.ts          # CRUD Anggota, Kartu Anggota, Auto-Akun
│   │   ├── reports.ts          # Generator Laporan & Analisis Statistik
│   │   ├── settings.ts         # Pengaturan Perpustakaan, Aturan Denda & Backup
│   │   └── stockOpname.ts      # Modul Inventarisasi & Audit Buku
│   ├── auth.ts                 # Middleware Verifikasi JWT & Hak Akses Role
│   ├── db.ts                   # Engine Akses & Manipulasi Database
│   └── neonSync.ts             # Sinkronisasi Cloud Neon PostgreSQL
├── src/                        # Frontend React Application
│   ├── components/             # Reusable UI Components
│   │   ├── common/             # Modal WA Reminder, Struk, Kartu Anggota, Label Rak
│   │   └── layout/             # Navbar, Sidebar, Footer, Breadcrumbs
│   ├── context/                # React Context (AuthContext, ToastContext)
│   ├── pages/                  # Halaman Aplikasi
│   │   ├── Books/              # Daftar Buku, Import/Export, Koleksi Digital
│   │   ├── Circulation/        # Sirkulasi Cepat, Pinjaman Aktif, Riwayat, Denda
│   │   ├── Members/            # Daftar Anggota, Import/Export, Kartu Anggota
│   │   ├── Profile/            # Profil Pengguna & Ganti Password
│   │   ├── Reports/            # Statistik & Unduh Laporan Excel
│   │   ├── Settings/           # Konfigurasi Sekolah, Parameter Denda, User Management
│   │   ├── StockOpname/        # Pengecekan Fisik Koleksi
│   │   ├── Visitor/            # Buku Tamu / Presensi Pengunjung
│   │   ├── Dashboard.tsx       # Beranda & Statistik Utama
│   │   ├── Login.tsx           # Layar Masuk Multi-Role
│   │   └── OPAC.tsx            # Katalog Publik Terbuka
│   ├── services/               # API Client & Export Service (Excel/PDF)
│   ├── types.ts                # TypeScript Global Data Models
│   ├── App.tsx                 # Root Router & Layout Switcher
│   ├── index.css               # Desain Sistem & Directives Tailwind CSS
│   └── main.tsx                # React DOM Mount
├── server.ts                   # Entry point aplikasi full-stack (Dev & Standalone)
├── vercel.json                 # Konfigurasi rewrite & deployment Vercel
├── vite.config.ts              # Konfigurasi Vite bundler
└── package.json                # Project dependencies & scripts
```

---

## 🔑 Akun & Kredensial Default (Demo / Pengujian)

Aplikasi telah dilengkapi dengan akun bawaan untuk berbagai level peran:

| Level Hak Akses | Username | Password | Deskripsi Wewenang |
| :--- | :--- | :--- | :--- |
| **Superadmin** | `superadmin` | `wplsadmin` | Hak akses penuh sistem, konfigurasi server, dan master user |
| **Administrator** | `admin` | `admin123` | Manajemen operasional sirkulasi, data buku, dan data anggota |
| **Pustakawan** | `pustakawan` | `widya123` | Petugas meja sirkulasi, presensi pengunjung, dan denda |
| **Kepala Sekolah** | `kepsek` | `kswidya` | Pemantauan kinerja perpustakaan, laporan analitik, & audit |
| **Guru / Dosen** | `guru` | `guru123` | Akses peminjaman bahan ajar dan referensi kurikulum |
| **Siswa / Mahasiswa** | `siswa` | `siswa123` | Akses OPAC, pencarian mandiri, reservasi, dan cek denda |

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### Prasyarat
* [Node.js](https://nodejs.org/) versi 18.x atau lebih baru (Disarankan versi LTS).
* Git terpasang pada komputer Anda.

### Langkah-langkah

1. **Clone Repository ini:**
   ```bash
   git clone https://github.com/rayyanbabab/Perpustakaan-Digital.git
   cd Perpustakaan-Digital
   ```

2. **Instalasi Semua Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable:**
   Salin file template `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan nilai variabel di dalam file `.env`:
   ```env
   # Database URL (Opsional jika ingin sinkronisasi Cloud Neon PostgreSQL)
   DATABASE_URL="postgresql://user:password@host/neondb?sslmode=verify-full"

   # Google Gemini API Key (Untuk fitur rekomendasi AI & bantuan katalog)
   GEMINI_API_KEY="AIzaSy..."

   # Port Server (Default: 3000)
   PORT=3000
   ```
   *(Catatan: Aplikasi tetap dapat berjalan secara mulus dalam mode lokal tanpa API Key eksternal berkat sistem fallback cerdas)*.

4. **Jalankan Aplikasi dalam Mode Pengembangan:**
   ```bash
   npm run dev
   ```
   Buka peramban Anda di: `http://localhost:3000`  
   *(Server Express dan antarmuka Vite berjalan terpadu dalam satu proses server).*

5. **Build dan Jalankan untuk Mode Produksi:**
   ```bash
   npm run build
   npm run start
   ```

---

## ⚙️ Skrip NPM yang Tersedia

* `npm run dev`: Menjalankan server pengembangan terpadu dengan fitur *hot-reload*.
* `npm run build`: Melakukan kompilasi bundle Vite frontend dan bundle Node.js backend (`dist/server.cjs` dan `api/index.js`).
* `npm run start`: Menjalankan aplikasi hasil kompilasi produksi.
* `npm run lint`: Memvalidasi tipe data TypeScript di seluruh proyek (`tsc --noEmit`).

---

## 💾 Manajemen Database & Sinkronisasi Cloud

Aplikasi ini mengadopsi arsitektur penyimpanan **Dual-Engine Persistence**:

1. **Local JSON Database (`data/library_db.json`):**
   * Menyimpan data secara lokal untuk kemudahan instalasi mandiri (*zero-configuration setup*).
   * Fitur **Backup & Restore 1-Klik** tersedia langsung pada menu **Pengaturan**, memungkinkan pustakawan mencadangkan file database ke komputer lokal kapan saja.
2. **Cloud PostgreSQL (Neon Serverless):**
   * Terintegrasi dengan modul `server/neonSync.ts`.
   * Jika variabel `DATABASE_URL` diatur, sistem otomatis menyinkronkan seluruh perubahan transaksi ke database PostgreSQL cloud.

---

## 🌐 Panduan Deployment ke Vercel

Proyek ini telah dikonfigurasi secara *native* untuk platform serverless **Vercel** melalui file [`vercel.json`](./vercel.json) dan endpoint [`api/index.js`](./api/index.js).

1. Lakukan *fork* atau *push* repository ini ke akun GitHub Anda.
2. Masuk ke [Vercel Dashboard](https://vercel.com/) dan pilih **Add New Project**.
3. Hubungkan repository **Perpustakaan-Digital**.
4. Konfigurasi build setting:
   * **Framework Preset:** Vite
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. Tambahkan Environment Variable pada menu **Settings > Environment Variables**:
   * `DATABASE_URL`: URL PostgreSQL dari Neon Database / Supabase.
   * `GEMINI_API_KEY`: API Key dari Google AI Studio.
6. Klik **Deploy** dan aplikasi Anda siap digunakan secara daring.

---

## 📄 Lisensi & Hak Cipta

Aplikasi ini dikembangkan untuk memajukan literasi, efisiensi manajemen perpustakaan, dan digitalisasi ekosistem pendidikan di **Politeknik Astra**.

Didistribusikan di bawah lisensi terbuka untuk tujuan pendidikan dan pengembangan kelembagaan.

---

<p align="center">
  Dibuat dengan ❤️ untuk kemajuan literasi dan ekosistem pendidikan Politeknik Astra.
</p>
