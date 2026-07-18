# 📚 Cahaya ATK

<div align="center">
  <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1.14-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-2.97.0-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</div>

<br />

**Cahaya ATK** adalah aplikasi penyedia Alat Tulis Kantor dan Perlengkapan Sekolah terlengkap, dirancang untuk memberikan pengalaman belanja yang mudah, cepat, dan terpercaya. Aplikasi ini mencakup antarmuka toko bagi pelanggan serta dashboard admin untuk pengelolaan produk dan pesanan.

---

## ✨ Fitur Utama

- **Antarmuka Minimalis & Modern**: Animasi mulus dengan `framer-motion` dan desain responsif menggunakan Tailwind CSS.
- **Katalog Produk Lengkap**: Jelajahi berbagai macam perlengkapan sekolah dan kantor dengan mudah.
- **Keranjang Belanja (Shopping Cart)**: Pengalaman berbelanja yang intuitif.
- **Manajemen Admin (Dashboard)**: Kelola pesanan, inventaris produk, dan pengaturan profil toko dari satu dashboard pusat.
- **Pembuatan Dokumen Otomatis**: Generate *Faktur Penjualan*, *Invoice Tagihan*, dan *Surat Pesanan* dalam format PDF.
- **Integrasi Database**: Menggunakan **Supabase** untuk backend dan manajemen data.
- **Dukungan Mobile**: Kompatibel dengan plugin *Capacitor*.

## 🛠️ Teknologi yang Digunakan

* **Frontend**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS, Lucide React (Icons), Framer Motion (Animasi)
* **Backend / BaaS**: Supabase
* **Utilitas Ekstra**: 
  * `jsPDF` untuk dokumen PDF
  * `sonner` untuk notifikasi Toast

## 🚀 Cara Menjalankan Secara Lokal

**Prasyarat:** Node.js terinstal.

1. **Install dependensi:**
   ```bash
   npm install
   ```
2. **Konfigurasi Environment Variables:**
   Atur variabel lingkungan seperti kredensial Supabase sesuai kebutuhan aplikasi.
3. **Jalankan aplikasi:**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan dan siap diakses.

## 📦 Build untuk Produksi

Untuk melakukan kompilasi aplikasi untuk lingkungan produksi:
```bash
npm run build
```
Output akan berada di dalam folder `dist/`.

---
*Dibuat dengan ❤️ untuk kebutuhan edukasi & bisnis Anda.*