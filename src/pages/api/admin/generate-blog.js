export const prerender = false;

import { supabaseAdmin } from '../../../lib/supabase';
import { callGroq } from '../../../lib/aiHelper';

const CATEGORY_META = {
  'AI & OTOMATISASI': {
    en: 'AI & AUTOMATION',
    badge: 'bg-indigo-100 text-indigo-750 border-indigo-200',
    links: [
      "Use '/layanan/ai/' for Indonesian AI/chatbot/automation references.",
      "Use '/en/layanan/ai/' for English AI/chatbot/automation references."
    ]
  },
  'IT & WEB DEVELOP': {
    en: 'IT & WEB DEV',
    badge: 'bg-teal-100 text-teal-700 border-teal-200',
    links: [
      "Use '/layanan/web/' or '/#layanan' for Indonesian website references.",
      "Use '/en/layanan/web/' or '/en/#services' for English website references."
    ]
  },
  'SEO & MARKETING': {
    en: 'SEO & MARKETING',
    badge: 'bg-blue-100 text-blue-650 border-blue-200',
    links: [
      "Use '/layanan/seo/' or '/audit' for Indonesian SEO references.",
      "Use '/en/layanan/seo/' or '/en/audit/' for English SEO references."
    ]
  },
  'VIDEO & CREATIVE': {
    en: 'VIDEO & CREATIVE',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    links: [
      "Use '/layanan/video/' for Indonesian video or creative references.",
      "Use '/en/layanan/video/' for English video or creative references."
    ]
  },
  'KEAMANAN JARINGAN': {
    en: 'NETWORK SECURITY',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    links: [
      "Use '/layanan/keamanan-jaringan/' for Indonesian cyber security references.",
      "Use '/en/layanan/keamanan-jaringan/' for English cyber security references."
    ]
  },
  'SOFTWARE QA & TESTING': {
    en: 'SOFTWARE QA & TESTING',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    links: [
      "Use '/layanan/qa/' for Indonesian QA references.",
      "Use '/en/layanan/qa/' for English QA references."
    ]
  }
};

const MONTH_NAMES_ID = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER'
];

