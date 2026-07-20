// Helper utility untuk integrasi Google Gemini API dan Telegram Bot API.
import { supabaseAdmin } from './supabase';

// Pisahkan GROQ_API_KEY berdasarkan koma (jika ada beberapa key)
const GROQ_KEYS = (import.meta.env.GROQ_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
const TELEGRAM_BOT_TOKEN = import.meta.env.Telegrambot;
const TELEGRAM_CHAT_ID = import.meta.env.TelegramChatId;

/**
 * Memanggil Groq Cloud API (Llama-3.3-70b-versatile) untuk menghasilkan balasan chat
 * sekaligus mengekstrak data lead secara terstruktur dalam format JSON.
 * 
 * @param {Array<{role: string, content: string}>} history - Riwayat percakapan format OpenAI.
 * @param {string} systemInstruction - Instruksi sistem/prompt.
 * @returns {Promise<object>} Objek hasil ekstraksi JSON dari Groq.
 */
export async function callGroq(history, systemInstruction, options = {}) {
  if (GROQ_KEYS.length === 0) {
    throw new Error('GROQ_API_KEY tidak ditemukan di environment variables.');
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history
  ];

  const requestBody = {
    model: options.model || 'llama-3.3-70b-versatile',
    messages: messages,
    response_format: { type: 'json_object' },
    max_tokens: options.max_tokens || 500,
    temperature: options.temperature !== undefined ? options.temperature : 0.7
  };

  // 1. Coba baca dari database monitor jika tabel sudah dimigrasi
  let keysMap = [];
  let dbSupported = false;

  if (supabaseAdmin) {
    try {
      const { data: dbKeys, error: dbErr } = await supabaseAdmin
        .from('api_keys_monitor')
        .select('*')
        .order('id', { ascending: true });

      if (!dbErr && dbKeys && dbKeys.length > 0) {
        dbSupported = true;
        // Cari baris kunci Groq
        const groqRows = dbKeys.filter(k => k.key_name.toLowerCase().includes('groq'));
        
        // Map database keys ke actual keys berdasarkan index
        groqRows.forEach((row, index) => {
          if (GROQ_KEYS[index]) {
            keysMap.push({
              row: row,
              actualKey: GROQ_KEYS[index]
            });
          }
        });

        // Auto-restore limited keys jika waktu tunggu sudah terlewati
        const now = new Date();
        for (const item of keysMap) {
          if (item.row.status === 'limited' && item.row.last_limited_at) {
            const limitTime = new Date(item.row.last_limited_at);
            const diffSeconds = (now.getTime() - limitTime.getTime()) / 1000;
            if (diffSeconds >= (item.row.reset_duration_seconds || 60)) {
              item.row.status = 'active';
              item.row.last_limited_at = null;
              await supabaseAdmin
                .from('api_keys_monitor')
                .update({ status: 'active', last_limited_at: null })
                .eq('id', item.row.id);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[aiHelper] Gagal memuat API Key dari database. Menggunakan fallback env...', err.message);
    }
  }

  // Tentukan urutan API Key yang akan digunakan
  let sortedKeysToTry = [];
  if (dbSupported && keysMap.length > 0) {
    const activeSelected = keysMap.filter(k => k.row.is_selected && k.row.status === 'active');
    const activeOthers = keysMap.filter(k => !k.row.is_selected && k.row.status === 'active').sort(() => Math.random() - 0.5);
    const limitedKeys = keysMap.filter(k => k.row.status === 'limited');
    sortedKeysToTry = [...activeSelected, ...activeOthers, ...limitedKeys];
  } else {
    // Fallback: Acak kunci (Load Balancing) bawaan env
    sortedKeysToTry = GROQ_KEYS.map(key => ({
      actualKey: key,
      row: null
    })).sort(() => Math.random() - 0.5);
  }

  let lastError = null;

  for (const keyToTry of sortedKeysToTry) {
    const apiKey = keyToTry.actualKey;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.status === 429) {
        console.warn(`[Groq API Warning] Key ${apiKey.substring(0, 10)}... terkena rate limit (429).`);
        if (dbSupported && keyToTry.row) {
          // Tandai status as limited di database
          await supabaseAdmin
            .from('api_keys_monitor')
            .update({ status: 'limited', last_limited_at: new Date().toISOString() })
            .eq('id', keyToTry.row.id);
        }
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      
      if (!rawText) {
        throw new Error('Groq API mengembalikan respons kosong.');
      }

      // Catat penggunaan sukses di database
      if (dbSupported && keyToTry.row) {
        await supabaseAdmin
          .from('api_keys_monitor')
          .update({ used_quota: (keyToTry.row.used_quota || 0) + 1 })
          .eq('id', keyToTry.row.id);
      }

      return JSON.parse(rawText);
    } catch (err) {
      lastError = err;
      console.error(`[Groq Error] Gagal memanggil Groq dengan key ${apiKey.substring(0, 10)}...:`, err.message);
    }
  }

  throw lastError || new Error('Semua kunci API Groq yang tersedia gagal memproses permintaan.');
}

/**
 * Mengirimkan pesan notifikasi ke Telegram Bot admin.
 * 
 * @param {string} message - Pesan dalam format Markdown.
 * @returns {Promise<boolean>} Status pengiriman.
 */
export async function sendTelegramNotification(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram token atau chat ID tidak disetel di .env. Notifikasi Telegram dilewati.');
    return false;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  // Konversi Markdown dasar ke HTML untuk mencegah error parsing karakter khusus Telegram Markdown
  let htmlMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Ganti *teks* menjadi <b>teks</b>
  htmlMessage = htmlMessage.replace(/\*(.*?)\*/g, '<b>$1</b>');

  // Ganti `teks` menjadi <code>teks</code>
  htmlMessage = htmlMessage.replace(/`(.*?)`/g, '<code>$1</code>');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: htmlMessage,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Gagal mengirim ke Telegram: ${err}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saat menghubungi Telegram API:', error);
    return false;
  }
}
