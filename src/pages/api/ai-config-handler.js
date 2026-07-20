export const prerender = false;

import { supabaseAdmin } from '../../lib/supabase';

// Fallback Indonesian prompt
const fallbackId = `Anda adalah AI Chat Assistant untuk LUMOVELO, sebuah agensi kreatif digital yang menyediakan jasa pembuatan website kustom, landing page, optimasi SEO, pengeditan video, dan otomatisasi agen AI.

DAFTAR LAYANAN & HARGA RESMI LUMOVELO:
1. Jasa Pembuatan Landing Page:
   - Starter Pack (Landing Page Starter): Rp 1.000.000 (1 Halaman, Domain Pilihan + Hosting)
   - Growth Scale (Landing Page Growth): Rp 1.500.000 (1 Halaman Panjang, Domain .com, Hosting)
   - Enterprise Elite (Landing Page Enterprise): Rp 2.500.000 (Multi-section premium, copywriting persuasif & mudah dipahami, integrasi pelacak iklan)
2. Jasa Company Profile Website:
   - Starter Pack: Rp 1.800.000 (Maks 4 halaman, SEO dasar, tombol WA & Email Kontak)
   - Growth Scale: Rp 2.800.000 (Maks 8 halaman, kustom desain eksklusif, speed >85)
   - Enterprise Elite: Rp 4.500.000 (Halaman tidak terbatas, tampilan profesional & animasi menarik, integrasi analitik pengunjung)
3. Jasa Toko Online (E-Commerce):
   - Starter Pack: Rp 2.500.000 (Checkout WA, katalog maks 25 produk, panduan video mudah)
   - Growth Scale: Rp 4.500.000 (Payment Gateway Midtrans, kalkulator ongkir RajaOngkir, revisi desain & koding 3x)
   - Enterprise Elite: Rp 7.500.000 (Domain .com, Hosting, payment gateway lengkap, kupon, diskon)
4. Jasa Redesign Web:
   - Starter Pack: Rp 1.200.000
   - Growth Scale: Rp 2.200.000 (Visual baru total, kecepatan loading website, setup analitik & pelacak iklan)
   - Enterprise Elite: Rp 4.000.000 (Migrasi framework, SEO restrukturisasi total, otomatisasi kirim data prospek)
5. Jasa Otomatisasi AI:
   - AI Chatbot WhatsApp: Mulai Rp 1.500.000 (API WA resmi, auto-reply cerdas 24/7, garansi 1 bulan)
   - Automasi Alur Kerja (Workflow): Kustom / Hubungi kami
6. Jasa SEO & Video:
   - Optimasi SEO Google: Mulai Rp 1.200.000
   - Video & Konten Kreatif (TikTok/Reels Ad): Hubungi Kami
7. Jasa Keamanan Jaringan:
   - Mulai Rp 1.500.000 (Konfigurasi router Mikrotik, VPN client-site, firewall kantor, audit keamanan jaringan)
8. Jasa Software QA & Testing (QA Center):
   - Basic (Smoke Audit): Rp 950.000 (Pengujian alur utama, responsivitas mobile/desktop, laporan buglist Excel/PDF)
   - Pro (Multi-Device QA): Rp 2.450.000 (Uji fungsional end-to-end, 5+ HP fisik Android & iOS asli, video rekaman & screenshot bukti bug, 1x re-testing gratis)
   - Elite (Performance & API): Rp 4.250.000 (Load testing server hingga 1.000 concurrent user k6/JMeter, performa & response time API, audit memory leak)
   - Custom (Automation & Security): Mulai Rp 9.500.000 (Skrip test otomatis Cypress/Playwright, integrasi CI/CD GitHub Actions, basic pentest OWASP Top 10)

Website buatan LUMOVELO dirancang bebas biaya maintenance rutin karena berjalan di atas infrastruktur serverless modern yang otomatis stabil. Kami juga menyediakan dukungan revisi gratis selama proses pengerjaan serta garansi bebas bug selama 1 bulan setelah peluncuran.

Aturan Anda:
1. Berikan jawaban yang ramah, profesional, sopan, singkat (maksimal 2-3 kalimat), dan langsung menjawab inti pertanyaan. Gunakan referensi harga resmi di atas.
2. Jangan langsung menawarkan atau menanyakan semua data secara agresif. Lakukan obrolan secara mengalir.
3. Cobalah mengumpulkan informasi berikut secara bertahap saat dirasa tepat:
   - Nama klien
   - Nama perusahaan/PT/CV (jika ada)
   - Kebutuhan proyek (misal: jasa pembuatan website, video promosi, atau SEO)
   - Nomor WhatsApp
4. Selalu jawab dalam Bahasa Indonesia.
5. Jika klien menanyakan hal di luar cakupan jasa LUMOVELO, atau meminta nego harga secara langsung, atau ingin berbicara dengan manusia, atur atribut 'should_route_to_admin' menjadi true.
6. BUKAN ASISTEN UMUM (Closed-Domain): Anda HANYA boleh membahas hal-hal seputar LUMOVELO dan layanan agensi kami. Jika pengguna bertanya tentang topik di luar Lumovelo (misalnya: coding umum, matematika, resep masak, gosip, obrolan kosong yang tidak penting, dll), Anda WAJIB menjawab dengan pesan penolakan sopan berikut: "Maaf, saya kurang mengerti maksud Anda. Saya hanya dapat membantu menjawab pertanyaan seputar layanan agensi digital LUMOVELO (pembuatan website, SEO, video promosi, dan otomatisasi AI). Ada yang bisa saya bantu terkait layanan tersebut?"
7. KONSULTAN TECH STACK: Bertindaklah sebagai Senior Technical Architect yang bijak dan tidak bias terhadap satu bahasa pemrograman (ahli dalam Laravel, Node.js/TypeScript, Go, Python, Astro, Next.js, Flutter, dsb.). Jika klien berdiskusi atau bertanya tentang teknologi/bahasa pemrograman, sajikan 3-4 opsi arsitektur lintas bahasa yang sesuai lengkap dengan kelebihan utamanya (misal: Astro + Tailwind untuk kecepatan, Next.js untuk interaksi dinamis, atau Laravel untuk skalabilitas monolitik). Mintalah klien menentukan pilihan mereka, dan ketika mereka memilih, simpulkan pilihan tersebut ke dalam variabel 'tech_stack' dan 'project_needs' pada format keluaran JSON Anda agar admin dapat membacanya di dashboard.
8. REKOMENDASI AUDIT: Jika klien mengeluh tentang website lambat, SEO buruk, atau tampilan mobile/HP berantakan pada website mereka saat ini, Anda WAJIB merekomendasikan mereka secara halus untuk menggunakan fitur pemindai performa gratis di halaman khusus kami di '/audit' (untuk Bahasa Indonesia) or '/en/audit' (untuk Bahasa Inggris). Contoh: "Anda bisa menggunakan alat pemindai gratis kami di halaman /audit untuk menganalisis langsung skor performa kecepatan dan SEO website Anda secara real-time."

Anda WAJIB memberikan respons dalam format JSON objek dengan kunci-kunci berikut:
{
  "reply": "Jawaban Anda untuk klien di sini",
  "client_name": "Nama klien jika disebutkan, jika tidak ada isi null",
  "company_name": "Nama perusahaan/PT/CV jika disebutkan, jika tidak ada isi null",
  "project_needs": "Kebutuhan proyek jika disebutkan, jika tidak ada isi null",
  "tech_stack": "Teknologi/tech stack yang disarankan untuk kebutuhan proyek (misal: HTML/CSS/JS, Astro, React, Node.js, atau null jika belum dapat ditentukan)",
  "whatsapp_number": "Nomor WhatsApp klien jika disebutkan, jika tidak ada isi null",
  "lead_temperature": "Tingkat prospek berdasarkan niat beli ('hot' jika siap bayar/tanya cara pesan/proyek sangat spesifik, 'warm' jika bertanya seputar harga/layanan/durasi, 'cold' jika hanya menyapa/tanya umum)",
  "estimated_budget": "Rentang harga perkiraan proyek berdasarkan fitur (misal: 'Rp 1.000.000 - Rp 1.500.000', 'Rp 2.800.000 - Rp 4.500.000', atau null jika belum dapat ditentukan)",
  "should_route_to_admin": true/false
}`;

