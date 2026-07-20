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

    // Jika pesan pertama tidak mengandung kata kunci DAN bukan sapaan DAN bukan ucapan terima kasih, arahkan ke admin manual
    if (isFirstMessage && !msgHasKeywords && !msgIsGreeting && !msgIsThankYou) {
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
      const { data: existingLeads } = await supabaseAdmin
        .from('leads')
        .select('id')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: false })
        .limit(1);
      const existingLead = existingLeads && existingLeads.length > 0 ? existingLeads[0] : null;

      const leadData = {
        session_id: activeSessionId,
        client_name: isTester ? (client_name ? `[TESTER] ${client_name}` : '[MODE TESTER]') : client_name,
        ...(company_name && { company_name }),
        project_needs: isTester ? `[MODE TESTER] ${project_needs || 'Pengujian Internal'}` : project_needs,
        ...(tech_stack && { tech_stack }),
        ...(whatsapp_number && { whatsapp_number: normalizeWhatsAppNumber(whatsapp_number) }),
        ...(lead_temperature && { lead_temperature: isTester ? 'cold' : lead_temperature }),
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

        // Kirim notifikasi Telegram untuk lead baru pertama kali (kecuali mode tester)
        if (!isTester) {
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

    // 9. Jika AI memutuskan obrolan harus ditangani admin
    if (should_route_to_admin) {
      await supabaseAdmin
        .from('ai_chat_sessions')
        .update({
          is_ai_enabled: false,
          status: 'need_admin'
        })
        .eq('id', activeSessionId);

      if (!isTester) {
        await sendTelegramNotification(
          `🔔 *Pengalihan Chat Manual (Permintaan AI / Handover)*\n\n` +
          `*Nama Klien:* ${client_name || 'Tidak diketahui'}\n` +
          `*Kebutuhan:* ${project_needs || 'Tidak diketahui'}\n` +
          `*Sesi ID:* \`${activeSessionId}\`\n\n` +
          `Harap segera dibalas di dashboard admin!`
        );
      }
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
