import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkExposedTables() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    const data = await response.json();
    console.log("Definisi tabel yang terdeteksi:");
    if (data.definitions) {
      console.log(Object.keys(data.definitions));
    } else {
      console.log("Response JSON:", data);
    }
  } catch (e) {
    console.error("Gagal mengambil daftar tabel:", e.message);
  }
}

checkExposedTables();
