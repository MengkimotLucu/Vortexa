-- =========================================================================
-- MIGRASI KEAMANAN: ROW LEVEL SECURITY (RLS) & POLICIES - VORTEXA
-- =========================================================================
-- Petunjuk Penggunaan:
-- Salin seluruh kode SQL di bawah ini, masuk ke Dashboard Supabase Anda,
-- buka menu "SQL Editor", klik "New Query", paste, dan jalankan (Run).
-- =========================================================================

-- 1. TABEL USER ROLES & FUNGSI BANTU OTORISASI ADMIN
-- Membuat tabel penyimpanan peran user secara terstruktur jika belum ada
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Mengaktifkan Row Level Security untuk tabel user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada untuk mencegah error saat re-run
DROP POLICY IF EXISTS "Admins have full control on user_roles" ON user_roles;

-- Kebijakan RLS: Hanya admin utama yang didefinisikan secara statis yang boleh memodifikasi user_roles
CREATE POLICY "Admins have full control on user_roles" ON user_roles
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('admin@lumovelo.com', 'satrialimpad2@gmail.com')
);

-- Fungsi is_admin() baru yang memvalidasi dari tabel user_roles
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE email = auth.jwt() ->> 'email' 
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Memasukkan admin awal (default)
INSERT INTO user_roles (email, role) VALUES 
('admin@lumovelo.com', 'admin'),
('satrialimpad2@gmail.com', 'admin')
ON CONFLICT (email) DO NOTHING;


-- 2. TABEL: leads (Form kontak prospek)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada untuk mencegah error saat re-run
DROP POLICY IF EXISTS "Public can insert leads" ON leads;
DROP POLICY IF EXISTS "Admins have full control on leads" ON leads;

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

-- Hapus policy lama jika ada untuk mencegah error saat re-run
DROP POLICY IF EXISTS "Admins have full control on chat sessions" ON ai_chat_sessions;

-- Hanya admin yang boleh membaca/menulis dari client-side
CREATE POLICY "Admins have full control on chat sessions" ON ai_chat_sessions 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 4. TABEL: ai_chat_messages (Pesan chat AI)
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada untuk mencegah error saat re-run
DROP POLICY IF EXISTS "Admins have full control on chat messages" ON ai_chat_messages;

-- Hanya admin yang boleh mengelola dari client-side
CREATE POLICY "Admins have full control on chat messages" ON ai_chat_messages 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 5. TABEL: ai_config (Konfigurasi instruksi AI)
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada untuk mencegah error saat re-run
DROP POLICY IF EXISTS "Admins have full control on ai_config" ON ai_config;

-- Hanya admin yang boleh mengelola dari client-side
CREATE POLICY "Admins have full control on ai_config" ON ai_config 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 6. TABEL: documents (Invoice, Kuitansi, SPK, dll)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada untuk mencegah error saat re-run
DROP POLICY IF EXISTS "Admins have full control on documents" ON documents;

-- Hanya admin yang boleh mengelola dari client-side
CREATE POLICY "Admins have full control on documents" ON documents 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 7. TABEL: profit_sharing (Bagi hasil tim)
ALTER TABLE profit_sharing ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada untuk mencegah error saat re-run
DROP POLICY IF EXISTS "Admins have full control on profit_sharing" ON profit_sharing;

-- Hanya admin yang boleh mengelola dari client-side
CREATE POLICY "Admins have full control on profit_sharing" ON profit_sharing 
FOR ALL 
TO authenticated 
USING (is_admin());


-- 8. TABEL: posts (Postingan blog)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada untuk mencegah error saat re-run
DROP POLICY IF EXISTS "Public can view blog posts" ON posts;
DROP POLICY IF EXISTS "Admins can manage blog posts" ON posts;

-- Publik diizinkan membaca postingan blog
CREATE POLICY "Public can view blog posts" ON posts 
FOR SELECT 
USING (true);

-- Hanya admin yang boleh menambah, mengubah, atau menghapus postingan blog
CREATE POLICY "Admins can manage blog posts" ON posts 
FOR ALL 
TO authenticated 
USING (is_admin());
