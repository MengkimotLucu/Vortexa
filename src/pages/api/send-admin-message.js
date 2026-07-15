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
