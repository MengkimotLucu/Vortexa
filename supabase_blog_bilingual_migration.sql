-- ============================================================================
-- LUMOVELO: BLOG BILINGUAL + AUTOMATIC NEWS RESEARCH
-- ============================================================================
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor > New query.
-- Query ini aman dijalankan ulang (menggunakan IF NOT EXISTS / upsert).
--
-- Catatan keamanan:
-- 1. JANGAN memasukkan GROQ_API_KEY ke SQL atau database.
-- 2. GROQ_API_KEY tetap disimpan sebagai environment variable di Vercel.
-- 3. Generator berita mengambil sumber dari Google News RSS melalui server API,
--    lalu menyimpan URL sumber dan ringkasan riset di kolom posts.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. Kolom bilingual dan metadata riset berita pada tabel posts
-- --------------------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS slug_en TEXT,
  ADD COLUMN IF NOT EXISTS category_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT,
  ADD COLUMN IF NOT EXISTS article_type TEXT NOT NULL DEFAULT 'evergreen',
  ADD COLUMN IF NOT EXISTS source_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_summary TEXT;

-- Pastikan data lama tetap memiliki tipe artikel dan kategori Inggris.
UPDATE public.posts
SET article_type = COALESCE(NULLIF(article_type, ''), 'evergreen'),
    category_en = COALESCE(category_en, CASE category
      WHEN 'AI & OTOMATISASI' THEN 'AI & AUTOMATION'
      WHEN 'IT & WEB DEVELOP' THEN 'IT & WEB DEV'
      WHEN 'SEO & MARKETING' THEN 'SEO & MARKETING'
      WHEN 'VIDEO & CREATIVE' THEN 'VIDEO & CREATIVE'
      WHEN 'KEAMANAN JARINGAN' THEN 'NETWORK SECURITY'
      WHEN 'SOFTWARE QA & TESTING' THEN 'SOFTWARE QA & TESTING'
      ELSE category
    END),
    source_urls = COALESCE(source_urls, '{}');

-- Index untuk listing blog, pencarian slug, dan filter tipe artikel.
CREATE INDEX IF NOT EXISTS posts_slug_idx
  ON public.posts (slug);

CREATE INDEX IF NOT EXISTS posts_slug_en_idx
  ON public.posts (slug_en)
  WHERE slug_en IS NOT NULL AND slug_en <> '';

CREATE INDEX IF NOT EXISTS posts_article_type_idx
  ON public.posts (article_type);

CREATE INDEX IF NOT EXISTS posts_created_at_idx
  ON public.posts (created_at DESC);

-- --------------------------------------------------------------------------
-- 2. Monitoring API key (hanya metadata/mask, bukan secret key)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys_monitor (
  id BIGSERIAL PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  api_key_masked TEXT NOT NULL,
  used_quota INTEGER NOT NULL DEFAULT 0,
  max_quota INTEGER NOT NULL DEFAULT 1000,
  status TEXT NOT NULL DEFAULT 'active',
  last_limited_at TIMESTAMPTZ,
  reset_duration_seconds INTEGER NOT NULL DEFAULT 60,
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS api_keys_monitor_status_idx
  ON public.api_keys_monitor (status);

-- --------------------------------------------------------------------------
-- 3. RLS untuk posts
-- --------------------------------------------------------------------------
-- Helper otorisasi admin. Jika sudah ada, struktur/data tidak ditimpa.
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.user_roles (email, role) VALUES
  ('admin@lumovelo.com', 'admin'),
  ('satrialimpad2@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view blog posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.posts;

-- Website publik perlu membaca artikel dari Supabase.
CREATE POLICY "Public can view blog posts"
  ON public.posts
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin yang sudah login dapat membuat, mengubah, dan menghapus artikel.
-- API server menggunakan service role sehingga tetap dapat menulis artikel.
CREATE POLICY "Admins can manage blog posts"
  ON public.posts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------------
-- 4. RLS untuk metadata monitoring API
-- --------------------------------------------------------------------------
ALTER TABLE public.api_keys_monitor ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage API key monitor" ON public.api_keys_monitor;

CREATE POLICY "Admins can manage API key monitor"
  ON public.api_keys_monitor
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;

-- ============================================================================
-- VERIFIKASI SETELAH RUN
-- ============================================================================
-- Jalankan bagian ini terpisah jika ingin memeriksa hasil:
--
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'posts'
-- ORDER BY ordinal_position;
--
-- SELECT id, title, slug, title_en, slug_en, article_type, source_urls
-- FROM public.posts
-- ORDER BY created_at DESC
-- LIMIT 10;
--
-- SELECT key_name, api_key_masked, status, is_selected
-- FROM public.api_keys_monitor
-- ORDER BY id;