function normalizeUrls(input) {
  if (Array.isArray(input)) {
    return input.map(String);
  }

  return String(input || '')
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function compactText(value, maxLength = 4500) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

async function fetchReference(url, index) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`URL referensi nomor ${index + 1} tidak valid.`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`URL referensi nomor ${index + 1} harus memakai http atau https.`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(parsed.href, {
      headers: {
        'User-Agent': 'LumoveloBlogResearchBot/1.0 (+https://www.lumovelo.com)'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || parsed.hostname;
    const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';

    return {
      url: parsed.href,
      title: compactText(title, 180),
      description: compactText(description, 260),
      excerpt: compactText(html)
    };
  } catch (err) {
    throw new Error(`Gagal membaca referensi ${parsed.href}: ${err.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function validateAdmin(token) {
  if (!token) {
    return { error: 'Token autentikasi wajib dilampirkan.', status: 401 };
  }

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return { error: 'Sesi administrator tidak valid atau telah kedaluwarsa.', status: 403 };
  }

  const adminEmails = (import.meta.env.ADMIN_EMAILS || import.meta.env.PUBLIC_ADMIN_EMAILS || 'admin@lumovelo.com')
    .split(',')
    .map((email) => email.trim().toLowerCase());
  const userEmail = user.email?.toLowerCase();

  if (!userEmail || !adminEmails.includes(userEmail)) {
    return { error: 'Akses ditolak. Pengguna bukan administrator resmi.', status: 403 };
  }

  return { user };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  if (!supabaseAdmin) {
    return jsonResponse({ error: 'Koneksi database Admin tidak terkonfigurasi.' }, 500);
  }

  try {
    const { category, keyword, token, articleType = 'evergreen', sourceUrls = '' } = await request.json();

    if (!category) {
      return jsonResponse({ error: 'Kategori wajib disertakan.' }, 400);
    }

    const adminCheck = await validateAdmin(token);
    if (adminCheck.error) {
      return jsonResponse({ error: adminCheck.error }, adminCheck.status);
    }

    const normalizedType = articleType === 'news' ? 'news' : 'evergreen';
    const urls = normalizeUrls(sourceUrls);

    if (normalizedType === 'news' && urls.length === 0) {
      return jsonResponse({
        error: 'Mode berita terkini membutuhkan minimal 1 link referensi agar AI tidak menebak fakta terbaru.'
      }, 400);
    }

    const references = normalizedType === 'news'
      ? await Promise.all(urls.slice(0, 5).map(fetchReference))
      : [];

    const categoryMeta = CATEGORY_META[category] || CATEGORY_META['SEO & MARKETING'];
    const d = new Date();
    const formattedDate = `${String(d.getDate()).padStart(2, '0')} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;

    const systemInstruction = `
      You are a senior bilingual SEO editor for LUMOVELO, a professional and creative digital studio.
      Generate one blog article in Indonesian and one localized English version.

      Return ONLY a valid JSON object with this exact structure:
      {
        "id": {
          "title": "Indonesian SEO title",
          "slug": "indonesian-url-slug",
          "description": "Indonesian meta description, 1-2 sentences",
          "content": "Clean Indonesian HTML article"
        },
        "en": {
          "title": "English SEO title",
          "slug": "english-url-slug",
          "description": "English meta description, 1-2 sentences",
          "content": "Clean English HTML article"
        },
        "source_summary": "Short Indonesian summary of how references were used, or empty string for evergreen articles"
      }

      Content rules:
      1. Write 450-750 words per language.
      2. Use clean HTML only. Do not use Markdown.
      3. Paragraphs must use: <p class="mb-6 text-slate-650 leading-relaxed">...</p>
      4. Subheadings must use: <h3 class="text-xl font-display font-black text-slate-900 mt-8 mb-4 uppercase tracking-tight">...</h3>
      5. Internal links must be natural and relevant:
         - ${categoryMeta.links.join('\n         - ')}
      6. The English version must be localized and natural, not a literal word-for-word translation.
      7. For news articles, use ONLY the supplied reference excerpts for current facts. Do not invent dates, names, stats, product releases, quotes, or claims.
      8. For news articles, include a short "Sumber Referensi" section in Indonesian and "Reference Sources" section in English at the end, with links to supplied source URLs.
    `;

    const referenceBlock = references.length > 0
      ? references.map((ref, index) => `
        [SOURCE ${index + 1}]
        URL: ${ref.url}
        TITLE: ${ref.title}
        DESCRIPTION: ${ref.description}
        EXCERPT: ${ref.excerpt}
      `).join('\n')
      : 'No external references supplied. Write an evergreen educational article.';

    const userPrompt = `
      Article type: ${normalizedType === 'news' ? 'current news analysis based on supplied references' : 'evergreen SEO education'}
      Indonesian category: ${category}
      English category: ${categoryMeta.en}
      Topic / keyword: ${keyword || 'Choose the strongest relevant topic for this category'}
      Publication date label: ${formattedDate}

      References:
      ${referenceBlock}
    `;

    const responseJson = await callGroq(
      [{ role: 'user', content: userPrompt }],
      systemInstruction,
      { max_tokens: 6500, temperature: normalizedType === 'news' ? 0.35 : 0.65 }
    );

    if (!responseJson?.id?.title || !responseJson?.id?.content || !responseJson?.en?.title || !responseJson?.en?.content) {
      throw new Error('Respons Groq tidak valid atau struktur JSON bilingual tidak lengkap.');
    }

    const slugId = slugify(responseJson.id.slug || responseJson.id.title);
    const slugEn = slugify(responseJson.en.slug || responseJson.en.title);

    const payload = {
      title: responseJson.id.title.trim(),
      slug: slugId,
      date: formattedDate,
      category,
      bg_category: categoryMeta.badge,
      description: responseJson.id.description ? responseJson.id.description.trim() : responseJson.id.title.trim(),
      content: responseJson.id.content.trim(),
      title_en: responseJson.en.title.trim(),
      slug_en: slugEn,
      category_en: categoryMeta.en,
      description_en: responseJson.en.description ? responseJson.en.description.trim() : responseJson.en.title.trim(),
      content_en: responseJson.en.content.trim(),
      article_type: normalizedType,
      source_urls: references.map((ref) => ref.url),
      source_summary: responseJson.source_summary ? String(responseJson.source_summary).trim() : ''
    };

    const { data, error: dbErr } = await supabaseAdmin
      .from('posts')
      .insert([payload])
      .select()
      .single();

    if (dbErr) {
      if (dbErr.code === '23505') {
        const suffix = Math.floor(Date.now() / 1000).toString().slice(-4);
        payload.slug = `${payload.slug}-${suffix}`;
        payload.slug_en = `${payload.slug_en}-${suffix}`;

        const { data: retryData, error: retryErr } = await supabaseAdmin
          .from('posts')
          .insert([payload])
          .select()
          .single();

        if (retryErr) throw retryErr;
        return jsonResponse({ success: true, post: retryData });
      }

      if (dbErr.message?.includes('column') && dbErr.message?.includes('does not exist')) {
        throw new Error('Kolom bilingual blog belum ada di Supabase. Jalankan file supabase_blog_bilingual_migration.sql terlebih dahulu.');
      }

      throw dbErr;
    }

    return jsonResponse({ success: true, post: data });
  } catch (err) {
    console.error('Error generating AI blog post:', err);
    return jsonResponse({ error: err.message || 'Gagal membuat artikel blog otomatis.' }, 500);
  }
}
