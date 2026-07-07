# Rencana Implementasi Dashboard Admin Lumovelo

Dokumen ini memuat spesifikasi arsitektur teknis dan rancangan fitur untuk dashboard admin dan sistem database Lumovelo, yang mencakup manajemen dokumen, pembagian hasil, keamanan data, rekap keuangan, serta formulir undangan digital.

---

## 1. Modul Manajemen Dokumen (Workspace, MOU, RAB, Kuitansi)

Modul ini memindahkan pengelolaan administrasi dari file markdown/manual ke dashboard dinamis.

*   **Fitur Utama**:
    *   **Dashboard Dokumen**: Menampilkan daftar seluruh dokumen aktif (SPK, MOU, RAB, Kuitansi, BAST) dengan status draft, terbit, atau ditandatangani.
    *   **Form Pembuat Otomatis**: Formulir input interaktif yang otomatis menyusun teks dokumen berdasarkan template resmi agensi.
    *   **Ekspor PDF**: Mengunduh dokumen secara instan dalam format PDF resmi berstempel agensi menggunakan library JavaScript.
    *   **Penyimpanan Cloud**: Menyimpan arsip dokumen digital secara aman di Supabase Storage.

---

## 2. Sistem Pembagian Hasil Rekan Tim (Profit Sharing)

Sistem pencatatan keuangan internal untuk melacak komisi rekan tim pelaksana proyek.

*   **Struktur Pembagian Hasil**:
    *   Sistem mencatat porsi pembagian kas agensi (operational fee) dan bagian pelaksana tugas (designer, developer, copywriter, dsb).
    *   Pencatatan dilakukan per proyek yang terdaftar di database.
*   **Fitur Utama**:
    *   **Manajemen Anggota**: Daftar anggota tim aktif beserta perannya.
    *   **Modul Penugasan**: Menghubungkan anggota tim ke proyek tertentu dengan persentase bagian yang disepakati.
    *   **Catatan Pembayaran**: Status komisi (Belum Dibayar, Parsial, Lunas) dilengkapi tombol konfirmasi transfer.

---

## 3. Otentikasi Keamanan (Secure Admin Login)

Keamanan tingkat tinggi untuk membatasi akses dashboard hanya bagi admin agensi.

*   **Autentikasi & Hashing**:
    *   Menggunakan **Supabase Auth** untuk mengelola session login admin dengan aman.
    *   Password di-hash menggunakan algoritma **bcrypt** berkekuatan tinggi sebelum disimpan ke database.
*   **Perlindungan SQL Injection**:
    *   Komunikasi dengan database dilakukan menggunakan client library resmi Supabase (PostgREST API).
    *   Setiap query otomatis menggunakan metode *Parameterized Queries* / *Prepared Statements*, sehingga input teks dari luar tidak akan dieksekusi sebagai perintah SQL database.
*   **Proteksi Halaman**:
    *   Setiap halaman dashboard dilindungi oleh middleware pengecekan token JWT (JSON Web Tokens) di sisi server.
    *   Halaman dashboard diproteksi dengan tag meta `noindex, nofollow` agar tidak muncul di pencarian Google.

---

## 4. Rekapan Keuangan Bulanan (Template Excel / Sheet)

Modul laporan finansial bulanan yang dapat diekspor langsung ke format lembar sebar (Excel / CSV).

*   **Format Kolom Rekapitulasi**:
    1.  `Nama Klien` (Client Name)
    2.  `Nomor Kontak` (WhatsApp / Telepon)
    3.  `Tanggal Pemesanan` (Order Date)
    4.  `Deadline Pelaksanaan` (Target Selesai)
    5.  `Keterangan Tugas` (Scope of Work / Layanan)
    6.  `Nama Eksekutor` (Tim Penanggung Jawab)
    7.  `Status Proyek` (Proses / Selesai)
    8.  `Total Nilai Kontrak` (Nilai Invoice)
