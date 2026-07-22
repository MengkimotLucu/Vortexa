export const prerender = false; // Memaksa Astro merender endpoint ini secara dinamis (SSR)

import { supabaseAdmin } from '../../lib/supabase';
import { callGroq, sendTelegramNotification } from '../../lib/aiHelper';
import systemInstructionEn from '../../lib/system_instruction_en.txt?raw';
import systemInstructionId from '../../lib/system_instruction_id.txt?raw';

// Daftar kata kunci layanan
const KEYWORDS = [
  'harga', 'jasa', 'layanan', 'web', 'website', 'video', 'seo', 'portofolio', 'portfolio',
  'biaya', 'tarif', 'agency', 'buat', 'bikin', 'order', 'pesan', 'tanya', 'promo', 'diskon', 'ai',
  'lumovelo', 'vortexa', 'produk', 'desain', 'developer',
  'hari', 'waktu', 'durasi', 'lama', 'cepat', 'selesai', 'pengerjaan', 'proses', 'deadline', 'kapan',
  'jadwal', 'minggu', 'bulan', 'kontrak', 'mou', 'kerja', 'sama', 'revisi', 'garansi', 'fitur',
  'fungsi', 'sistem', 'pembayaran', 'dp', 'bayar', 'cicil', 'angsur', 'termin', 'tahap', 'transfer', 'kontak', 'wa', 'whatsapp',
  'email', 'telepon', 'alamat', 'kantor', 'domain', 'hosting', 'server', 'aplikasi', 'apps',
  'mobile', 'android', 'ios', 'logo', 'branding', 'design',
  'company', 'profile', 'landing', 'page', 'ecommerce', 'toko', 'online', 'beda', 'apa', 'bagaimana',
  'apakah', 'jelaskan', 'cara', 'saran', 'rekomendasi', 'solusi', 'kelebihan', 'kekurangan', 'contoh', 'situs',
  'keamanan', 'security', 'pentest', 'cyber', 'audit', 'speed', 'performa', 'scan',
  'rekening', 'invoice', 'pajak', 'ppn', 'spk', 'perjanjian', 'hukum', 'legal', 'resmi', 'cv', 'pt', 'badan hukum',
  'ketemu', 'meeting', 'offline', 'tatap muka', 'zoom', 'gmeet', 'lokasi', 'jakarta', 'bandung',
  'source code', 'figma', 'akses', 'admin', 'login', 'cpanel', 'database', 'kepemilikan', 'milik',
  'eror', 'error', 'bug', 'rusak', 'hack', 'perbaikan', 'warranty', 'maintenance', 'down', 'mati',
  'kasir', 'crm', 'erp', 'dashboard', 'demo', 'testimoni', 'review'
];

// Daftar sapaan umum
const GREETINGS = [
  'halo', 'hi', 'hello', 'siang', 'pagi', 'malam', 'sore', 'p', 'permisi', 'assalamualaikum', 'askum', 'spada'
];

// Daftar ucapan terima kasih
const THANK_YOU_WORDS = [
  'terima kasih', 'terimakasih', 'makasih', 'tengs', 'thanks', 'thank you', 'suwun', 'nuhun', 'matur nuwun'
];

/**
 * Menormalisasi nomor WhatsApp ke format internasional (diawali 62).
 */
function normalizeWhatsAppNumber(number) {
  if (!number) return '';
  let cleaned = number.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+62')) {
    cleaned = '62' + cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (!cleaned.startsWith('62') && cleaned.length >= 9 && cleaned.length <= 15) {
    cleaned = '62' + cleaned;
  }
  return cleaned.replace(/[^0-9]/g, '');
}

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

/**
 * Memeriksa apakah pesan mengandung ucapan terima kasih.
 */
function isThankYou(text) {
  const normalized = text.toLowerCase().trim().replace(/[^a-zA-Z\s]/g, "");
  return THANK_YOU_WORDS.some(word => normalized.includes(word));
}

// Helper normalisasi leetspeak (misal: 4nj1ng -> anjing)
function normalizeLeetspeak(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/4|@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1|!|\|/g, 'i')
    .replace(/0/g, 'o')
    .replace(/5|\$/g, 's')
    .replace(/7/g, 't');
}

