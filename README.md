# Sistem Manajemen Perpustakaan Terpadu

Aplikasi web modern untuk pengelolaan operasional perpustakaan sekolah/institusi, mencakup manajemen koleksi, sirkulasi, laporan analitik, dan koleksi digital.

## 🚀 Fitur Utama

- **Manajemen Sirkulasi Cepat**: Proses peminjaman dan pengembalian buku yang efisien, terintegrasi dengan pemindaian barcode/kamera.
- **Koleksi Digital (E-Book)**: Pengelolaan dan akses materi referensi digital untuk diunduh langsung oleh anggota.
- **Manajemen Denda & Sanksi**: Pelacakan otomatis denda keterlambatan dengan fitur pembayaran dan pembebasan denda.
- **Laporan Analitik**: Dashboard laporan dengan visualisasi data tren peminjaman bulanan/tahunan.
- **Manajemen Buku & Anggota**: Impor/ekspor data buku dan anggota via format Excel.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS
- **Visualisasi**: Recharts
- **Bahasa**: TypeScript
- **Runtime**: Node.js

## 📦 Panduan Instalasi Lokal

Untuk menjalankan aplikasi ini di PC lokal Anda, pastikan **Node.js** dan **Git** sudah terinstal.

1. **Clone repository:**
   ```bash
   git clone <URL_REPOSITORY_ANDA>
   cd <NAMA_FOLDER_REPOSITORY>

   Instal dependensi:
code
Bash
npm install
Jalankan aplikasi:
code
Bash
npm run dev
Akses aplikasi:
Buka browser dan arahkan ke http://localhost:3000.
💡 Tips Penggunaan Lokal
Anda dapat membuat file jalankan_perpustakaan.bat di folder utama aplikasi dengan konten berikut agar aplikasi lebih mudah dijalankan dengan klik dua kali:
code
Batch
@echo off
cd /d "%~dp0"
start http://localhost:3000
npm run dev
Dikembangkan untuk efisiensi operasional perpustakaan.
code
Code
---

Setelah menempelkan teks tersebut, klik tombol **Commit new file** di bagian bawah halaman GitHub untuk menyimpan README Anda. Dengan ini, siapapun yang membuka repository Anda akan langsung memahami fungsi dan cara menjalankan aplikasi Anda.
