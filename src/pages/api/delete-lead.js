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
    const { leadId, sessionId, token } = await request.json();

    if (!leadId) {
      return new Response(JSON.stringify({ error: 'ID Prospek wajib disertakan.' }), {
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
    const isAdmin = userEmail && (adminEmails.includes(userEmail) || userEmail.endsWith('@lumovelo.com'));

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Akses ditolak. Pengguna bukan administrator resmi.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hapus data secara relasional
    // 1. Hapus data lead
    const { error: leadErr } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (leadErr) throw leadErr;

    // 2. Hapus data pesan & sesi obrolan jika ada sessionId
    if (sessionId) {
      const { error: msgErr } = await supabaseAdmin
        .from('ai_chat_messages')
        .delete()
        .eq('session_id', sessionId);

      if (msgErr) throw msgErr;

      const { error: sessErr } = await supabaseAdmin
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessErr) throw sessErr;
    }

    return new Response(JSON.stringify({ success: true, message: 'Prospek beserta sesi percakapan berhasil dihapus secara permanen.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error deleting lead via Admin API:', err);
    return new Response(JSON.stringify({ error: err.message || 'Terjadi kesalahan sistem saat menghapus prospek.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
