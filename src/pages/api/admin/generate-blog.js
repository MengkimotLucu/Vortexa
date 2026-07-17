export const prerender = false;

import { supabaseAdmin } from '../../../lib/supabase';
import { callGroq } from '../../../lib/aiHelper';

export async function POST({ request }) {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Koneksi database Admin tidak terkonfigurasi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { category, keyword, token } = await request.json();

    if (!category) {
      return new Response(JSON.stringify({ error: 'Kategori wajib disertakan.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Validasi token admin untuk memastikan admin sudah masuk
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

    // 2. Tentukan styling badge berdasarkan kategori
    let bgCategory = 'bg-blue-100 text-blue-650 border-blue-200';
    if (category === 'AI & OTOMATISASI') {
      bgCategory = 'bg-indigo-100 text-indigo-750 border-indigo-200';
    } else if (category === 'IT & WEB DEVELOP') {
      bgCategory = 'bg-teal-100 text-teal-700 border-teal-200';
    } else if (category === 'SEO & MARKETING') {
      bgCategory = 'bg-blue-100 text-blue-650 border-blue-200';
    } else if (category === 'VIDEO & CREATIVE') {
      bgCategory = 'bg-purple-100 text-purple-700 border-purple-200';
    } else if (category === 'KEAMANAN JARINGAN') {
      bgCategory = 'bg-rose-100 text-rose-700 border-rose-200';
    }

    // 3. Format tanggal bahasa Indonesia hari ini
    const monthNamesID = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    const d = new Date();
    const formattedDate = `${String(d.getDate()).padStart(2, '0')} ${monthNamesID[d.getMonth()]} ${d.getFullYear()}`;

    // 4. Susun System Prompt & User Prompt untuk Groq
    const systemInstruction = `
      Anda adalah seorang Copywriter Profesional dan SEO Specialist senior untuk agensi kreatif digital LUMOVELO.
      Tugas Anda adalah menulis satu artikel blog berkualitas tinggi, edukatif, mendalam, dan ramah SEO dalam bahasa Indonesia.
      
      Anda wajib menghasilkan respon dalam format JSON objek dengan kunci-kunci berikut:
      {
        "title": "Judul Artikel yang memikat dan ramah SEO",
        "slug": "slug-url-unik-huruf-kecil-dan-tanda-hubung-tanpa-spasi",
        "description": "Ringkasan pendek artikel (1-2 kalimat) untuk meta description pencarian",
        "content": "Isi konten lengkap artikel dalam format HTML yang bersih"
      }

      Aturan Penulisan Konten:
      1. Tulis minimal 300 - 550 kata. Buat konten yang berbobot dan informatif.
      2. Jangan gunakan format Markdown (seperti ### atau **) untuk judul sub-bab atau ketebalan teks di dalam field "content". Selalu gunakan tag HTML murni.
      3. Di dalam field "content", wajib gunakan tag pembuka paragraf seperti: <p class="mb-6 text-slate-650 leading-relaxed">...</p>
      4. Untuk judul sub-bab di dalam konten, gunakan tag: <h3 class="text-xl font-display font-black text-slate-900 mt-8 mb-4 uppercase tracking-tight">...</h3>
      5. Sisipkan tautan internal (internal linking) secara natural menggunakan anchor text yang relevan:
         - Arahkan ke '/layanan/ai/' jika membahas AI/chatbot/otomatisasi.
         - Arahkan ke '/layanan/web/' atau '/#layanan' jika membahas pembuatan/redesign website atau landing page.
         - Arahkan ke '/layanan/seo/' atau '/audit' jika membahas SEO, optimasi kecepatan, atau audit.
         - Arahkan ke '/layanan/video/' jika membahas video promosi atau kreatif.
         - Arahkan ke '/layanan/keamanan-jaringan/' jika membahas proteksi router, firewall kantor, pentest IT, ransomware, atau cyber security.
    `;

    const userPrompt = `
      Buatlah artikel dengan kriteria berikut:
      - Kategori: ${category}
      - Kata Kunci / Topik Spesifik: ${keyword || 'Tentukan topik terbaik yang sedang tren terkait kategori ini'}
    `;

    // 5. Panggil Groq dengan token maksimal tinggi agar artikel tidak terpotong
    const responseJson = await callGroq(
      [{ role: 'user', content: userPrompt }],
      systemInstruction,
      { max_tokens: 2500, temperature: 0.7 }
    );

    if (!responseJson || !responseJson.title || !responseJson.content) {
      throw new Error('Respons Groq tidak valid atau struktur JSON tidak lengkap.');
    }

    // 6. Siapkan Payload & Masukkan ke Supabase
    const payload = {
      title: responseJson.title.trim(),
      slug: responseJson.slug.trim().toLowerCase(),
      date: formattedDate,
      category: category,
      bg_category: bgCategory,
      description: responseJson.description ? responseJson.description.trim() : responseJson.title.trim(),
      content: responseJson.content.trim()
    };

    const { data, error: dbErr } = await supabaseAdmin
      .from('posts')
      .insert([payload])
      .select()
      .single();

    if (dbErr) {
      // Jika error karena slug terduplikasi, tambahkan suffix timestamp acak
      if (dbErr.code === '23505') { 
        payload.slug = `${payload.slug}-${Math.floor(Date.now() / 1000).toString().slice(-4)}`;
        const { data: retryData, error: retryErr } = await supabaseAdmin
          .from('posts')
          .insert([payload])
          .select()
          .single();
        if (retryErr) throw retryErr;
        return new Response(JSON.stringify({ success: true, post: retryData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw dbErr;
    }

    return new Response(JSON.stringify({ success: true, post: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error generating AI blog post:', err);
    return new Response(JSON.stringify({ error: err.message || 'Gagal membuat artikel blog otomatis.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
