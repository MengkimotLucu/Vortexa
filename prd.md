# Product Requirement Document (PRD)
## Project: LUMOVELO Landing Page (V1.0)

---

## 1. Project Overview & Objective
* **Brand Name:** LUMOVELO
* **Tagline Concept:** *We don’t just build software. We engineer digital growth.*
* **Objective:** Membangun website profil *full-stack growth agency* (AI, Software Dev, SEO, Design) yang berorientasi pada konversi tinggi (*high-converting sales funnel*), menyasar klien UMKM hingga Enterprise Global. Target utama: Menghasilkan leads WhatsApp secara konsisten setiap bulan.
* **Target Audience:** Startup founders, UMKM pemilik bisnis yang ingin digitalisasi, dan IT Decision Makers di korporat skala global.

---

## 2. Design & Visual Identity (Gen Z Futuristic Minimalist)
* **Theme:** Dark Mode Dominant (Premium & Tech-forward).
* **Color Palette:** Deep Cyber Black/Charcoal, Neon Purple/Violet (#8B5CF6) sebagai warna aksen, dan Emerald Green (#10B981) untuk elemen konversi (CTA/WhatsApp).
* **UI/UX Style:** 
  * *Glassmorphic Effects* (elemen transparan seperti kaca).
  * *Bold & Clean Typography* (Menggunakan font Sans-Serif modern seperti Inter atau Syne).
  * *Micro-interactions & Smooth Scrolling* untuk memberikan kesan teknologi tinggi saat web dijelajahi.

---

## 3. Tech Stack & Architecture
* **Architecture:** 100% Static Site Generation (SSO) — Tidak menggunakan database server untuk menjamin kecepatan *loading* < 1.5 detik, keamanan mutlak, dan performa SEO SEO yang maksimal.
* **Framework:** Next.js (React) atau Astro.
* **Styling:** Tailwind CSS.
* **Deployment & Hosting:** Vercel atau Netlify (Global CDN, Auto-SSL).
* **Tracking & Analytics:** Google Analytics 4 (GA4) + Meta Pixel terintegrasi di setiap tombol CTA.

---

## 4. Structure & Page Flow (Sitemap)
Website ini berupa satu halaman panjang (*Single-Page Landing Page*) dengan struktur alur psikologi marketing sebagai berikut:

### Section 1: Hero Section (The Hook)
* **Visual:** Animasi partikel melingkar (Vortex) statis yang interaktif di latar belakang.
* **Headline:** *"Transforming Bold Ideas into Scalable AI, Software, & Digital Growth."*
* **Sub-headline:** Penjelasan transparan tentang siapa kita: *"Kami adalah tim kolektif engineer, desainer, dan pakar pertumbuhan digital yang membantu bisnis Anda mendominasi pasar lokal maupun global."*
* **Primary CTA Button:** "Konsultasi Proyek Gratis" (Desain mencolok dengan efek menyala).

### Section 2: Real-time Data Simulator (The Social Proof Fake-Trigger)
* **Fitur:** Komponen JavaScript interaktif yang menampilkan data bergerak naik secara otomatis sejak user membuka halaman (Statis tanpa database, digerakkan script).
* **Tampilan:**
  * `[Counter Bergerak] Tokens Processed by our AI Today`
  * `[Counter Bergerak] Organic Impressions Generated for Clients`
  * `99.9% Uptime Guaranteed Code`

### Section 3: Core Services (What We Do)
Kartu layanan interaktif (bisa di-hover dengan efek glassmorphism):
1. **AI & Automation Integration:** Pembuatan sistem pintar untuk efisiensi bisnis.
2. **High-Performance Web & Mobile Apps:** Koding bersih, cepat, dan siap pakai.
3. **Advanced SEO & Marketing Funnel:** Membawa bisnis Anda ke halaman pertama Google secara global.
4. **Futuristic UI/UX Design:** Desain visual modern yang mengonversi pengunjung menjadi pembeli.

### Section 4: Live Demo Showcase (The Proof)
* **Konten:** Grid portofolio interaktif yang menampilkan *mockup* proyek siap pakai. 
* **Tautan:** Setiap kartu mengarah ke tautan demo publik (seperti GitHub/Figma/Live Demo) untuk membuktikan kemampuan teknis tim.

### Section 5: The "Scarcity" Funnel & Multi-Step Form (The Closing Machine)
Sebelum dialihkan ke WhatsApp, user diminta mengisi kuesioner singkat untuk menyaring klien berkualitas (*qualified leads*).
* **Form Questions:**
  1. Siapa nama Anda?
  2. Apa nama bisnis/perusahaan Anda?
  3. Layanan apa yang Anda butuhkan? (Dropdown: AI / Web / SEO / Design / Semua)
  4. Berapa estimasi budget proyek Anda? (Dropdown: < $1k, $1k - $5k, $5k - $20k, $20k+)
* **Urgency Text:** *"Slot konsultasi gratis terbatas untuk 3 klien baru bulan ini. Sisa 1 slot tersedia."*

---

## 5. Technical Integration: Form to WhatsApp Logic

Saat user menekan tombol **"Submit & Mulai Konsultasi"**, sistem tidak menyimpan data ke database, melainkan menjalankan fungsi JavaScript untuk membuka API WhatsApp.

### Spesifikasi Logika Koding:
* **Nomor WhatsApp Tujuan:** `6285624353611`
* **Format Pesan Otomatis (URL Encoded):**
```text
Halo Tim Lumovelo, saya ingin mengajukan konsultasi proyek. Berikut detailnya:

- Nama: [Input Nama]
- Perusahaan: [Input Perusahaan]
- Kebutuhan: [Input Layanan]
- Estimasi Budget: [Input Budget]

Tolong jadwalkan waktu untuk diskusi ya. Terima kasih!