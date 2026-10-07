import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
];

export interface ChatMessage {
  role: "user" | "model" | "system";
  content: string;
}

export async function generateChatResponse(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  let lastError: any = null;

  for (const modelName of MODELS) {
    try {
      console.log(`\n[Chat] Trying ${modelName}...`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        },
      });

      // Convert messages to Gemini format
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

      const result = await chat.sendMessage(lastMessage.content);
      const text = result.response.text();

      console.log(`[✓ Chat Success] ${modelName}`);
      return text;
    } catch (err: any) {
      console.warn(`[✗ Chat Failed] ${modelName}: ${err.message}`);
      lastError = err;

      if (err.message?.includes("API key not valid")) {
        throw err;
      }
      continue;
    }
  }

  throw new Error(
    `Semua model gagal. Error: ${lastError?.message || "unknown"}`
  );
}

// System prompt untuk Nova Pulse AI
export const NOVA_PULSE_SYSTEM_PROMPT = `Kamu adalah Nova Pulse AI, asisten cerdas untuk content creator dan digital marketer di Indonesia.

Keahlian kamu:
- Copywriting untuk media sosial (Instagram, TikTok, YouTube, Facebook, Pinterest)
- Strategi konten viral
- Analisa engagement
- Ide konten kreatif
- Hashtag research
- Jadwal posting optimal

Gaya komunikasi:
- Ramah, profesional, dan to the point
- Gunakan bahasa Indonesia yang natural
- Berikan contoh konkret, bukan teori saja
- Kalau bisa, sertakan format yang mudah dibaca (bullet, bold, dll)

Selalu fokus membantu user mencapai goals mereka.`;