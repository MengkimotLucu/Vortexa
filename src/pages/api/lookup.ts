import type { APIRoute } from 'astro';
export const prerender = false;

import { supabaseAdmin } from '../../lib/supabase';

function identifyIndonesianProvider(phone: string): string {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.slice(2);
  }
  const prefix = cleaned.substring(0, 4);

  const prefixMap: Record<string, string> = {
    '0811': 'Telkomsel (kartuHALO)', '0812': 'Telkomsel (simPATI/HALO)', '0813': 'Telkomsel (simPATI)',
    '0821': 'Telkomsel (simPATI)', '0822': 'Telkomsel (Loop)', '0823': 'Telkomsel (Kartu As)',
    '0851': 'Telkomsel (By.U / AS)', '0852': 'Telkomsel (Kartu As)', '0853': 'Telkomsel (Kartu As)',
    '0814': 'Indosat (M2)', '0815': 'Indosat (Mentari/Matrix)', '0816': 'Indosat (Mentari)',
    '0855': 'Indosat (Matrix)', '0856': 'Indosat (IM3)', '0857': 'Indosat (IM3)', '0858': 'Indosat (Mentari)',
    '0817': 'XL Axiata', '0818': 'XL Axiata', '0819': 'XL Axiata',
    '0859': 'XL Axiata', '0877': 'XL Axiata', '0878': 'XL Axiata',
    '0831': 'AXIS (XL Axiata)', '0832': 'AXIS (XL Axiata)', '0833': 'AXIS (XL Axiata)', '0838': 'AXIS (XL Axiata)',
    '0881': 'Smartfren', '0882': 'Smartfren', '0883': 'Smartfren', '0884': 'Smartfren',
    '0885': 'Smartfren', '0886': 'Smartfren', '0887': 'Smartfren', '0888': 'Smartfren', '0889': 'Smartfren',
    '0895': 'Tri (3 / Indosat)', '0896': 'Tri (3 / Indosat)', '0897': 'Tri (3 / Indosat)',
    '0898': 'Tri (3 / Indosat)', '0899': 'Tri (3 / Indosat)'
  };

  return prefixMap[prefix] || 'Operator Seluler (Indonesia)';
}

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseAdmin) {
    return new Response(JSON.stringify({ error: 'Koneksi database Supabase Admin tidak terkonfigurasi.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json().catch(() => null);
    const query: string = body?.query || '';
    const token: string = body?.token || '';

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token autentikasi wajib dilampirkan.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: userData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    const user = userData ? userData.user : null;
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Sesi administrator tidak valid.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) {
      return new Response(JSON.stringify({ error: 'Masukkan Alamat IP atau Nomor HP untuk mengecek.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isIp = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(trimmedQuery) || /^[0-9a-fA-F:]+$/.test(trimmedQuery);

    if (isIp) {
      let geoData: any = null;
      try {
        const res = await fetch('http://ip-api.com/json/' + trimmedQuery + '?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,isp,org,as,query,mobile,proxy,hosting');
        if (res.ok) {
          geoData = await res.json();
        }
      } catch (err) {
        console.warn('IP API fetch failed:', err);
      }

      const { data: sessions } = await supabaseAdmin
        .from('ai_chat_sessions')
        .select('id, client_name, client_whatsapp, status, created_at')
        .eq('client_ip', trimmedQuery)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: configData } = await supabaseAdmin
        .from('ai_config')
        .select('banned_ips')
        .eq('id', 'default')
        .maybeSingle();

      const bannedIps = (configData?.banned_ips || '').split(',').map((i: string) => i.trim());
      const isBanned = bannedIps.includes(trimmedQuery);

      return new Response(JSON.stringify({
        type: 'ip',
        query: trimmedQuery,
        isBanned,
        geo: (geoData && geoData.status === 'success') ? {
          city: geoData.city || 'Tidak Diketahui',
          region: geoData.regionName || '',
          country: geoData.country || 'Indonesia',
          countryCode: geoData.countryCode || 'ID',
          isp: geoData.isp || geoData.org || 'ISP Seluler',
          isMobile: geoData.mobile || false,
          isProxy: geoData.proxy || geoData.hosting || false,
          lat: geoData.lat,
          lon: geoData.lon,
          mapUrl: (geoData.lat && geoData.lon) ? ('https://maps.google.com/?q=' + geoData.lat + ',' + geoData.lon) : null
        } : null,
        history: sessions || []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      let cleanedPhone = trimmedQuery.replace(/[^0-9]/g, '');
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = '62' + cleanedPhone.slice(1);
      }

      const provider = identifyIndonesianProvider(cleanedPhone);

      const { data: leads } = await supabaseAdmin
        .from('leads')
        .select('id, client_name, company_name, project_needs, status, lead_temperature, created_at')
        .or('whatsapp_number.ilike.%' + cleanedPhone.slice(-8) + '%,whatsapp_number.ilike.%' + trimmedQuery + '%')
        .order('created_at', { ascending: false })
        .limit(5);

      const waUrl = 'https://wa.me/' + cleanedPhone + '?text=' + encodeURIComponent('Halo, saya Admin Lumovelo. Boleh kami bantu terkait konsultasi proyek digital Anda?');
      const truecallerUrl = 'https://www.truecaller.com/search/id/' + cleanedPhone;

      return new Response(JSON.stringify({
        type: 'phone',
        query: trimmedQuery,
        cleanedPhone,
        provider,
        waUrl,
        truecallerUrl,
        history: leads || []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (err: any) {
    console.error('Error handling lookup:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Gagal memproses pencarian telemetri.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
