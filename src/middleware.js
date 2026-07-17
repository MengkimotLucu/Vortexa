import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // Hanya jalankan proteksi untuk halaman di bawah /admin/ (kecuali halaman login dan static assets)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && pathname !== '/admin/login') {
    const accessToken = context.cookies.get('sb-access-token')?.value;
    const refreshToken = context.cookies.get('sb-refresh-token')?.value;

    if (!accessToken && !refreshToken) {
      return context.redirect('/admin/login/');
    }

    // Buat client Supabase sementara untuk validasi token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    let user = null;

    // Coba validasi access token terlebih dahulu
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (data?.user) {
        user = data.user;
      }
    }

    // Jika access token kedaluwarsa atau tidak ada, coba refresh dengan refresh token
    if (!user && refreshToken) {
      try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
        if (data?.session && data?.user) {
          const session = data.session;
          user = data.user;

          // Set cookies baru di response
          context.cookies.set('sb-access-token', session.access_token, {
            path: '/',
            maxAge: session.expires_in,
            sameSite: 'lax',
            secure: true
          });
          context.cookies.set('sb-refresh-token', session.refresh_token, {
            path: '/',
            maxAge: 604800,
            sameSite: 'lax',
            secure: true
          });
        }
      } catch (err) {
        console.error('Error refreshing session in middleware:', err);
      }
    }

    if (!user) {
      // Bersihkan cookie jika sesi tidak valid
      context.cookies.delete('sb-access-token', { path: '/' });
      context.cookies.delete('sb-refresh-token', { path: '/' });
      return context.redirect('/admin/login/');
    }

    // Validasi apakah email user adalah email admin resmi
    const adminEmails = (import.meta.env.ADMIN_EMAILS || import.meta.env.PUBLIC_ADMIN_EMAILS || 'admin@lumovelo.com')
      .split(',')
      .map(email => email.trim().toLowerCase());
    const userEmail = user.email?.toLowerCase();
    const isAdmin = userEmail && adminEmails.includes(userEmail);

    if (!isAdmin) {
      context.cookies.delete('sb-access-token', { path: '/' });
      context.cookies.delete('sb-refresh-token', { path: '/' });
      return context.redirect('/admin/login/');
    }
  }

  // Jika user sudah login dan mencoba mengakses /admin/login/, arahkan ke dashboard
  if ((pathname === '/admin/login' || pathname === '/admin/login/') && context.cookies.has('sb-access-token')) {
    const accessToken = context.cookies.get('sb-access-token')?.value;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
    try {
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      if (user) {
        // Otorisasi email admin
        const adminEmails = (import.meta.env.ADMIN_EMAILS || import.meta.env.PUBLIC_ADMIN_EMAILS || 'admin@lumovelo.com')
          .split(',')
          .map(email => email.trim().toLowerCase());
        const userEmail = user.email?.toLowerCase();
        const isAdmin = userEmail && adminEmails.includes(userEmail);
        if (isAdmin) {
          return context.redirect('/admin/dashboard/');
        }
      }
    } catch (e) {
      // Abaikan jika token tidak valid
    }
  }

  return next();
});
