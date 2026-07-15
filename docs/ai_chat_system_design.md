# Desain Sistem Integrasi AI Chat & Otomatisasi Follow-Up (Biaya Rp 0)

Dokumen ini menjelaskan rancangan arsitektur, skema database, alur kerja, dan langkah implementasi untuk menambahkan fitur AI Chat, pencatatan prospek (leads) otomatis ke dashboard admin, serta sistem follow-up berbasis WhatsApp Link/Telegram secara gratis.

---

## 1. Arsitektur & Teknologi (100% Free Tier)

*   **Platform Web**: Astro (Framework utama proyek saat ini).
*   **Database**: Supabase (PostgreSQL gratis untuk penyimpanan sesi obrolan dan prospek).
*   **AI Engine**: Google Gemini API via Google AI Studio (`gemini-1.5-flash` - Free Tier, 15 RPM / 1.500 RPD).
*   **Dashboard Admin**: Terintegrasi ke halaman [dashboard.astro](file:///c:/Users/LENOVO/Documents/VORTEXA/src/pages/admin/dashboard.astro).
*   **Notifikasi Admin**: Telegram Bot API (100% Gratis & Instan).
*   **WhatsApp Gateway (Opsi Semi-Otomatis & Stabil)**: Menggunakan tautan `wa.me` kustom berbasis data prospek yang dirangkum AI. Admin cukup klik tombol follow-up di dashboard untuk mengirim pesan via WhatsApp Web/Aplikasi.

---

## 2. Skema Database Supabase

Untuk mendukung fitur ini, kita perlu membuat 3 tabel baru di Supabase:

### A. Tabel `ai_chat_sessions`
Menyimpan sesi percakapan klien secara real-time.
```sql
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_ip TEXT,
    client_name TEXT,
    client_whatsapp TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'need_admin', 'completed'
    is_ai_enabled BOOLEAN DEFAULT TRUE
);
```

### B. Tabel `ai_chat_messages`
Menyimpan riwayat pesan obrolan antara klien dan AI.
```sql
CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sender TEXT NOT NULL, -- 'user' atau 'assistant'
    message_content TEXT NOT NULL
);
```

### C. Tabel `leads`
Menyimpan data prospek yang berhasil diekstrak oleh AI dari percakapan.
```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
    client_name TEXT,
    company_name TEXT, -- Nama PT/Perusahaan
    project_needs TEXT, -- Kebutuhan proyek (Website/Video/SEO/AI)
    whatsapp_number TEXT,
    status TEXT DEFAULT 'pending', -- 'pending' (belum deal), 'contacted' (sudah dihubungi), 'deal' (selesai), 'no_response' (tidak membalas)
    last_followup_at TIMESTAMP WITH TIME ZONE,
    followup_count INTEGER DEFAULT 0
);
```

---

## 3. Alur Kerja Integrasi AI (Step-by-Step)

```
[Client Chat di Web] 
       │
       ▼
[Astro Endpoint /api/chat] ──(Cek Kata Kunci)──► [Jika Tidak Sesuai Kata Kunci] ──► [Hubungkan Manual ke Admin]
       │
       ├─► (Pesan dikirim ke Gemini API dengan limit token & instruksi sistem)
       │
       ▼
[Gemini Balas & Ekstrak Data Prospek via JSON]
       │
       ▼
[Data Disimpan ke Tabel Leads & Notifikasi Telegram Terkirim]
```

### Mekanisme Kontrol Token & Fallback "Sibuk":
1.  Setiap request ke Gemini disetel dengan parameter `maxOutputTokens: 300` agar hemat token.
2.  Hanya 10 pesan terakhir dalam tabel `ai_chat_messages` yang dikirim ke Gemini untuk membatasi konsumsi token input.
3.  Jika batas kuota gratis Gemini tercapai (API mengembalikan error), server akan menangkap error tersebut dan otomatis membalas dengan teks fallback: *"Mohon maaf, sistem AI kami sedang sibuk..."* lalu mengubah status sesi chat menjadi `need_admin`.

---

## 4. Langkah Awal & Milestones Implementasi

Berikut adalah urutan langkah yang perlu kita lakukan:

*   **[ ] Langkah 1: Setup Kredensial & Lingkungan**
    *   Mendaftarkan API Key Gemini di Google AI Studio (Gratis).
    *   Memasukkan `GEMINI_API_KEY` ke file `@.env` proyek.
*   **[ ] Langkah 2: Setup Database Supabase**
    *   Menjalankan query SQL untuk membuat tabel `ai_chat_sessions`, `ai_chat_messages`, dan `leads` di Supabase.
*   **[ ] Langkah 3: Membuat Server Endpoint Astro**
    *   Membuat file `src/pages/api/chat.js` (atau `.ts`) untuk menangani komunikasi aman antara chat widget, Supabase, dan Gemini API.
*   **[ ] Langkah 4: Membuat UI Chat Widget (Frontend)**
    *   Membuat komponen chat interaktif kustom (Floating Chat Widget) di pojok kanan bawah halaman utama.
*   **[ ] Langkah 5: Integrasi Dashboard Admin**
    *   Menambahkan tabel log "Prospek AI (Leads)" di bagian bawah halaman [dashboard.astro](file:///c:/Users/LENOVO/Documents/VORTEXA/src/pages/admin/dashboard.astro) dengan tombol follow-up WhatsApp dan toggle manual control.
*   **[ ] Langkah 6: Notifikasi Telegram Bot (Opsional/Saran)**
    *   Membuat Telegram Bot gratis untuk memberikan pemberitahuan real-time langsung ke HP admin ketika ada prospek baru masuk.