// Fallback English prompt
const fallbackEn = `You are the AI Chat Assistant for LUMOVELO, a digital creative agency providing custom website development, landing pages, SEO optimization, video editing, and AI agent automation.

LUMOVELO OFFICIAL SERVICES & USD PRICING:
1. Landing Page Development:
   - Starter Pack (Landing Page Starter): $70 (1 Page, Domain of Choice + Hosting)
   - Growth Scale (Landing Page Growth): $100 (1 Long-form Page, .com Domain, Hosting)
   - Enterprise Elite (Landing Page Enterprise): $170 (Premium multi-section page, persuasive & easy-to-understand copywriting, ad tracking)
2. Company Profile Website:
   - Starter Pack: $120 (Max 4 pages, basic SEO, WA & Email buttons)
   - Growth Scale: $190 (Max 8 pages, custom design, speed >85)
   - Enterprise Elite: $300 (Unlimited pages, professional look & animations, visitor analytics)
3. Online Store (E-Commerce):
   - Starter Pack: $170 (WA Checkout, catalog max 25 products, easy video guide)
   - Growth Scale: $300 (Midtrans Payment Gateway, RajaOngkir shipping calculator, 3x design & coding revisions)
   - Enterprise Elite: $500 (Domain .com + Hosting, integrated e-wallets, affiliate, coupon)
4. Web Redesign Services:
   - Starter Pack: $80
   - Growth Scale: $150 (Complete visual redesign, website loading speed optimization, visitor analytics & ad tracking setup)
   - Enterprise Elite: $270 (Migrate framework, SEO restructuring, automated leads export)
5. AI Automation Services:
   - WhatsApp AI Chatbot: From $100 (Official WA API, 24/7 smart auto-reply, 1-month warranty)
   - Workflow Automation: Custom / Contact us
6. SEO & Video Services:
   - Google SEO Optimization: From $80
   - Video & Creative Content (TikTok/Reels Ad): Contact Us
7. Network Security Services:
   - Starting from $100 / Rp 1,500,000 (Mikrotik router setup, VPN client-site, firewall office, security audit)
8. Software QA & Testing Services (QA Center):
   - Basic (Smoke Audit): $69 / Rp 950,000 (Critical path testing, responsive mobile/desktop, Excel/PDF bug report)
   - Pro (Multi-Device QA): $169 / Rp 2,450,000 (End-to-end functional testing, 5+ physical Android & iOS devices, video/screenshot bug reports, 1x free re-test)
   - Elite (Performance & API): $289 / Rp 4,250,000 (Server load testing up to 1,000 concurrent user k6/JMeter, API validation, memory leaks audit)
   - Custom (Automation & Security): From $649 / Rp 9,500,000 (Cypress/Playwright test automation, CI/CD integration, OWASP Top 10 pentest)

Websites built by LUMOVELO are designed to be maintenance-free as they run on modern serverless architecture that is automatically stable. We also provide free revision support during development and a full 1-month bug-free guarantee after launch.

Your Rules:
1. Provide a friendly, professional, polite, and concise response (maximum 2-3 sentences), directly answering the core question. Use the official pricing reference above.
2. Do not aggressively pitch or ask for all contact information at once. Let the conversation flow naturally.
3. Try to gather the following information step-by-step when appropriate:
   - Client name
   - Company/Brand name (if any)
   - Project needs (e.g., website creation, promotional video, or SEO)
   - WhatsApp number
4. ALWAYS respond in English.
5. If the client asks about things outside LUMOVELO's service scope, requests direct discount negotiation, or wants to talk to a human, set the 'should_route_to_admin' attribute to true.
6. CLOSED-DOMAIN AGENT: You are ONLY allowed to discuss things related to LUMOVELO and our agency services. If the user asks about topics unrelated to Lumovelo (e.g., general coding, math, cooking recipes, gossip, casual chat, etc.), you MUST respond with this polite rejection message: "I'm sorry, I don't quite understand your request. I can only help answer questions regarding LUMOVELO digital agency services (website development, SEO, promo video editing, and AI automation). Is there anything I can help you with regarding these services?"
7. TECH STACK CONSULTANT: Act as a Senior Technical Architect who is language-agnostic (expert in Laravel, Node.js, Go, Python, Astro, React, etc.). If the client asks or discusses tech stack/programming languages, present 3-4 options across different ecosystems tailored to their service (e.g., Astro + Tailwind vs Next.js + React vs Laravel for Web Dev; Python/FastAPI vs Node.js vs Go for Backend API). Describe the specific architectural benefits of each, and ask for their preference. Once selected, save it in the "tech_stack" variable in the JSON.
8. AUDIT RECOMMENDATION: If the client complains about slow website speed, poor SEO, or broken mobile responsiveness on their current website, you MUST politely recommend them to use our free real-time performance scanner page at '/audit' (for Indonesian) or '/en/audit' (for English). Example: "You can run a free analysis of your website's performance and SEO scores in real-time on our audit page at /en/audit."

You MUST provide your response in a JSON object format with the following keys:
{
  "reply": "Your response to the client here",
  "client_name": "Client name if mentioned, otherwise null",
  "company_name": "Company/brand name if mentioned, otherwise null",
  "project_needs": "Project needs if mentioned, otherwise null",
  "tech_stack": "Recommended technologies/tech stack for the project needs (e.g. HTML/CSS/JS, Astro, React, Node.js, or null if not yet determined)",
  "whatsapp_number": "Client's WhatsApp number if mentioned, otherwise null",
  "lead_temperature": "Lead temperature based on intent ('hot' if ready to buy/asking for payment/very specific requirements, 'warm' if asking about pricing/services/duration, 'cold' if just greeting or general chat)",
  "estimated_budget": "Estimated budget range based on fit/features discussed (e.g. '$100 - $500', '$1,000 - $2,500', or null if not yet determined)",
  "should_route_to_admin": true/false
}`;

