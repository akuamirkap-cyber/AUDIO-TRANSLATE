import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Gemini initialization with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resilient multi-model executor with automatic quota fallback
async function generateWithFallback(params: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
}) {
  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        ...(Object.keys(config).length > 0 ? { config } : {}),
      });

      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed (${err?.status || err?.code}): ${err?.message?.slice(0, 70)}. Trying fallback...`);
      if (err?.status === 429 || err?.status === 503 || err?.code === 429 || err?.code === 503) {
        continue;
      }
      break;
    }
  }

  throw lastError;
}

// Endpoint: Real-time text translation with tone & slang adaptation
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'auto', targetLang = 'id' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const langNames: Record<string, string> = {
      id: 'Bahasa Indonesia (Natural, casual subtitle style)',
      en: 'English',
      ja: 'Japanese (日本語)',
      ko: 'Korean (한국어)',
      zh: 'Chinese Mandarin (中文)',
      ar: 'Arabic (العربية)',
      es: 'Spanish (Español)',
      fr: 'French (Français)',
      de: 'German (Deutsch)',
      ru: 'Russian (Русский)',
      auto: 'Auto-detect source language',
    };

    const targetDescription = langNames[targetLang] || targetLang;

    const systemInstruction = `You are an elite real-time video subtitle translator for social media (YouTube, Instagram Reels, TikTok, podcasts).
Translate the spoken sentence or phrase accurately and naturally into ${targetDescription}.
Guidelines:
- Match conversational context, internet slang, and idioms naturally.
- Keep it concise and punchy like movie/video subtitles.
- If the source is already in the target language, refine it for clarity.
- Output JSON with:
  "translatedText": (string, translated subtitle),
  "detectedLanguage": (string, e.g. "English", "Japanese", "Korean", etc.),
  "sentiment": (string, e.g. "excited", "informative", "casual", "urgent")`;

    const response = await generateWithFallback({
      contents: `Translate this spoken audio text for video subtitle: "${text.trim()}"`,
      systemInstruction,
      responseMimeType: 'application/json',
    });

    const rawResponse = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      parsed = {
        translatedText: rawResponse.trim(),
        detectedLanguage: 'Unknown',
        sentiment: 'casual',
      };
    }

    return res.json({
      originalText: text,
      translatedText: parsed.translatedText || text,
      detectedLanguage: parsed.detectedLanguage || 'Auto',
      sentiment: parsed.sentiment || 'casual',
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    return res.status(500).json({
      error: 'Gagal menerjemahkan teks suara',
      details: error?.message || String(error),
    });
  }
});

// Endpoint: Audio chunk transcription & translation (Direct speech audio -> translation)
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/wav', targetLang = 'id' } = req.body;

    if (!audioData) {
      return res.json({ originalText: '', translatedText: '', detectedLanguage: 'None' });
    }

    // Clean base64 string if it contains data URI scheme
    const cleanBase64 = audioData.includes(',') ? audioData.split(',')[1] : audioData;

    // Ignore tiny or empty chunks
    if (!cleanBase64 || cleanBase64.length < 1000) {
      return res.json({ originalText: '', translatedText: '', detectedLanguage: 'None' });
    }

    const langPrompt = targetLang === 'id'
      ? 'Bahasa Indonesia yang santai, gaul atau formal sesuai konteks video'
      : targetLang;

    const audioPart = {
      inlineData: {
        mimeType: (mimeType.split(';')[0] || 'audio/wav').trim(),
        data: cleanBase64,
      },
    };

    const promptPart = {
      text: `You are an audio transcriber and subtitle translator for screen audio (YouTube, Instagram).
Listen to the audio clip.
1. Transcribe what is spoken verbatim in its original language.
2. Translate the spoken text into ${langPrompt}.
Return strictly JSON with:
{
  "originalText": "...",
  "translatedText": "...",
  "detectedLanguage": "..."
}
If there is no clear speech, return empty strings for originalText and translatedText.`,
    };

    const response = await generateWithFallback({
      contents: [audioPart, promptPart],
      responseMimeType: 'application/json',
    });

    const raw = response.text || '{}';
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = {
        originalText: '',
        translatedText: raw.trim(),
        detectedLanguage: 'Detected',
      };
    }

    return res.json(data);
  } catch (error: any) {
    console.warn('Audio transcription error:', error?.message || error);
    return res.json({
      originalText: '',
      translatedText: '',
      detectedLanguage: 'None',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
