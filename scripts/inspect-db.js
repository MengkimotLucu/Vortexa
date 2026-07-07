import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase
    .from('wedding_invitations')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Gagal mengambil data:", error.message);
  } else {
    console.log("Koneksi sukses!");
    if (data && data.length > 0) {
      console.log("Kolom yang ada di baris pertama:", Object.keys(data[0]));
    } else {
      console.log("Tabel kosong, tidak ada baris untuk diinspeksi. Kita akan mencoba mengambil skema.");
      // Alternatif: Coba insert kosong untuk melihat error kolom
      const { error: insertError } = await supabase
        .from('wedding_invitations')
        .insert({ non_existent_column_test: 'test' });
      console.log("Pesan error dari insert test (untuk melihat nama kolom):", insertError?.message);
    }
  }
}

inspect();
