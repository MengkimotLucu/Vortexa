// Helper utility untuk integrasi Google Gemini API dan Telegram Bot API.

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
export async function callGroq(history, systemInstruction) {
  if (GROQ_KEYS.length === 0) {
    throw new Error('GROQ_API_KEY tidak ditemukan di environment variables.');
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history
  ];

  const requestBody = {
    model: 'llama-3.3-70b-versatile',
    messages: messages,
    response_format: { type: 'json_object' },
    max_tokens: 500,
    temperature: 0.7
  };

  // Coba gunakan kunci satu per satu jika terjadi rate limit (429)
  let lastError = null;
  
  // Acak kunci (Load Balancing) agar beban request merata
  const shuffledKeys = [...GROQ_KEYS].sort(() => Math.random() - 0.5);

  for (const apiKey of shuffledKeys) {
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
        console.warn(`[Groq API Warning] Key ${apiKey.substring(0, 10)}... terkena rate limit (429). Mencoba kunci cadangan...`);
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

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
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
