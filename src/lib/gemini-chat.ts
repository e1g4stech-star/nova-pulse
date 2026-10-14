import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// =========================================================
// SYSTEM PROMPT — Nova Pulse AI Persona
// =========================================================
export const NOVA_PULSE_SYSTEM_PROMPT = `Kamu adalah Nova Pulse AI, asisten cerdas untuk content creator Indonesia.

Keahlian kamu:
- Content creation (Instagram, TikTok, YouTube, Facebook, Pinterest)
- Copywriting & caption yang engaging
- Riset hashtag & strategi viral
- Content calendar & scheduling
- Affiliate marketing & monetisasi
- Analisis performa konten

Gaya komunikasi:
- Ramah, profesional, dan actionable
- Bahasa Indonesia natural, boleh sesekali English untuk istilah teknis
- Beri contoh konkret, bukan teori abstrak
- Kalau user minta list, kasih bullet points yang jelas
- Kalau user kasih brief, langsung eksekusi (jangan tanya balik kalau tidak perlu)

Selalu tawarkan bantuan lanjutan di akhir respons.`;

// =========================================================
// MODEL LIST — Fallback priority (dari paling stabil)
// =========================================================
const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

export interface ChatMessage {
  role: "user" | "model" | "system";
  content: string;
}

// =========================================================
// RETRY LOGIC — Exponential backoff untuk 503/429
// =========================================================
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const isOverload =
        err?.message?.includes("503") ||
        err?.message?.includes("Service Unavailable");
      const isRateLimit =
        err?.message?.includes("429") ||
        err?.message?.includes("quota");

      if ((isOverload || isRateLimit) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.warn(
          `[Retry ${attempt}/${maxRetries}] ${isOverload ? "503 overload" : "429 quota"} — retry in ${delay}ms`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw err;
    }
  }
  throw lastErr;
}

// =========================================================
// MAIN FUNCTION — Generate chat response
// =========================================================
export async function generateChatResponse(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  let lastError: any = null;

  for (const modelName of MODELS) {
    try {
      console.log(`[Chat] Trying ${modelName}...`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        },
      });

      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const lastMessage = messages[messages.length - 1];

      const chat = model.startChat({
        history,
        systemInstruction: systemPrompt
          ? { role: "system", parts: [{ text: systemPrompt }] }
          : undefined,
      });

      const result = await callWithRetry(() =>
        chat.sendMessage(lastMessage.content)
      );
      const text = result.response.text();

      console.log(`[Chat Success] ${modelName}`);
      return text;
    } catch (err: any) {
      console.warn(
        `[Chat Failed] ${modelName}: ${err.message?.substring(0, 100)}`
      );
      lastError = err;

      if (err.message?.includes("API key not valid")) {
        throw new Error("API key tidak valid. Hubungi admin.");
      }

      continue;
    }
  }

  // All models failed — friendly error
  const errMsg = lastError?.message || "";
  if (errMsg.includes("503") || errMsg.includes("Service Unavailable")) {
    throw new Error(
      "Server AI sedang ramai. Mohon tunggu 1-2 menit lalu coba lagi."
    );
  }
  if (errMsg.includes("429") || errMsg.includes("quota")) {
    throw new Error(
      "Kuota AI habis untuk hari ini. Coba lagi besok atau upgrade plan."
    );
  }
  if (errMsg.includes("404") || errMsg.includes("not found")) {
    throw new Error("Model AI tidak tersedia. Tim sedang memperbaiki.");
  }

  throw new Error("AI tidak dapat merespons saat ini. Coba lagi sebentar.");
}