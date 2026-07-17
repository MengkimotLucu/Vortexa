export const prerender = false;

import { supabaseAdmin } from '../../lib/supabase';

export async function POST({ request }) {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Koneksi database Admin tidak terkonfigurasi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { sessionId, message, token } = await request.json();

    if (!sessionId || !message || !message.trim()) {
      return new Response(JSON.stringify({ error: 'sessionId dan pesan wajib disertakan.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validasi token admin untuk memastikan admin sudah masuk
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token autentikasi wajib dilampirkan.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Sisipkan pesan baru
    const { data, error } = await supabaseAdmin
      .from('ai_chat_messages')
      .insert({
        session_id: sessionId,
        sender: 'assistant', // Agar terlihat sebagai balasan dari pihak Lumovelo (oleh admin)
        message_content: message.trim()
      })
      .select()
      .single();

    if (error) throw error;

    // Matikan AI untuk sesi ini karena admin sudah membalas secara manual
    const { error: sessionUpdateErr } = await supabaseAdmin
      .from('ai_chat_sessions')
      .update({
        is_ai_enabled: false,
        status: 'need_admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (sessionUpdateErr) {
      console.error('Gagal memperbarui status sesi chat:', sessionUpdateErr);
    }

    return new Response(JSON.stringify({ success: true, message: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error sending admin message:', err);
    return new Response(JSON.stringify({ error: 'Gagal mengirim pesan admin.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
