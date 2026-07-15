export const prerender = false; // Memaksa Astro merender endpoint ini secara dinamis (SSR)

import { supabaseAdmin } from '../../lib/supabase';
import { callGroq, sendTelegramNotification } from '../../lib/aiHelper';

// Daftar kata kunci layanan
const KEYWORDS = [
  'harga', 'jasa', 'layanan', 'web', 'website', 'video', 'seo', 'portofolio', 'portfolio',
  'biaya', 'tarif', 'agency', 'buat', 'bikin', 'order', 'pesan', 'tanya', 'promo', 'diskon', 'ai',
  'lumovelo', 'vortexa', 'produk', 'desain', 'developer',
  'hari', 'waktu', 'durasi', 'lama', 'cepat', 'selesai', 'pengerjaan', 'proses', 'deadline', 'kapan',
  'jadwal', 'minggu', 'bulan', 'kontrak', 'mou', 'kerja', 'sama', 'revisi', 'garansi', 'fitur',
  'fungsi', 'sistem', 'pembayaran', 'dp', 'bayar', 'cicil', 'transfer', 'kontak', 'wa', 'whatsapp',
  'email', 'telepon', 'alamat', 'kantor', 'domain', 'hosting', 'server', 'aplikasi', 'apps',
  'mobile', 'android', 'ios', 'logo', 'branding', 'design',
  'company', 'profile', 'landing', 'page', 'ecommerce', 'toko', 'online', 'beda', 'apa', 'bagaimana',
  'apakah', 'jelaskan', 'cara', 'saran', 'rekomendasi', 'solusi', 'kelebihan', 'kekurangan', 'contoh', 'situs'
];

// Daftar sapaan umum
const GREETINGS = [
  'halo', 'hi', 'hello', 'siang', 'pagi', 'malam', 'sore', 'p', 'permisi', 'assalamualaikum', 'askum', 'spada'
];

/**
 * Memeriksa apakah pesan mengandung kata kunci layanan.
 */
function containsKeywords(text) {
  const normalized = text.toLowerCase();
  return KEYWORDS.some(keyword => normalized.includes(keyword));
}

/**
 * Memeriksa apakah pesan hanya sapaan singkat.
 */
function isGreeting(text) {
  const normalized = text.toLowerCase().trim().replace(/[^a-zA-Z\s]/g, "");
  return GREETINGS.some(greeting => normalized === greeting || normalized.startsWith(greeting + ' '));
}

