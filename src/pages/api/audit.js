export const prerender = false;

export async function GET({ request }) {
  const urlParams = new URL(request.url).searchParams;
  let targetUrl = urlParams.get('url');
  const lang = urlParams.get('lang') === 'en' ? 'en' : 'id';

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: lang === 'en' ? 'URL parameter is required.' : 'Parameter URL wajib diisi.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Prepend protocol if missing
  targetUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  // Validate URL format
  try {
    new URL(targetUrl);
  } catch (e) {
    return new Response(JSON.stringify({ error: lang === 'en' ? 'Invalid URL format.' : 'Format URL tidak valid.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = process.env.PAGESPEED_API_KEY || '';
  const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&category=performance&category=seo&strategy=mobile${apiKey ? `&key=${apiKey}` : ''}`;

  try {
    const response = await fetch(apiEndpoint);
    if (!response.ok) {
      const errText = await response.text();
      console.error('PageSpeed API error response:', errText);
      throw new Error(`Google PageSpeed API returned status ${response.status}`);
    }

    const data = await response.json();
    const lighthouse = data.lighthouseResult;

    if (!lighthouse || !lighthouse.categories) {
      throw new Error('Lighthouse result is empty or malformed.');
    }

    // Extract Scores (Scale 0 - 100)
    const performanceScore = Math.round((lighthouse.categories.performance?.score || 0) * 100);
    const seoScore = Math.round((lighthouse.categories.seo?.score || 0) * 100);

    // Extract Core Web Vitals Metrics
    const audits = lighthouse.audits || {};
    const metrics = {
      fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
      lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
      tbt: audits['total-blocking-time']?.displayValue || 'N/A',
      cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
    };

    // Construct human-readable recommendations
    const opportunities = [];

    if (lang === 'en') {
      if (audits['modern-image-formats']?.score < 0.9 || audits['uses-optimized-images']?.score < 0.9) {
        opportunities.push({
          title: 'Optimize & Compress Images',
          desc: 'Several images are too large. Utilizing WebP or AVIF formats can speed up loading by 1.5s to 3s.',
          impact: 'High'
        });
      }
      if (audits['render-blocking-resources']?.score < 0.9) {
        opportunities.push({
          title: 'Eliminate Render-Blocking Resources',
          desc: 'External CSS or JavaScript is blocking the initial paint. Defer non-critical JS/CSS.',
          impact: 'High'
        });
      }
      if (audits['meta-description']?.score < 0.9) {
        opportunities.push({
          title: 'Empty Meta Description',
          desc: 'Your page lacks a meta description. This reduces CTR and click appeal in Google search results.',
          impact: 'Medium'
        });
      }
      if (audits['image-alt']?.score < 0.9) {
        opportunities.push({
          title: 'Missing Image ALT Attributes',
          desc: 'Some images lack descriptive Alt tags, hindering Google search engines from indexing your visual content.',
          impact: 'Medium'
        });
      }
      if (audits['document-title']?.score < 0.9) {
        opportunities.push({
          title: 'Suboptimal Title Tag',
          desc: 'Your page title is empty, too short, or lacks relevant keywords for search engines.',
          impact: 'High'
        });
      }
    } else {
      if (audits['modern-image-formats']?.score < 0.9 || audits['uses-optimized-images']?.score < 0.9) {
        opportunities.push({
          title: 'Kompres & Optimasi Gambar',
          desc: 'Beberapa gambar berukuran terlalu besar. Menggunakan format modern seperti WebP/AVIF akan mempercepat loading hingga 1.5 - 3 detik.',
          impact: 'Tinggi'
        });
      }
      if (audits['render-blocking-resources']?.score < 0.9) {
        opportunities.push({
          title: 'Eliminasi Pemblokir Render',
          desc: 'Ada stylesheet (CSS) atau script (JS) eksternal yang menghambat pemuatan awal halaman Anda.',
          impact: 'Tinggi'
        });
      }
      if (audits['meta-description']?.score < 0.9) {
        opportunities.push({
          title: 'Meta Deskripsi SEO Kosong',
          desc: 'Website Anda tidak memiliki deskripsi meta. Hal ini membuat situs Anda kurang menarik di hasil pencarian Google.',
          impact: 'Sedang'
        });
      }
      if (audits['image-alt']?.score < 0.9) {
        opportunities.push({
          title: 'Atribut ALT Gambar Hilang',
          desc: 'Beberapa gambar tidak memiliki teks deskripsi alternatif (Alt Text), menyulitkan Google mengindeks gambar Anda.',
          impact: 'Sedang'
        });
      }
      if (audits['document-title']?.score < 0.9) {
        opportunities.push({
          title: 'Judul Halaman (Title Tag) Tidak Optimal',
          desc: 'Tag judul kosong atau terlalu pendek untuk memuat kata kunci bisnis Anda.',
          impact: 'Tinggi'
        });
      }
    }

    // Fallback if website is clean
    if (opportunities.length === 0) {
      opportunities.push({
        title: lang === 'en' ? 'Leverage Cache & CDN' : 'Aktifkan Caching & CDN',
        desc: lang === 'en' 
          ? 'Enable browser caching or hook up Cloudflare CDN for faster asset delivery.' 
          : 'Gunakan caching browser yang agresif atau sambungkan Cloudflare CDN untuk pengiriman aset lebih cepat.',
        impact: 'Low'
      });
    }

    return new Response(JSON.stringify({
      success: true,
      url: targetUrl,
      scores: {
        performance: performanceScore,
        seo: seoScore
      },
      metrics,
      opportunities
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Audit handler error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: lang === 'en' ? 'Failed to run audit. Make sure the website is active and public.' : 'Gagal menjalankan audit. Pastikan website aktif dan dapat diakses publik.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
