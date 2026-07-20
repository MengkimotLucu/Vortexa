# Dokumentasi File & Folder Proyek

Berikut adalah daftar seluruh file di dalam proyek beserta penjelasan fungsinya secara singkat, jelas, dan langsung pada intinya.

---

## 1. File Konfigurasi (Root)

*   **@[astro.config.mjs]**: Konfigurasi utama framework Astro, mengatur integrasi CSS, React, pembuatan sitemap, serta pengaturan bahasa (routing i18n Indonesia & Inggris).
*   **@[package.json]**: Menyimpan daftar library dependencies dan skrip perintah proyek (dev, build, preview).
*   **@[tsconfig.json]**: Konfigurasi compiler TypeScript dan alias path impor.
*   **@[prd.md]**: Product Requirement Document (PRD) yang mendefinisikan seluruh spesifikasi kebutuhan dan fitur aplikasi.
*   **@[README.md]**: Panduan dasar cara menjalankan dan melakukan build proyek untuk developer.
*   **@`.env`**: Menyimpan variabel lingkungan (environment variables) sensitif seperti API key.
*   **@`.gitignore`**: Menentukan file dan folder yang diabaikan oleh Git.

---

## 2. Aset Statis (public/)

*   **@[public/robots.txt]**: Mengatur instruksi perayapan (crawling) untuk mesin pencari, memblokir crawler pada folder dokumen privat.
*   **@[public/favicon.ico]** & **@[public/favicon.svg]**: Ikon logo situs agensi yang muncul di tab browser.

---

## 3. Layout Utama (src/layouts/)

*   **@[src/layouts/Layout.astro]**: Template HTML5 utama untuk semua halaman. Berisi konfigurasi meta tag SEO, Open Graph, Twitter Card, penanganan bahasa, Google Tag Manager, preload font, dan JSON-LD schema organisasi.

---

## 4. Gaya & Library CSS (src/styles/)

*   **@[src/styles/global.css]**: File CSS global untuk impor Tailwind CSS dan definisi class kustom seperti tema warna, scrollbar, dan animasi.

---

## 5. Koneksi Database & API (src/lib/)

*   **@[src/lib/supabase.js]**: Menginisialisasi koneksi client database Supabase untuk pemrosesan data backend.

---

## 6. Komponen UI (src/components/)

*   **@[src/components/Logo.astro]**: Logo ikon SVG agensi.
*   **@[src/components/LanguageSwitcher.astro]**: Tombol pemilih bahasa (ID/EN) untuk navigasi multibahasa.
*   **@[src/components/CursorGlow.astro]**: Efek aura cahaya gradien interaktif yang mengikuti kursor mouse di desktop.
*   **@[src/components/WhatsAppFloating.astro]**: Tombol melayang WhatsApp di pojok kanan bawah dengan efek gelombang ping.
*   **@[src/components/VortexBackground.astro]**: Animasi latar belakang canvas interaktif berupa partikel vortex.
*   **@[src/components/Breadcrumbs.astro]**: Navigasi remah roti (*breadcrumbs*) untuk mempermudah navigasi user dan SEO.
*   **@[src/components/Hero.astro]**: Header banner visual utama halaman depan dengan tagline rotasi teks dinamis.
*   **@[src/components/WhyChooseUs.astro]**: Bento grid berisi keunggulan teknologi (serverless, headless database, kecepatan).
*   **@[src/components/AboutUs.astro]**: Bagian informasi profil singkat agensi.
*   **@[src/components/Services.astro]**: Dashboard paket harga layanan dengan tab kategori navigasi.
*   **@[src/components/Portfolio.astro]**: Galeri studi kasus portofolio proyek lengkap dengan sistem filter kategori, paginasi, dan pop-up lightbox.
*   **@[src/components/Testimonials.astro]**: Menampilkan ulasan kepuasan dari klien.
*   **@[src/components/FAQ.astro]**: Daftar pertanyaan umum (FAQ) dalam bentuk akordeon interaktif.
*   **@[src/components/Kontak.astro]**: Bagian formulir konsultasi serta peta lokasi agensi.
*   **@[src/components/Blog.astro]**: Daftar postingan artikel blog.
*   **@[src/components/Footer.astro]**: Navigasi kaki halaman (links navigasi i18n, social media, dan copyright).
*   **@[src/components/ui/demo.tsx]**: File demo komponen visual interaktif berbasis React.
*   **@[src/components/ui/testimonials-columns-1.tsx]**: Layout grid ulasan kolom tunggal bertenaga React.