export async function POST({ request, clientAddress }) {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Koneksi database Supabase Admin tidak terkonfigurasi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { message, sessionId, lang, clientName, whatsappNumber } = await request.json();
    const isEn = lang === 'en';

    if (!message || message.trim() === '') {
      return new Response(JSON.stringify({ error: 'Pesan tidak boleh kosong.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let activeSessionId = sessionId;
    let isAiEnabled = true;

    // 1. Jika tidak ada sessionId, buat sesi chat baru
    if (!activeSessionId) {
      const { data: newSession, error: sessionErr } = await supabaseAdmin
        .from('ai_chat_sessions')
        .insert({
          client_ip: clientAddress || request.headers.get('x-forwarded-for') || 'unknown',
          status: 'active',
          is_ai_enabled: true
        })
        .select()
        .single();

      if (sessionErr) throw sessionErr;
      activeSessionId = newSession.id;
    } else {
      // Periksa apakah sesi chat ini masih mengizinkan AI membalas
      const { data: session, error: getSessionErr } = await supabaseAdmin
        .from('ai_chat_sessions')
        .select('is_ai_enabled, status')
        .eq('id', activeSessionId)
        .single();

      if (getSessionErr) throw getSessionErr;
      
      if (session) {
        isAiEnabled = session.is_ai_enabled;
      }
    }

    // Intercept background system messages untuk form data diri
    if (message.startsWith('[System Info:')) {
      const customReply = isEn
        ? "Thank you! Your contact information has been recorded. Our team will contact you soon, and you can now continue this chat without limits."
        : "Terima kasih! Data kontak Anda telah berhasil kami catat. Tim kami akan segera menghubungi Anda, dan Anda sekarang dapat melanjutkan percakapan ini tanpa batas.";

      // Simpan pesan User & Balasan ke database
      await supabaseAdmin
        .from('ai_chat_messages')
        .insert([
          { session_id: activeSessionId, sender: 'user', message_content: message },
          { session_id: activeSessionId, sender: 'assistant', message_content: customReply }
        ]);

      // Update Leads
      const leadData = {
        session_id: activeSessionId,
        ...(clientName && { client_name: clientName }),
        ...(whatsappNumber && { whatsapp_number: whatsappNumber })
      };

      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('session_id', activeSessionId)
        .maybeSingle();

      if (existingLead) {
        await supabaseAdmin
          .from('leads')
          .update(leadData)
          .eq('id', existingLead.id);
      } else {
        await supabaseAdmin
          .from('leads')
          .insert(leadData);

        await sendTelegramNotification(
          `💼 *Prospek Baru Terdeteksi (Form)*\n\n` +
          `*Nama:* ${clientName || '-'}\n` +
          `*WhatsApp:* ${whatsappNumber || '-'}\n\n` +
          `Cek selengkapnya di Dashboard Admin Lumovelo!`
        );
      }

      // Update session
      await supabaseAdmin
        .from('ai_chat_sessions')
        .update({
          updated_at: new Date().toISOString(),
          ...(clientName && { client_name: clientName }),
          ...(whatsappNumber && { client_whatsapp: whatsappNumber })
        })
        .eq('id', activeSessionId);

      return new Response(JSON.stringify({
        reply: customReply,
        sessionId: activeSessionId,
        is_ai_enabled: isAiEnabled
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Simpan pesan User ke database
    const { error: insertMsgErr } = await supabaseAdmin
      .from('ai_chat_messages')
      .insert({
        session_id: activeSessionId,
        sender: 'user',
        message_content: message
      });

    if (insertMsgErr) throw insertMsgErr;

    // Update waktu updated_at di sesi chat
    await supabaseAdmin
      .from('ai_chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeSessionId);

    // 3. Jika mode AI dinonaktifkan (karena admin sudah ambil alih), jangan panggil Gemini
    if (!isAiEnabled) {
      // Kirim notifikasi Telegram ke Admin bahwa ada pesan baru dari user di mode manual
      try {
        await sendTelegramNotification(
          `💬 *Pesan Baru di Sesi Manual*\n\n` +
          `*Pesan User:* "${message}"\n` +
          `*Sesi ID:* \`${activeSessionId}\`\n\n` +
          `Silakan balas di dashboard admin.`
        );
      } catch (tgErr) {
        console.error('Error sending Telegram notification in manual mode:', tgErr);
      }

      return new Response(JSON.stringify({
        reply: null,
        sessionId: activeSessionId,
        is_ai_enabled: false
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3.5 Batasi chat gratis jika belum memasukkan nomor WhatsApp
    try {
      const { count: userMsgCount } = await supabaseAdmin
        .from('ai_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', activeSessionId)
        .eq('sender', 'user');

      const { data: lead } = await supabaseAdmin
        .from('leads')
        .select('whatsapp_number')
        .eq('session_id', activeSessionId)
        .maybeSingle();

      const hasWa = lead && lead.whatsapp_number && lead.whatsapp_number.trim() !== '';

      if (userMsgCount >= 5 && !hasWa) {
        const limitReply = isEn
          ? "You have reached the limit of 5 free messages. Please fill out the name & WhatsApp form at the top of the chat to unlock unlimited consultation."
          : "Maaf, Anda telah mencapai batas 5 pesan obrolan gratis. Silakan isi nama dan nomor WhatsApp Anda pada formulir di bagian atas obrolan terlebih dahulu untuk melanjutkan konsultasi tanpa batas dengan asisten AI kami.";

        // Simpan respon sistem ke database agar sinkron
        await supabaseAdmin
          .from('ai_chat_messages')
          .insert({
            session_id: activeSessionId,
            sender: 'assistant',
            message_content: limitReply
          });

        return new Response(JSON.stringify({
          reply: limitReply,
          sessionId: activeSessionId,
          is_ai_enabled: isAiEnabled,
          limit_reached: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (countErr) {
      console.error('Error checking message limits:', countErr);
    }

    // 4. Cek filter kata kunci
    const msgHasKeywords = containsKeywords(message);
    const msgIsGreeting = isGreeting(message);

    // Jika tidak mengandung kata kunci DAN bukan sapaan, arahkan ke admin manual
    if (!msgHasKeywords && !msgIsGreeting) {
      const manualReply = isEn
        ? "Your question has been forwarded to our Admin. Our admin will reply to your chat here shortly or contact you directly."
        : "Pertanyaan Anda telah diteruskan ke Admin kami. Admin akan segera membalas obrolan Anda di sini atau menghubungi kontak Anda.";
      
      // Update status sesi menjadi need_admin dan nonaktifkan AI
      await supabaseAdmin
        .from('ai_chat_sessions')
        .update({
          is_ai_enabled: false,
          status: 'need_admin'
        })
        .eq('id', activeSessionId);

      // Simpan balasan manual placeholder ke tabel pesan
      await supabaseAdmin
        .from('ai_chat_messages')
        .insert({
          session_id: activeSessionId,
          sender: 'assistant',
          message_content: manualReply
        });

      // Kirim notifikasi Telegram ke Admin
      await sendTelegramNotification(
        `🔔 *Pengalihan Chat Manual (Tanpa Kata Kunci)*\n\n` +
        `*Pesan User:* "${message}"\n` +
        `*Sesi ID:* \`${activeSessionId}\`\n\n` +
        `Admin harap segera membalas di dashboard admin.`
      );

      return new Response(JSON.stringify({
        reply: manualReply,
        sessionId: activeSessionId,
        is_ai_enabled: false
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4.5. Anti-Spam / Rate Limiting (Maksimal 5 pesan per menit per sesi)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: msgCount, error: countError } = await supabaseAdmin
      .from('ai_chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', activeSessionId)
      .eq('sender', 'user')
      .gt('created_at', oneMinuteAgo);

    if (countError) {
      console.error('Error saat mengecek rate limit:', countError);
    } else if (msgCount && msgCount >= 5) {
      const throttleReply = isEn
        ? "You are sending messages too quickly. Please wait about 1 minute before sending another message."
        : "Anda mengirim pesan terlalu cepat. Silakan tunggu sekitar 1 menit sebelum mengirim pesan lagi.";
      
      await supabaseAdmin
        .from('ai_chat_messages')
        .insert({
          session_id: activeSessionId,
          sender: 'assistant',
          message_content: throttleReply
        });

      return new Response(JSON.stringify({
        reply: throttleReply,
        sessionId: activeSessionId,
        is_ai_enabled: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Ambil 10 riwayat pesan terakhir untuk memori Groq
    const { data: dbMessages, error: fetchMsgsErr } = await supabaseAdmin
      .from('ai_chat_messages')
      .select('sender, message_content')
      .eq('session_id', activeSessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchMsgsErr) throw fetchMsgsErr;

    // Format pesan sesuai format OpenAI/Groq API
    const history = dbMessages.map(msg => ({
      role: msg.sender, // 'user' atau 'assistant'
      content: msg.message_content
    }));

    // Instruksi Sistem untuk Groq (Ambil dari Supabase dengan Fallback)
    let systemInstruction = '';
    try {
      const { data: configData, error: configError } = await supabaseAdmin
        .from('ai_config')
        .select('system_instruction_id, system_instruction_en')
        .eq('id', 'default')
        .maybeSingle();

      if (!configError && configData) {
        systemInstruction = isEn ? configData.system_instruction_en : configData.system_instruction_id;
      }
    } catch (dbErr) {
      console.warn('Gagal memuat dynamic prompt dari Supabase, menggunakan fallback statis.', dbErr);
    }

    if (!systemInstruction) {
      systemInstruction = isEn ? `
      You are the AI Chat Assistant for LUMOVELO, a digital creative agency providing custom website development, landing pages, SEO optimization, video editing, and AI agent automation.
      
      LUMOVELO OFFICIAL SERVICES & USD PRICING:
      1. Landing Page Development:
         - Starter Pack (Landing Page Starter): $70 (1 Page, Domain of Choice + Serverless Hosting)
         - Growth Scale (Landing Page Growth): $100 (1 Long-form Page, .com Domain, priority)
         - Enterprise Elite (Landing Page Enterprise): $170 (Premium multi-section page, ad tracking, CRM Leads)
      2. Company Profile Website:
         - Starter Pack: $120 (Max 4 pages, basic SEO, connect to WA/Email)
         - Growth Scale: $190 (Max 8 pages, Bento Grid style, speed >85)
         - Enterprise Elite: $300 (Unlimited pages, luxurious visuals, GA4+Pixel analytics)
      3. Online Store (E-Commerce):
         - Starter Pack: $170 (WA Checkout, catalog max 50 products)
         - Growth Scale: $300 (Midtrans Payment Gateway, RajaOngkir shipping calculator, stock management)
         - Enterprise Elite: $500 (Dedicated VPS, integrated e-wallets, affiliate, coupon)
      4. Web Redesign Services:
         - Starter Pack: $80
         - Growth Scale: $150
         - Enterprise Elite: $270
      5. AI Automation Services:
         - WhatsApp AI Chatbot: From $100 (Official WA API, 24/7 smart auto-reply, 3-month warranty)
         - Workflow Automation: Custom / Contact us
      6. SEO & Video Services:
         - Google SEO Optimization: From $80
         - Video & Creative Content (TikTok/Reels Ad): Contact Us
      7. Website Maintenance Services:
         - Starter Pack: $10 / month
         - Growth Scale: $25 / month
         - Enterprise Elite: $50 / month

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
      }
    ` : `
      Anda adalah AI Chat Assistant untuk LUMOVELO, sebuah agensi kreatif digital yang menyediakan jasa pembuatan website kustom, landing page, optimasi SEO, pengeditan video, dan otomatisasi agen AI.
      
      DAFTAR LAYANAN & HARGA RESMI LUMOVELO:
      1. Jasa Pembuatan Landing Page:
         - Starter Pack (Landing Page Starter): Rp 1.000.000 (1 Halaman, Domain Pilihan + Hosting Serverless)
         - Growth Scale (Landing Page Growth): Rp 1.500.000 (1 Halaman Panjang, Domain .com, prioritas)
         - Enterprise Elite (Landing Page Enterprise): Rp 2.500.000 (Multi-section premium, tracking iklan, CRM Leads)
      2. Jasa Company Profile Website:
         - Starter Pack: Rp 1.800.000 (Maks 4 halaman, SEO dasar, hubungkan WA/Email)
         - Growth Scale: Rp 2.800.000 (Maks 8 halaman, Bento Grid style, speed >85)
         - Enterprise Elite: Rp 4.500.000 (Halaman tidak terbatas, visual mewah, analitik GA4+Pixel)
      3. Jasa Toko Online (E-Commerce):
         - Starter Pack: Rp 2.500.000 (Checkout WA, katalog maks 50 produk)
         - Growth Scale: Rp 4.500.000 (Payment Gateway Midtrans, kalkulator ongkir RajaOngkir, manajemen stok)
         - Enterprise Elite: Rp 7.500.000 (Dedicated VPS, semua e-wallet terintegrasi, afiasi, kupon)
      4. Jasa Redesign Web:
         - Starter Pack: Rp 1.200.000
         - Growth Scale: Rp 2.200.000
         - Enterprise Elite: Rp 4.000.000
      5. Jasa Otomatisasi AI:
         - AI Chatbot WhatsApp: Mulai Rp 1.500.000 (API WA resmi, auto-reply cerdas 24/7, garansi 3 bulan)
         - Automasi Alur Kerja (Workflow): Kustom / Hubungi kami
      6. Jasa SEO & Video:
         - Optimasi SEO Google: Mulai Rp 1.200.000
         - Video & Konten Kreatif (TikTok/Reels Ad): Hubungi Kami
      7. Jasa Maintenance Website:
         - Starter Pack: Rp 150.000 / bulan
         - Growth Scale: Rp 350.000 / bulan
         - Enterprise Elite: Rp 750.000 / bulan

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
      8. REKOMENDASI AUDIT: Jika klien mengeluh tentang website lambat, SEO buruk, atau tampilan mobile/HP berantakan pada website mereka saat ini, Anda WAJIB merekomendasikan mereka secara halus untuk menggunakan fitur pemindai performa gratis di halaman khusus kami di '/audit' (untuk Bahasa Indonesia) atau '/en/audit' (untuk Bahasa Inggris). Contoh: "Anda bisa menggunakan alat pemindai gratis kami di halaman /audit untuk menganalisis langsung skor performa kecepatan dan SEO website Anda secara real-time."
      
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
      }
    `;
    }

    // 6. Panggil Groq API
    let groqResponse;
    try {
      groqResponse = await callGroq(history, systemInstruction);
    } catch (groqError) {
      console.error('Error saat menghubungi Groq:', groqError);

      // Fallback ketika Groq error / limit token habis
      const fallbackReply = isEn
        ? "We apologize, our AI system is currently busy. Your message has been forwarded to an Admin and will be replied to manually."
        : "Mohon maaf, saat ini sistem AI kami sedang sibuk melayani antrean lain. Pesan Anda telah kami teruskan ke Admin dan akan segera dibalas secara manual.";
      
      await supabaseAdmin
        .from('ai_chat_sessions')
        .update({
          is_ai_enabled: false,
          status: 'need_admin'
        })
        .eq('id', activeSessionId);

      await supabaseAdmin
        .from('ai_chat_messages')
        .insert({
          session_id: activeSessionId,
          sender: 'assistant',
          message_content: fallbackReply
        });

      await sendTelegramNotification(
        `⚠️ *Sistem AI Sibuk / Groq Limit*\n\n` +
        `Sesi chat \`${activeSessionId}\` otomatis dialihkan ke manual karena limit token atau API error.\n` +
        `*Pesan User terakhir:* "${message}"`
      );

      return new Response(JSON.stringify({
        reply: fallbackReply,
        sessionId: activeSessionId,
        is_ai_enabled: false
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. Simpan balasan AI ke database
    const { reply, client_name, company_name, project_needs, tech_stack, whatsapp_number, lead_temperature, estimated_budget, should_route_to_admin } = groqResponse;

    await supabaseAdmin
      .from('ai_chat_messages')
      .insert({
        session_id: activeSessionId,
        sender: 'assistant',
        message_content: reply
      });

    // 8. Update tabel Leads jika ada info prospek yang berhasil diekstrak AI
    if (client_name || company_name || project_needs || whatsapp_number) {
      // Cek apakah lead sudah ada untuk sesi ini
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('session_id', activeSessionId)
        .maybeSingle();

      const leadData = {
        session_id: activeSessionId,
        ...(client_name && { client_name }),
        ...(company_name && { company_name }),
        ...(project_needs && { project_needs }),
        ...(tech_stack && { tech_stack }),
        ...(whatsapp_number && { whatsapp_number }),
        ...(lead_temperature && { lead_temperature }),
        ...(estimated_budget && { estimated_budget })
      };

      if (existingLead) {
        await supabaseAdmin
          .from('leads')
          .update(leadData)
          .eq('id', existingLead.id);
      } else {
        await supabaseAdmin
          .from('leads')
          .insert(leadData);

        // Kirim notifikasi Telegram untuk lead baru pertama kali
        const tempEmoji = lead_temperature === 'hot' ? '🔥 HOT' : (lead_temperature === 'warm' ? '☀️ WARM' : '❄️ COLD');
        await sendTelegramNotification(
          `💼 *Prospek Baru Terdeteksi!*\n\n` +
          `*Nama:* ${client_name || '-'}\n` +
          `*Perusahaan:* ${company_name || '-'}\n` +
          `*Kebutuhan:* ${project_needs || '-'}\n` +
          `*Tech Stack:* ${tech_stack || '-'}\n` +
          `*WhatsApp:* ${whatsapp_number || '-'}\n` +
          `*Estimasi Budget:* ${estimated_budget || '-'}\n` +
          `*Suhu Lead:* ${tempEmoji}\n\n` +
          `Cek selengkapnya di Dashboard Admin Lumovelo!`
        );
      }

      // Update info nama dan whatsapp ke ai_chat_sessions jika ada
      if (client_name || whatsapp_number) {
        await supabaseAdmin
          .from('ai_chat_sessions')
          .update({
            ...(client_name && { client_name }),
            ...(whatsapp_number && { client_whatsapp: whatsapp_number })
          })
          .eq('id', activeSessionId);
      }
    }

    // 9. Jika AI memutuskan obrolan harus ditangani admin
    if (should_route_to_admin) {
      await supabaseAdmin
        .from('ai_chat_sessions')
        .update({
          is_ai_enabled: false,
          status: 'need_admin'
        })
        .eq('id', activeSessionId);

      await sendTelegramNotification(
        `🔔 *Pengalihan Chat Manual (Permintaan AI / Handover)*\n\n` +
        `*Nama Klien:* ${client_name || 'Tidak diketahui'}\n` +
        `*Kebutuhan:* ${project_needs || 'Tidak diketahui'}\n` +
        `*Sesi ID:* \`${activeSessionId}\`\n\n` +
        `Harap segera dibalas di dashboard admin!`
      );
    }

    return new Response(JSON.stringify({
      reply,
      sessionId: activeSessionId,
      is_ai_enabled: !should_route_to_admin
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API Chat Error:', error);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan internal server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET({ request }) {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Koneksi database Supabase Admin tidak terkonfigurasi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId diperlukan.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ambil detail sesi
    const { data: session, error: sessionErr } = await supabaseAdmin
      .from('ai_chat_sessions')
      .select('is_ai_enabled, status')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionErr) throw sessionErr;

    if (!session) {
      return new Response(JSON.stringify({ error: 'Sesi tidak ditemukan.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ambil riwayat pesan
    const { data: messages, error: messagesErr } = await supabaseAdmin
      .from('ai_chat_messages')
      .select('sender, message_content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesErr) throw messagesErr;

    return new Response(JSON.stringify({
      is_ai_enabled: session.is_ai_enabled,
      status: session.status,
      messages: messages || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('GET Chat History Error:', error);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan internal server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
