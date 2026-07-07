import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Error: URL atau Service Key tidak ditemukan di file .env");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Edit email dan password yang Anda inginkan di bawah ini
const adminEmail = "satrialimpad2@gmail.com";
const adminPassword = "satria1124"; // Ganti dengan password yang Anda inginkan

async function createAdmin() {
  console.log(`Mencoba mendaftarkan admin: ${adminEmail}...`);

  // Ambil daftar user untuk mengecek apakah email sudah terdaftar
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error("Gagal mengambil daftar user:", listError.message);
    return;
  }

  const existingUser = usersData.users.find((u) => u.email === adminEmail);

  if (existingUser) {
    console.log(`User dengan email ${adminEmail} sudah terdaftar. Menghapus user lama agar bisa dibuat ulang secara bersih...`);
    
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      console.error("Gagal menghapus user lama:", deleteError.message);
      return;
    }
  }

  console.log(`Membuat user admin baru terkonfirmasi...`);
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true
  });

  if (error) {
    console.error("Gagal membuat admin baru:", error.message);
  } else {
    console.log("\n==================================================");
    console.log("SUKSES: Admin baru berhasil dibuat dan terkonfirmasi!");
    console.log(`Email   : ${data.user.email}`);
    console.log(`Password: ${adminPassword}`);
    console.log("==================================================\n");
    console.log("Silakan kembali ke halaman website dan lakukan login.");
  }
}

createAdmin();
