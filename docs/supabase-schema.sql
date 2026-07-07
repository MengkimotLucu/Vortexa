-- 1. Create table for Documents (SPK, MOU, RAB, Kuitansi, BAST, SRS, Invoice)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_type TEXT NOT NULL,
    doc_number TEXT UNIQUE NOT NULL,
    client_name TEXT,
    client_company TEXT,
    amount NUMERIC DEFAULT 0,
    status TEXT,
    doc_date DATE,
    deadline TEXT,
    doc_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Allow public read documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Allow public insert documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete documents" ON public.documents FOR DELETE USING (true);


-- 2. Create table for Profit Sharing
CREATE TABLE IF NOT EXISTS public.profit_sharing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL,
    client_name TEXT,
    project_name TEXT,
    total_amount NUMERIC DEFAULT 0,
    agency_share NUMERIC DEFAULT 0,
    team_share NUMERIC DEFAULT 0,
    team_members JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profit_sharing
ALTER TABLE public.profit_sharing ENABLE ROW LEVEL SECURITY;

-- Create policies for profit_sharing
CREATE POLICY "Allow public read profit_sharing" ON public.profit_sharing FOR SELECT USING (true);
CREATE POLICY "Allow public insert profit_sharing" ON public.profit_sharing FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profit_sharing" ON public.profit_sharing FOR UPDATE USING (true);
CREATE POLICY "Allow public delete profit_sharing" ON public.profit_sharing FOR DELETE USING (true);


-- 3. Create table for Wedding Invitations (Sisi Klien)
CREATE TABLE IF NOT EXISTS public.wedding_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    theme TEXT NOT NULL,
    groom_name TEXT NOT NULL,
    groom_ig TEXT,
    groom_parents TEXT NOT NULL,
    bride_name TEXT NOT NULL,
    bride_ig TEXT,
    bride_parents TEXT NOT NULL,
    akad_date DATE NOT NULL,
    akad_time TEXT NOT NULL,
    akad_location TEXT NOT NULL,
    akad_maps TEXT NOT NULL,
    resepsi_date DATE NOT NULL,
    resepsi_time TEXT NOT NULL,
    resepsi_location TEXT NOT NULL,
    resepsi_maps TEXT NOT NULL,
    music_url TEXT,
    whatsapp_rsvp TEXT NOT NULL,
    payment_info JSONB DEFAULT '{}'::jsonb,
    photos JSONB DEFAULT '[]'::jsonb, -- Untuk menampung daftar galeri foto prewedding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for wedding_invitations
ALTER TABLE public.wedding_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for wedding_invitations
CREATE POLICY "Allow public read wedding_invitations" ON public.wedding_invitations FOR SELECT USING (true);
CREATE POLICY "Allow public insert wedding_invitations" ON public.wedding_invitations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update wedding_invitations" ON public.wedding_invitations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete wedding_invitations" ON public.wedding_invitations FOR DELETE USING (true);