---

## 7. Rute Halaman (src/pages/)

*   **@[src/pages/index.astro]**: Halaman beranda utama (Bahasa Indonesia) beserta FAQPage JSON-LD Schema.
*   **@[src/pages/tentang.astro]**: Halaman profil agensi.
*   **@[src/pages/kontak.astro]**: Halaman form pengajuan proyek.
*   **@[src/pages/karir.astro]**: Halaman peluang kolaborasi agensi.
*   **@[src/pages/portofolio.astro]**: Halaman portofolio karya.
*   **@[src/pages/layanan.astro]**: Katalog lengkap daftar harga paket jasa agensi.
*   **@[src/pages/privacy-policy.astro]**: Halaman kebijakan privasi.
*   **@[src/pages/terms-of-service.astro]**: Halaman syarat dan ketentuan layanan.

### Subfolder Halaman

#### A. /blog/ (Artikel Wawasan)
*   **@[src/pages/blog/index.astro]**: Halaman daftar artikel blog.
*   **@[src/pages/blog/[slug].astro]**: Router dinamis detail artikel berdasarkan slug URL.

#### B. /layanan/ (Halaman Detail Sub-Jasa)
*   **@[src/pages/layanan/web.astro]**: Halaman detail jasa pembuatan website kustom & landing page (memiliki Product Schema).
*   **@[src/pages/layanan/ai.astro]**: Halaman detail jasa otomatisasi & integrasi agen AI LLM.
*   **@[src/pages/layanan/seo.astro]**: Halaman detail jasa optimasi SEO & marketing.
*   **@[src/pages/layanan/video.astro]**: Halaman detail jasa edit video & aset kreatif.
*   **@[src/pages/layanan/qa.astro]**: Halaman detail jasa Software QA & testing (QA Center).


#### C. /en/ (Mirror Halaman Bahasa Inggris)
file mirror yang merender halaman ID dengan konten bahasa Inggris berdasarkan deteksi locale dinamis:
*   `index.astro`, `about-us.astro`, `careers.astro`, `contact.astro`, `portfolio.astro`, `privacy-policy.astro`, `terms-of-service.astro`, `layanan.astro`.
*   `/layanan/ai.astro`, `/layanan/seo.astro`, `/layanan/video.astro`, `/layanan/web.astro`, `/layanan/qa.astro`.

#### D. /admin/ (Panel Administrasi - Terproteksi noindex)
*   **@[src/pages/admin/dashboard.astro]**: Halaman dasbor panel kontrol utama.
*   **@[src/pages/admin/finance.astro]**: Halaman pengelolaan laporan keuangan.
*   **@[src/pages/admin/profit-sharing.astro]**: Halaman perhitungan bagi hasil tim agensi.
*   **@[src/pages/admin/blog.astro]**: Halaman dashboard pembuatan & edit artikel blog.
*   **@[src/pages/admin/login.astro]**: Pintu masuk secure login tim agensi.

#### E. /workspace/ (Pembuat Dokumen Klien - Terproteksi noindex)
Builder dokumen transaksi interaktif agensi dengan fitur ekspor eksternal (Word/PDF):
*   **@[src/pages/workspace/spk.astro]**: Surat Perintah Kerja.
*   **@[src/pages/workspace/mou.astro]**: Memorandum of Understanding.
*   **@[src/pages/workspace/rab.astro]**: Rencana Anggaran Biaya.
*   **@[src/pages/workspace/invoice.astro]**: Tagihan Pembayaran.
*   **@[src/pages/workspace/kuitansi.astro]**: Tanda Terima.
*   **@[src/pages/workspace/srs.astro]**: Spesifikasi Fitur Teknis.
*   **@[src/pages/workspace/bast.astro]**: Berita Acara Serah Terima.
