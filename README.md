# Widya Pustaka - Sistem Manajemen Perpustakaan Terpadu
Sistem Informasi Manajemen Perpustakaan berbasis Web (Full-stack) yang dikembangkan khusus untuk **SMA Negeri 3 Nganjuk**. Aplikasi ini menyediakan fitur OPAC (Online Public Access Catalog), Portal Pemustaka, dan Dashboard Administrasi lengkap.

## 🚀 Fitur Utama

- **OPAC & Portal Pemustaka:** Pencarian buku, ketersediaan, dan riwayat peminjaman bagi siswa dan guru.
- **Manajemen Sirkulasi:** Peminjaman, pengembalian, dan perhitungan denda otomatis.
- **Otomatisasi Akun:** Generate akun login massal untuk Siswa dan Guru berdasarkan NIS/NIP.
- **Katalog Buku & Inventaris:** Pencatatan detail buku (ISBN, Penulis, Penerbit) dan eksemplar.
- **Dashboard & Laporan:** Statistik perpustakaan, grafik kunjungan/peminjaman, dan ekspor laporan ke Excel.
- **Multi-Role Access Control:** Hak akses yang dibedakan berdasarkan peran (Superadmin, Admin, Pustakawan, Kepsek, Guru, Siswa).

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, Lucide Icons, Framer Motion (Animasi), Recharts (Grafik).
- **Backend:** Node.js, Express.js.
- **Database:** Local JSON Storage (`library_db.json`).
- **Otentikasi:** JWT (JSON Web Tokens) & bcryptjs.

## 📁 Struktur Direktori Utama

```text
├── data/               # Menyimpan file database lokal JSON (library_db.json)
├── public/             # Asset statis publik (gambar, icon, logo, dll)
├── server/             # Kode Backend (Express.js)
│   ├── routes/         # Endpoint API (auth, books, members, dll)
│   ├── auth.ts         # Middleware otentikasi JWT
│   └── db.ts           # Service untuk baca/tulis JSON database
├── src/                # Kode Frontend (React)
│   ├── components/     # Komponen UI yang dapat digunakan kembali (UI library)
│   ├── pages/          # Halaman aplikasi (Dashboard, Katalog, Pengaturan)
│   └── types.ts        # Definisi tipe data TypeScript global
├── server.ts           # Titik masuk (entry point) utama server aplikasi
└── vite.config.ts      # Konfigurasi *bundler* Vite
```

## 🔑 Kredensial Default (Testing / Initial Setup)

Berikut adalah akun standar yang sudah di-generate di dalam sistem awal:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Superadmin** | `superadmin` | `wplsadmin` |
| **Administrator** | `admin` | `admin123` |
| **Pustakawan** | `pustakawan` | `widya123` |
| **Kepala Sekolah** | `kepsek` | `kswidya` |

## 💻 Panduan Instalasi & Menjalankan Lokal

Pastikan [Node.js](https://nodejs.org/) sudah terinstal di komputer Anda.

1. **Clone repository ini**
   ```bash
   git clone <url-repo-github-anda>
   cd widya-pustaka
   ```

2. **Install dependensi (Library)**
   ```bash
   npm install
   ```

3. **Jalankan server untuk pengembangan (Development)**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan (biasanya di `http://localhost:3000`). Frontend dan Backend berjalan bersamaan berkat konfigurasi Express & Vite Middleware.

4. **Build untuk Production**
   ```bash
   npm run build
   ```

5. **Jalankan hasil Build (Production)**
   ```bash
   npm run start
   ```

## ⚙️ Panduan Konfigurasi Environment (Variabel Lingkungan)
Jika Anda ingin mengamankan JWT atau menghubungkan ke API Eksternal, buat file bernama `.env` di direktori utama *(root)* dengan menyalin format dari `.env.example`:
```env
# Contoh isi .env
JWT_SECRET=rahasia_jwt_anda_yang_sangat_panjang_123
```
*Catatan: File `.env` tidak akan dan tidak boleh di-push ke GitHub untuk alasan keamanan.*

## 💾 Panduan Backup & Restore Database (Lokal)
Karena versi ini menggunakan penyimpanan `JSON` lokal untuk memudahkan pengujian:
- **Backup:** Copy dan simpan file `data/library_db.json` secara berkala ke tempat aman (misalnya ke Google Drive atau Flashdisk). File ini berisi *seluruh* data buku, anggota, peminjaman, dan pengaturan.
- **Restore:** Timpa file `data/library_db.json` yang ada di server dengan file backup Anda, lalu *restart* server (`npm run dev` atau `npm run start`). Fitur Backup & Restore juga tersedia langsung dari antarmuka Web pada menu **Pengaturan**.

## 🌐 Panduan Deployment ke Vercel

Sistem ini adalah aplikasi Full-stack (React + Express backend) yang membutuhkan penyesuaian saat di-deploy ke platform *Serverless* seperti Vercel.

**PERINGATAN PENTING UNTUK VERCEL:** 
Vercel menggunakan sistem file *ephemeral* (read-only pada runtime). Karena sistem ini secara *default* menggunakan file `library_db.json` untuk menyimpan data, **perubahan data baru (seperti menambah buku/anggota) tidak akan tersimpan secara permanen** setelah serverless function mati/restart (biasanya terjadi dalam beberapa menit/jam).

Jika Anda hanya ingin men-deploy untuk keperluan demonstrasi/pratinjau UI:

1. Buat akun dan login ke [Vercel](https://vercel.com).
2. Hubungkan akun GitHub Anda ke Vercel.
3. Klik **Add New Project** dan import repository aplikasi ini.
4. Pada bagian **Build and Output Settings**:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Klik **Deploy** dan tunggu proses selesai.

## 🗄️ Rekomendasi Migrasi Database (Untuk Production)
Agar aplikasi dapat di-deploy secara *Production-ready* di layanan serverless (seperti Vercel, Netlify, atau Render) dengan penyimpanan data permanen, **sangat direkomendasikan** untuk mengubah sumber database dari `JSON Lokal` ke **Cloud Database**.

Langkah migrasi:
1. Pilih layanan database seperti **Firebase Firestore**, **Supabase (PostgreSQL)**, atau **MongoDB Atlas**.
2. Modifikasi file `server/db.ts` dan ganti fungsi baca/tulis JSON `fs.readFileSync` & `fs.writeFileSync` dengan API/SDK database pilihan Anda.
3. Anda dapat menggunakan Firebase Admin SDK (telah tersedia di `package.json` proyek ini) apabila memilih menggunakan Firebase. 

---
*Dikembangkan secara khusus untuk memajukan literasi dan digitalisasi ekosistem pendidikan di SMA Negeri 3 Nganjuk.*
