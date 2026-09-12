-- =========================================================================
-- MIGRASI BLOG BILINGUAL + REFERENSI BERITA - LUMOVELO
-- =========================================================================
-- Jalankan di Supabase SQL Editor sebelum memakai generator blog bilingual.
-- Aman dijalankan berulang karena memakai IF NOT EXISTS.
-- =========================================================================

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS slug_en TEXT,
  ADD COLUMN IF NOT EXISTS category_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS content_en TEXT,
  ADD COLUMN IF NOT EXISTS article_type TEXT NOT NULL DEFAULT 'evergreen',
  ADD COLUMN IF NOT EXISTS source_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_summary TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_en_unique
  ON posts (slug_en)
  WHERE slug_en IS NOT NULL AND slug_en <> '';

CREATE INDEX IF NOT EXISTS posts_article_type_idx
  ON posts (article_type);

UPDATE posts
SET category_en = CASE category
  WHEN 'AI & OTOMATISASI' THEN 'AI & AUTOMATION'
  WHEN 'IT & WEB DEVELOP' THEN 'IT & WEB DEV'
  WHEN 'SEO & MARKETING' THEN 'SEO & MARKETING'
  WHEN 'VIDEO & CREATIVE' THEN 'VIDEO & CREATIVE'
  WHEN 'KEAMANAN JARINGAN' THEN 'NETWORK SECURITY'
  WHEN 'SOFTWARE QA & TESTING' THEN 'SOFTWARE QA & TESTING'
  ELSE category
END
WHERE category_en IS NULL;