// Check apakah teks mengandung kata terlarang (blacklist)
function checkBlacklist(text, blacklistArray) {
  if (!text || !blacklistArray || blacklistArray.length === 0) return null;
  const normalizedText = normalizeLeetspeak(text);
  
  for (const word of blacklistArray) {
    const trimmedWord = word.trim().toLowerCase();
    if (!trimmedWord) continue;
    const normalizedWord = normalizeLeetspeak(trimmedWord);
    
    // Pembedaan konteks bisnis: Jika kalimat bisnis cukup panjang & relevan, jangan di-block
    const isBusinessContext = (
      normalizedText.length > 25 &&
      (normalizedText.includes('web') || normalizedText.includes('aplikasi') || normalizedText.includes('layanan') || normalizedText.includes('biaya') || normalizedText.includes('harga') || normalizedText.includes('jasa') || normalizedText.includes('toko') || normalizedText.includes('sistem'))
    );

    if (normalizedText.includes(normalizedWord) && !isBusinessContext) {
      return trimmedWord;
    }
  }
  return null;
}

export async function POST({ request, clientAddress }) {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Koneksi database Supabase Admin tidak terkonfigurasi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { message, sessionId, lang, clientName, whatsappNumber, isTester } = await request.json();
    const isEn = lang === 'en';

    if (!message || message.trim() === '') {
      return new Response(JSON.stringify({ error: 'Pesan tidak boleh kosong.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 0. Ekstrak Telemetri & Metadata Perangkat
    const clientIp = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || clientAddress || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    const locationCity = request.headers.get('x-vercel-ip-city') || '';
    const locationCountry = request.headers.get('x-vercel-ip-country') || '';

    // Ambil daftar banned_ips & blacklisted_words dari ai_config
    const defaultBlacklist = 'jokowi, prabowo, megawati, soeharto, soekarno, trump, obama, naruto, sambo, kaesang, anjing, monyet, babi, kontol, memek, pepek, bangsat, pantek, asu, bajingan, asdfgh, qwerty, testerrr';
    let bannedIpsArray = [];
    let blacklistArray = defaultBlacklist.split(',').map(w => w.trim());

    try {
      const { data: configData } = await supabaseAdmin
        .from('ai_config')
        .select('banned_ips, blacklisted_words')
        .eq('id', 'default')
        .maybeSingle();

      if (configData) {
        if (configData.banned_ips) {
          bannedIpsArray = configData.banned_ips.split(',').map(i => i.trim()).filter(Boolean);
        }
        if (configData.blacklisted_words) {
          blacklistArray = configData.blacklisted_words.split(',').map(w => w.trim()).filter(Boolean);
        }
      }
    } catch (cfgErr) {
      console.warn('Could not load ai_config blacklist:', cfgErr);
    }

    // 1. Cek apakah IP pengguna terblokir (Banned IP Check)
    if (clientIp !== 'unknown' && bannedIpsArray.includes(clientIp)) {
      return new Response(JSON.stringify({
        reply: isEn
          ? "Your access has been restricted by the administrator. Please contact Lumovelo team directly via WhatsApp."
          : "Akses Anda telah dibatasi oleh administrator. Silakan hubungi tim Lumovelo secara langsung melalui WhatsApp.",
        sessionId: sessionId || null,
        is_ai_enabled: false
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Cek Tier 1 (Validasi Nama Input)
    if (clientName) {
      const matchedNameWord = checkBlacklist(clientName, blacklistArray);
      if (matchedNameWord) {
        return new Response(JSON.stringify({
          reply: isEn
            ? "Please use your real name so our team can greet you properly."
            : "Mohon gunakan nama panggilan asli Anda agar tim kami dapat menyapa Anda dengan baik.",
          sessionId: sessionId || null,
          is_ai_enabled: true
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 3. Cek Tier 2 (Pencegatan Kata Kotor / Insult Tanpa Panggil API AI)
    const matchedMsgWord = checkBlacklist(message, blacklistArray);
    if (matchedMsgWord && !message.startsWith('[System Info:')) {
      const warningReply = isEn
        ? "Sorry, our system detected inappropriate language. Please use polite language so we can assist your digital needs."
        : "Maaf, sistem kami mendeteksi kata-kata yang kurang sesuai. Mohon gunakan bahasa yang santun agar kami dapat membantu kebutuhan digital Anda.";

      return new Response(JSON.stringify({
        reply: warningReply,
        sessionId: sessionId || null,
        is_ai_enabled: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let activeSessionId = sessionId;
    let isAiEnabled = true;

    // 4. Jika tidak ada sessionId, buat sesi chat baru & simpan data telemetri secara bertahap (Resilient Multi-Tier Insert)
    if (!activeSessionId) {
      const fullTelemetryUa = (locationCity || locationCountry)
        ? `${userAgent || ''} [${[locationCity, locationCountry].filter(Boolean).join(', ')}]`
        : userAgent;

      // Tier 1: Coba insert lengkap dengan IP, User Agent & Lokasi
      let { data: newSession, error: sErr } = await supabaseAdmin
        .from('ai_chat_sessions')
        .insert({
          client_ip: clientIp,
          user_agent: fullTelemetryUa,
          ...(locationCity && { location_city: locationCity }),
          ...(locationCountry && { location_country: locationCountry }),
          status: 'active',
          is_ai_enabled: true
        })
        .select()
        .single();

      // Tier 2: Jika error kolom lokasi, coba tanpa lokasi
      if (sErr) {
        const res2 = await supabaseAdmin
          .from('ai_chat_sessions')
          .insert({
            client_ip: clientIp,
            user_agent: fullTelemetryUa,
            status: 'active',
            is_ai_enabled: true
          })
          .select()
          .single();
        newSession = res2.data;
        sErr = res2.error;
      }

      // Tier 3: Jika user_agent / client_ip tidak ada di tabel, coba insert minimal (status & is_ai_enabled)
      if (sErr) {
        const res3 = await supabaseAdmin
          .from('ai_chat_sessions')
          .insert({
            status: 'active',
            is_ai_enabled: true
          })
          .select()
          .single();
        newSession = res3.data;
        sErr = res3.error;
      }

      // Tier 4: Fallback absolute minimal
      if (sErr) {
        const res4 = await supabaseAdmin
          .from('ai_chat_sessions')
          .insert({})
          .select()
          .single();
        newSession = res4.data;
        sErr = res4.error;
      }

      if (sErr || !newSession) throw (sErr || new Error('Gagal membuat sesi chat di database.'));
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

      // Update telemetri IP & User Agent secara aman
      const { error: updateErr } = await supabaseAdmin
        .from('ai_chat_sessions')
        .update({
          client_ip: clientIp,
          user_agent: userAgent
        })
        .eq('id', activeSessionId);

      if (updateErr) {
        await supabaseAdmin
          .from('ai_chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', activeSessionId);
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
        ...(whatsappNumber && { whatsapp_number: normalizeWhatsAppNumber(whatsappNumber) })
      };

      const { data: existingLeads } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: false })
        .limit(1);
      const existingLead = existingLeads && existingLeads.length > 0 ? existingLeads[0] : null;

      if (existingLead) {
        await supabaseAdmin
          .from('leads')
          .update(leadData)
          .eq('id', existingLead.id);
      } else {
        await supabaseAdmin
          .from('leads')
          .insert(leadData);

        // Kirim Telegram HANYA jika memasukkan WhatsApp Valid
        if (whatsappNumber && whatsappNumber.trim().length >= 8 && whatsappNumber !== '0800000000') {
          const waClean = normalizeWhatsAppNumber(whatsappNumber);
          await sendTelegramNotification(
            `💼 *Prospek Baru Terdaftar (Form)*\n\n` +
            `*Nama:* ${clientName || '-'}\n` +
            `*WhatsApp:* \`${waClean}\`\n` +
            `💬 [Chat via WA](https://wa.me/${waClean})\n\n` +
            `Cek selengkapnya di Dashboard Admin Lumovelo!`
          );
        }
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

    let userMsgCount = 0;
    let lead = null;
    let hasWa = false;

    // 3.5 Batasi chat gratis jika belum memasukkan nomor WhatsApp
    try {
      const { count: fetchedUserMsgCount, error: countErr } = await supabaseAdmin
        .from('ai_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', activeSessionId)
        .eq('sender', 'user');

      if (countErr) throw countErr;
      userMsgCount = fetchedUserMsgCount || 0;

      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('whatsapp_number, client_name')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: false })
        .limit(1);
      lead = leads && leads.length > 0 ? leads[0] : null;

      hasWa = lead && lead.whatsapp_number && lead.whatsapp_number.trim() !== '';

      if (userMsgCount >= 5 && !hasWa && !isTester) {
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

    // 4. Cek filter kata kunci (hanya untuk pesan pertama dalam sesi)
    const isFirstMessage = userMsgCount <= 1;
    const msgHasKeywords = containsKeywords(message);
    const msgIsGreeting = isGreeting(message);
    const msgIsThankYou = isThankYou(message);

    // Jika pesan pertama tidak mengandung kata kunci DAN bukan sapaan DAN bukan ucapan terima kasih (kecuali mode tester)
    if (isFirstMessage && !msgHasKeywords && !msgIsGreeting && !msgIsThankYou && !isTester) {
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

    // 4.5. Anti-Spam / Rate Limiting (Maksimal 15 pesan per menit per sesi)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: msgCount, error: countError } = await supabaseAdmin
      .from('ai_chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', activeSessionId)
      .eq('sender', 'user')
      .gt('created_at', oneMinuteAgo);

    if (countError) {
      console.error('Error saat mengecek rate limit:', countError);
    } else if (msgCount && msgCount >= 15) {
      const throttleReply = isEn
        ? "You are sending messages too quickly. Please wait about 15-30 seconds before sending another message."
        : "Anda mengirim pesan terlalu cepat. Silakan tunggu sekitar 15-30 detik sebelum mengirim pesan lagi.";
      
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
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchMsgsErr) throw fetchMsgsErr;

    // Balikkan urutan agar kronologis (lama ke baru) untuk Groq API
    const history = [...dbMessages].reverse().map(msg => ({
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
      systemInstruction = isEn ? systemInstructionEn : systemInstructionId;
    }

    // Tambahkan info status pengisian form ke instruksi sistem secara dinamis
    const clientNameInDb = lead && lead.client_name ? lead.client_name : '';
    const formStatusContext = isEn
      ? `\n\n[USER_CONTEXT: The user has ${hasWa ? 'ALREADY filled' : 'NOT filled'} the contact form. User Name: "${clientNameInDb || 'unknown'}". WhatsApp: "${lead?.whatsapp_number || 'unknown'}". If they have already filled the form, DO NOT ask them to fill it again. Instead, proceed directly to the next steps (Step 02: Solution mapping discussion via WhatsApp, Step 03: Proposal, Step 04: Dev & Launch) and inform them that our team will contact them shortly on WhatsApp.]`
      : `\n\n[USER_CONTEXT: Pengguna ${hasWa ? 'SUDAH mengisi' : 'BELUM mengisi'} form kontak. Nama Pengguna: "${clientNameInDb || 'tidak diketahui'}". WhatsApp: "${lead?.whatsapp_number || 'tidak diketahui'}". Jika pengguna SUDAH mengisi form, JANGAN suruh/minta mereka mengisi form kontak lagi. Jelaskan langsung bahwa langkah selanjutnya adalah tim LUMOVELO akan menghubungi mereka melalui WhatsApp untuk melakukan Diskusi Pemetaan Solusi (Langkah 02), dilanjutkan Penawaran (Langkah 03), dan Pengerjaan (Langkah 04).]`;
      
    systemInstruction += formStatusContext;

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
    let { reply, client_name, company_name, project_needs, tech_stack, whatsapp_number, lead_temperature, estimated_budget, should_route_to_admin } = groqResponse;

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
      const { data: existingLeads } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: false })
        .limit(1);
      const existingLead = existingLeads && existingLeads.length > 0 ? existingLeads[0] : null;

      // Strict Lead Temperature Qualification
      const hasValidPhone = whatsapp_number && whatsapp_number.trim().length >= 8 && whatsapp_number !== '0800000000';
      const hasBudgetNum = /\b(\d+|\d+[\.,]\d+)\s*(jt|juta|rb|ribu|m|miliar|k)|budget|biaya|biayanya|rp\s*\d+/i.test(message + ' ' + (estimated_budget || '') + ' ' + (project_needs || ''));

      let strictTemperature = 'cold';
      if (hasValidPhone && (hasBudgetNum || (estimated_budget && estimated_budget !== '-'))) {
        strictTemperature = 'hot';
      } else if (hasValidPhone && (project_needs || client_name)) {
        strictTemperature = 'warm';
      } else {
        strictTemperature = 'cold';
      }

      const leadData = {
        session_id: activeSessionId,
        client_name: isTester ? (client_name ? `[TESTER] ${client_name}` : '[MODE TESTER]') : client_name,
        company_name: isTester ? `[TESTER] ${company_name || '-'}` : company_name,
        project_needs: isTester ? `[MODE TESTER] ${project_needs || 'Pengujian Internal'}` : project_needs,
        ...(tech_stack && { tech_stack }),
        ...(whatsapp_number && { whatsapp_number: normalizeWhatsAppNumber(whatsapp_number) }),
        lead_temperature: isTester ? 'cold' : strictTemperature,
        ...(estimated_budget && { estimated_budget }),
        ...(isTester && { is_tester: true })
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

        // Kirim notifikasi Telegram HANYA untuk lead berkualitas (HOT atau WARM dengan No. WA Valid)
        if (!isTester && hasValidPhone && (strictTemperature === 'hot' || strictTemperature === 'warm')) {
          const tempEmoji = strictTemperature === 'hot' ? '🔥 HOT LEAD' : '☀️ WARM LEAD';
          const waClean = normalizeWhatsAppNumber(whatsapp_number);
          const waLink = `https://wa.me/${waClean}`;

          await sendTelegramNotification(
            `💼 *${tempEmoji} TERDETEKSI!*\n\n` +
            `*Nama:* ${client_name || '-'}\n` +
            `*Perusahaan:* ${company_name || '-'}\n` +
            `*Kebutuhan:* ${project_needs || '-'}\n` +
            `*Estimasi Budget:* ${estimated_budget || '-'}\n` +
            `*WhatsApp:* \`${waClean}\`\n\n` +
            `💬 [Chat Langsung di WhatsApp](${waLink})\n` +
            `📍 *Lokasi:* ${locationCity || 'Indonesia'}, ${locationCountry || ''}\n\n` +
            `Cek selengkapnya di Dashboard Admin Lumovelo!`
          );
        }
      }

      // Update info nama dan whatsapp ke ai_chat_sessions jika ada
      if (client_name || whatsapp_number || isTester) {
        await supabaseAdmin
          .from('ai_chat_sessions')
          .update({
            client_name: isTester ? (client_name ? `[TESTER] ${client_name}` : '[MODE TESTER]') : client_name,
            ...(whatsapp_number && { client_whatsapp: whatsapp_number }),
            ...(isTester && { is_tester: true })
          })
          .eq('id', activeSessionId);
      }
    }

    // 9. Jika AI memutuskan obrolan harus ditangani admin (kecuali mode tester)
    if (should_route_to_admin && !isTester) {
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

    // Catatan Jam Operasional (08:00 - 00:00 WIB)
    const nowWib = new Date(Date.now() + 7 * 3600 * 1000);
    const wibHour = nowWib.getUTCHours();
    // Jam 00:00 - 07:59 WIB adalah di luar jam operasional
    const isAfterHours = wibHour >= 0 && wibHour < 8;

    if (isAfterHours && reply && !reply.includes('jam operasional')) {
      const bookingUrl = process.env.PUBLIC_BOOKING_URL || import.meta.env.PUBLIC_BOOKING_URL || 'https://cal.com/lumovelo/15min';
      const afterHoursNotice = isEn
        ? `\n\n📌 *Note: You are contacting us outside our operational hours (08:00 - 00:00 WIB / GMT+7). You can directly book a 15-minute consultation session for tomorrow morning here: [Book Consultation Page](${bookingUrl}). Our team will prioritize responding to your inquiry.*`
        : `\n\n📌 *Catatan: Anda menghubungi di luar jam operasional (08:00 - 00:00 WIB). Kakak bisa langsung menjadwalkan sesi konsultasi gratis 15 menit melalui kalender jadwal kami di sini: [Halaman Jadwal Konsultasi](${bookingUrl}). Tim kami akan memprioritaskan konsultasi Anda.*`;
      reply += afterHoursNotice;
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