*   **Fitur Utama**:
    *   Filter pencarian berdasarkan bulan pemesanan dan status pengerjaan.
    *   Tombol *Export to Excel/CSV* sekali klik.

---

## 5. Sisi Klien: Formulir Khusus Layanan Undangan Digital

Formulir eksternal mandiri agar klien dapat mengisi data undangan mereka secara rapi.

*   **Skema Data Input Mempelai**:
    *   *Informasi Pria*: Nama lengkap, nama panggilan, nama orang tua (ayah & ibu), username Instagram.
    *   *Informasi Wanita*: Nama lengkap, nama panggilan, nama orang tua (ayah & ibu), username Instagram.
*   **Skema Acara & Lokasi**:
    *   *Akad Nikah*: Tanggal, jam mulai s/d selesai, alamat lokasi, URL Google Maps.
    *   *Resepsi Pernikahan*: Tanggal, jam mulai s/d selesai, alamat lokasi, URL Google Maps.
*   **Skema Media & Fitur**:
    *   Unggah galeri foto (maksimal 10 file) dan input link background music.
    *   Input data rekening bank atau QR Code E-Wallet untuk fitur angpao digital.
    *   Input nomor WhatsApp penerima RSVP konfirmasi kehadiran tamu.
*   **Sistem Validasi**:
    *   Formulir mendeteksi kesalahan pengetikan sebelum disubmit.
    *   Data langsung masuk ke tabel Supabase dan otomatis memicu pembuatan halaman web undangan baru.

* supabase publik Api Key : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZ2FndHZob2pwbWFqdXV1b2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyODA4OTEsImV4cCI6MjA5ODg1Njg5MX0.fUSEWjd4cHYd1lYozKGcIx4zOfNcrBA0LpoAgm-Olvc
* supabase sceret Api Key : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZ2FndHZob2pwbWFqdXV1b2R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI4MDg5MSwiZXhwIjoyMDk8ODU2ODkxfQ.waKu3JLvKSM5mABOpdORY0EyKW81JR0yzmDtqlGCJKk

---

## 6. Konfigurasi DNS Subdomain & Vercel (Link Undangan Digital)

Untuk mengaktifkan fitur link kustom tanpa merusak domain utama website agensi Anda (`lumovelo.com`), gunakan subdomain khusus:

### A. Pengaturan di DNS Zone Editor Hostinger
1.  Masuk ke panel Hostinger Anda.
2.  Buka **DNS Zone Editor** untuk domain utama Anda (`lumovelo.com` atau `lumovelo.agency`).
3.  Tambahkan satu record baru dengan tipe **CNAME**:
    *   **Host (Nama Subdomain)**: `undangan` (atau `wedding`)
    *   **Target (Points to)**: `cname.vercel-dns.com`
    *   **TTL**: Default (misal 14400 atau 3600)
4.  Klik **Add Record**.

### B. Pengaturan di Dashboard Vercel
1.  Buka proyek website Anda di Vercel.
2.  Masuk ke menu **Settings -> Domains**.
3.  Klik **Add** dan masukkan subdomain baru Anda: `undangan.lumovelo.com` (sesuai nama domain utama Anda).
4.  Vercel akan mendeteksi DNS Record dari Hostinger secara otomatis dan mengubah statusnya menjadi **Valid**.

### C. Alur Kerja Akses Link Kustom
*   Semua link undangan pernikahan klien diakses melalui: `undangan.lumovelo.com/[slug-klien]`
*   Setiap request akan diarahkan ke Vercel Serverless Function, yang akan mencocokkan `slug-klien` ke database Supabase dan menampilkan tema undangan terpilih secara instan.
*   Tombol ON/OFF di Dashboard Admin memperbarui status record di tabel `wedding_invitations` Supabase, sehingga server tahu apakah harus menampilkan undangan atau memblokir akses jika dinonaktifkan (OFF).