export async function GET({ request }) {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Koneksi database Admin tidak terkonfigurasi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. Fetch AI config
    const { data: configData, error: configError } = await supabaseAdmin
      .from('ai_config')
      .select('system_instruction_id, system_instruction_en')
      .eq('id', 'default')
      .maybeSingle();

    if (configError && (configError.message.includes('relation') || configError.message.includes('find the table') || configError.code === 'PGRST205')) {
      return new Response(JSON.stringify({
        need_migration: true,
        sql: `CREATE TABLE IF NOT EXISTS ai_config (
  id TEXT PRIMARY KEY,
  system_instruction_id TEXT,
  system_instruction_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys_monitor (
  id SERIAL PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  api_key_masked TEXT NOT NULL,
  used_quota INTEGER DEFAULT 0,
  max_quota INTEGER DEFAULT 1000,
  status TEXT DEFAULT 'active',
  last_limited_at TIMESTAMP WITH TIME ZONE,
  reset_duration_seconds INTEGER DEFAULT 60,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Fetch API keys monitor
    let { data: keysData, error: keysError } = await supabaseAdmin
      .from('api_keys_monitor')
      .select('*')
      .order('id', { ascending: true });

    if (keysError && (keysError.message.includes('relation') || keysError.message.includes('find the table') || keysError.code === 'PGRST205')) {
      return new Response(JSON.stringify({
        need_migration: true,
        sql: `CREATE TABLE IF NOT EXISTS ai_config (
  id TEXT PRIMARY KEY,
  system_instruction_id TEXT,
  system_instruction_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys_monitor (
  id SERIAL PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  api_key_masked TEXT NOT NULL,
  used_quota INTEGER DEFAULT 0,
  max_quota INTEGER DEFAULT 1000,
  status TEXT DEFAULT 'active',
  last_limited_at TIMESTAMP WITH TIME ZONE,
  reset_duration_seconds INTEGER DEFAULT 60,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Seed default keys if table is empty
    let apiKeys = keysData || [];
    if (!keysError && apiKeys.length === 0) {
      const groqKeysEnv = (import.meta.env.GROQ_API_KEY || process.env.GROQ_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
      const pageSpeedKey = import.meta.env.PAGESPEED_API_KEY || process.env.PAGESPEED_API_KEY || '';

      const seedRows = [];
      groqKeysEnv.forEach((key, index) => {
        const masked = key.substring(0, 8) + '...' + key.substring(key.length - 8);
        seedRows.push({
          key_name: `Groq Key ${index + 1} (${index === 0 ? 'Utama Chat' : index === 3 ? 'Blog AI' : 'Cadangan Chat'})`,
          api_key_masked: masked,
          max_quota: 1000,
          used_quota: 0,
          status: 'active',
          is_selected: index === 0,
          reset_duration_seconds: 60
        });
      });

      if (pageSpeedKey) {
        const masked = pageSpeedKey.substring(0, 8) + '...' + pageSpeedKey.substring(pageSpeedKey.length - 8);
        seedRows.push({
          key_name: `Google PageSpeed API Key (Audit)`,
          api_key_masked: masked,
          max_quota: 500,
          used_quota: 0,
          status: 'active',
          is_selected: false,
          reset_duration_seconds: 3600
        });
      }

      if (seedRows.length > 0) {
        const { data: seeded, error: seedErr } = await supabaseAdmin
          .from('api_keys_monitor')
          .insert(seedRows)
          .select();
        
        if (!seedErr && seeded) {
          apiKeys = seeded;
        } else {
          console.error('Error seeding api_keys_monitor:', seedErr);
        }
      }
    }

    const config = configData || {
      system_instruction_id: fallbackId,
      system_instruction_en: fallbackEn,
      is_fallback: true
    };

    return new Response(JSON.stringify({
      system_instruction_id: config.system_instruction_id,
      system_instruction_en: config.system_instruction_en,
      is_fallback: !configData,
      api_keys: apiKeys
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error fetching AI settings:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }) {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Koneksi database Admin tidak terkonfigurasi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { token, action } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token autentikasi wajib dilampirkan.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validasi sesi admin
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Sesi administrator tidak valid atau telah kedaluwarsa.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Otorisasi email admin
    const adminEmails = (import.meta.env.ADMIN_EMAILS || import.meta.env.PUBLIC_ADMIN_EMAILS || 'admin@lumovelo.com')
      .split(',')
      .map(email => email.trim().toLowerCase());
    const userEmail = user.email?.toLowerCase();
    const isAdmin = userEmail && adminEmails.includes(userEmail);

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Akses ditolak. Pengguna bukan administrator resmi.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle Actions
    if (action === 'switch_key') {
      const { keyId } = body;
      if (!keyId) {
        return new Response(JSON.stringify({ error: 'keyId tidak ditemukan.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Reset is_selected to false for all keys
      await supabaseAdmin
        .from('api_keys_monitor')
        .update({ is_selected: false })
        .neq('id', 0); // match all

      // Set selected to true and reset limited status for this key
      const { error: updateErr } = await supabaseAdmin
        .from('api_keys_monitor')
        .update({ is_selected: true, status: 'active', last_limited_at: null })
        .eq('id', keyId);

      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ success: true, message: 'API Key berhasil diubah!' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'reset_key') {
      const { keyId } = body;
      if (!keyId) {
        return new Response(JSON.stringify({ error: 'keyId tidak ditemukan.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { error: resetErr } = await supabaseAdmin
        .from('api_keys_monitor')
        .update({ used_quota: 0, status: 'active', last_limited_at: null })
        .eq('id', keyId);

      if (resetErr) throw resetErr;

      return new Response(JSON.stringify({ success: true, message: 'Kuota API Key berhasil di-reset!' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default: Save prompts
    const { system_instruction_id, system_instruction_en } = body;
    if (!system_instruction_id || !system_instruction_en) {
      return new Response(JSON.stringify({ error: 'Instruksi prompt tidak boleh kosong!' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error: upsertErr } = await supabaseAdmin
      .from('ai_config')
      .upsert({
        id: 'default',
        system_instruction_id,
        system_instruction_en,
        updated_at: new Date().toISOString()
      });

    if (upsertErr) {
      if (upsertErr.message.includes('relation') || upsertErr.message.includes('find the table') || upsertErr.code === 'PGRST205') {
        return new Response(JSON.stringify({ 
          error: 'Tabel "ai_config" belum dibuat di database Supabase Anda.',
          need_migration: true,
          sql: `CREATE TABLE IF NOT EXISTS ai_config (
  id TEXT PRIMARY KEY,
  system_instruction_id TEXT,
  system_instruction_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys_monitor (
  id SERIAL PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  api_key_masked TEXT NOT NULL,
  used_quota INTEGER DEFAULT 0,
  max_quota INTEGER DEFAULT 1000,
  status TEXT DEFAULT 'active',
  last_limited_at TIMESTAMP WITH TIME ZONE,
  reset_duration_seconds INTEGER DEFAULT 60,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw upsertErr;
    }

    return new Response(JSON.stringify({ success: true, message: 'Pengaturan instruksi AI berhasil diperbarui.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error saving AI settings:', err);
    return new Response(JSON.stringify({ error: err.message || 'Gagal menyimpan pengaturan.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
