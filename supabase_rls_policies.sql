-- =========================================================================
-- MIGRASI KEAMANAN: ROW LEVEL SECURITY (RLS) & POLICIES - VORTEXA
-- =========================================================================
-- Petunjuk Penggunaan:
-- Salin seluruh kode SQL di bawah ini, masuk ke Dashboard Supabase Anda,
-- buka menu "SQL Editor", klik "New Query", paste, dan jalankan (Run).
-- =========================================================================

-- 1. FUNGSI BANTU OTORISASI ADMIN
-- Fungsi ini memeriksa apakah user yang login memiliki email admin yang valid.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN (
    auth.jwt() ->> 'email' = 'admin@lumovelo.com' 
    OR auth.jwt() ->> 'email' LIKE '%@lumovelo.com'
  );
END;
$$ LANGUAGE plpgsql;


-- 2. TABEL: leads (Form kontak prospek)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Izinkan publik untuk mengirim form prospek (Insert)
CREATE POLICY "Public can insert leads" ON leads 
FOR INSERT 
WITH CHECK (true);

-- Hanya admin yang boleh mengelola (Select, Update, Delete)
CREATE POLICY "Admins have full control on leads" ON leads 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 3. TABEL: ai_chat_sessions (Sesi chat AI)
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang boleh membaca/menulis dari client-side
-- (Catatan: Endpoint API backend menggunakan admin client yang otomatis membypass RLS ini)
CREATE POLICY "Admins have full control on chat sessions" ON ai_chat_sessions 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 4. TABEL: ai_chat_messages (Pesan chat AI)
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang boleh mengelola dari client-side
CREATE POLICY "Admins have full control on chat messages" ON ai_chat_messages 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 5. TABEL: ai_config (Konfigurasi instruksi AI)
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang boleh mengelola dari client-side
CREATE POLICY "Admins have full control on ai_config" ON ai_config 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 6. TABEL: documents (Invoice, Kuitansi, SPK, dll)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang boleh mengelola dari client-side
CREATE POLICY "Admins have full control on documents" ON documents 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 7. TABEL: profit_sharing (Bagi hasil tim)
ALTER TABLE profit_sharing ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang boleh mengelola dari client-side
CREATE POLICY "Admins have full control on profit_sharing" ON profit_sharing 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 8. TABEL: posts (Postingan blog)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Publik diizinkan membaca postingan blog
CREATE POLICY "Public can view blog posts" ON posts 
FOR SELECT 
USING (true);

-- Hanya admin yang boleh menambah, mengubah, atau menghapus postingan blog
CREATE POLICY "Admins can manage blog posts" ON posts 
FOR ALL 
TO authenticated 
USING (is_admin());
