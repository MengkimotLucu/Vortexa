# Product Requirement Document (PRD)
## Project: LUMOVELO Agency Website (V2.0 - Redesign)

---

## 1. Project Overview & Objective
* **Brand Name:** LUMOVELO
* **Concept:** Creative Growth Agency (Web Development, AI Automation, SEO, Video Editing).
* **Tagline Concept:** *We don’t just build software. We engineer digital growth.*
* **Objective:** Membangun website profil *creative growth agency* premium berorientasi pada konversi tinggi (*high-converting leads generator*) dengan menyingkirkan gaya kaku Neo-Brutalisme, beralih ke estetika **Premium Cyber-Minimalism (Light Mode)**.
* **Target Audience:** Startup founders, UMKM pemilik bisnis yang ingin melakukan digitalisasi, Content Creators, dan IT Decision Makers di korporat skala global/lokal.
* **Conversion Goal:** Menghasilkan qualified leads secara langsung via WhatsApp dengan kuesioner terintegrasi.

---

## 2. Design & Visual Identity (Premium Cyber-Minimalism - Light Mode)
* **Theme:** Light Mode Dominant (Clean, Modern, & High-tech).
* **Color Palette:**
  * **Background Utama:** Pure White (`#FFFFFF`) & Soft Frost White (`#F8FAFC`).
  * **Warna Aksen:** Royal Blue (`#2563EB`) untuk kredibilitas/teknologi, dan Electric Cyan (`#06B6D4`) untuk sentuhan AI/kreativitas.
  * **Warna Teks:** Deep Navy/Slate (`#0F172A`) untuk kontras tinggi dan kenyamanan membaca.
  * **Warna Konversi (CTA):** Emerald Green (`#10B981`) khusus untuk tombol WhatsApp.
* **UI/UX Style:**
  * **Bento Grid Layout:** Struktur grid modern terintegrasi yang responsif, menyusun info secara rapi baik di desktop maupun mobile.
  * **Glassmorphic Elements:** Kartu transparan dengan border biru tipis (`rgba(37,99,235,0.08)`) dan efek blur latar belakang.
  * **Typography:** Headline menggunakan font Sans-Serif berkarakter kuat (**Syne** atau **Outfit**), sedangkan body text menggunakan font modern fungsional (**Inter** atau **Plus Jakarta Sans**).
  * **Micro-interactions:** Animasi penunjuk (hover) 3D, magnetik button, dan fluid scroll.

---

## 3. Tech Stack & Architecture
* **Architecture:** Static Site Generation (SSG) via Astro Framework. Menjamin kecepatan loading < 1.5 detik di mobile dan performa SEO maksimal.
* **Styling:** Tailwind CSS.
* **Interactive/3D Animation:** 
  * Animasi 3D interaktif menggunakan **Rive App (Lottie/Canvas)** atau **Three.js/Spline** (WebGL teroptimasi).
  * **Lazy Hydration:** Integrasi menggunakan directive Astro `client:visible` agar asset 3D tidak membebani loading awal halaman di HP.
* **Hosting & Deployment:** Vercel / Netlify.
* **Analytics:** Google Analytics 4 + Facebook Pixel terintegrasi pada event submit form.

---

## 4. Structure & Page Flow (Sitemap)

Website dirancang menggunakan arsitektur multi-halaman ramping untuk mengoptimalkan mobile UX dan performa SEO.

### A. Halaman Utama (Home Page - Single-Page Funnel)
Halaman utama berfungsi sebagai core landing page yang fokus pada penawaran jasa pembuatan website secara instan.

* **Section 1: Hero Section (Kinetic Editor Workspace)**
  * **Visual:** Kanvas visual di tengah dengan toolbar interaktif di bawahnya (`Code`, `AI`, `SEO`, `Render`). User dapat menekan tombol untuk melihat transformasi kanvas secara 3D (elemen koding terbang, transisi video, grafik SEO tumbuh).
  * **Headline:** *"Transforming Bold Ideas into Scalable AI, Websites, & Digital Growth."*
  * **Primary CTA:** "Lihat Paket Harga" (smooth scroll ke Section 2).

* **Section 2: Paket Jasa Pembuatan Website (Tab Pricing)**
  * **Fitur Tab:** Pilihan tab antara *Landing Page / Company Profile / Toko Online / Redesign / Maintenance*.
  * **Layout Mobile:** Ditampilkan dalam bentuk **Horizontal Swipeable Carousel** agar user HP mudah menggeser paket tanpa memakan tempat vertikal.
  * **Struktur Kartu:** Menyajikan 3 opsi paket (UMKM, SMB, Business) dengan detail harga, daftar fitur, dan tombol CTA hijau "Konsultasi via WhatsApp".

* **Section 3: Real-time Data Simulator & Social Proof**
  * Metrik statis interaktif (statis tanpa database, dijalankan JS) berupa counter bergerak:
    * `[Counter] Impresi Organik Klien`
    * `[Counter] AI Tokens Diproses`
    * `99.9% Uptime Kode Garansi`
  * Barisan logo partner/klien dalam bentuk greyscale yang bersih.

* **Section 4: Portofolio Unggulan (Featured Projects)**
  * Slider horizontal berisi 3-4 mockup proyek website terbaik. Setiap item memiliki link eksternal ke live demo.

* **Section 5: Multi-Step Lead Qualification Form**
  * Formulir interaktif bergaya Typeform (kaca transparan) sebelum diarahkan ke WhatsApp untuk menyaring leads berkualitas.

---

### B. Subhalaman Terpisah (Akses via Navbar Dropdown)
Untuk layanan non-website, disediakan halaman tersendiri demi optimasi SEO halaman spesifik.

1. **Jasa Integrasi AI & Otomatisasi (`/layanan/ai`):**
   * Fokus pada pembuatan chatbot kustom, otomatisasi alur kerja, integrasi API LLM (ChatGPT/Claude).
2. **Advanced SEO & Marketing Funnel (`/layanan/seo`):**
   * Fokus pada optimasi pencarian organik, riset keyword, auditing, dan strategi konversi berbayar.
3. **Jasa Edit Video & Aset Kreatif (`/layanan/video`):**
   * Fokus pada portofolio video (TikTok, YouTube Shorts, Company Profile) menggunakan video player terintegrasi yang estetik dan grid interaktif.
4. **Portofolio Lengkap (`/portofolio`):**
   * Galeri lengkap semua kategori proyek yang dilengkapi tombol filter (All, Web, AI, SEO, Video).
5. **Tentang Kami & Karir (`/tentang`):**
   * Profil singkat tim Lumovelo dan lowongan kerja aktif (jika ada).

---

## 5. Technical Integration: Form to WhatsApp Logic

Setiap form submit akan memicu fungsi JavaScript untuk mengonversi data input menjadi tautan WhatsApp dinamis.

### Spesifikasi Teknis:
* **Nomor Tujuan:** `6285624353611`
* **Alur Logika:**
  1. User mengisi kuesioner 3-langkah (Nama, Nama Bisnis, Layanan, Estimasi Budget).
  2. Klik tombol "Mulai Konsultasi".
  3. Sistem me-render URL WhatsApp dengan format pesan:
     ```text
     Halo Tim Lumovelo, saya ingin berkonsultasi mengenai proyek saya:
     
     - Nama: [Nama]
     - Bisnis/Perusahaan: [Bisnis]
     - Kebutuhan Jasa: [Layanan]
     - Estimasi Budget: [Budget]
     
     Tolong jadwalkan waktu untuk diskusi ya. Terima kasih!
     ```
  4. User otomatis diarahkan ke aplikasi WhatsApp/WhatsApp Web.