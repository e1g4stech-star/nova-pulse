import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GeneratedContent {
  hooks: string[];
  captions: string[];
  hashtags: string[];
  visualSuggestions: string[];
  readinessScore: number;
  bestPostingTime: string;
}

// =========================================================
// GENERATE TEXT (Caption, Hook, Hashtag)
// Prioritas: gemini-3.5-flash (terbukti stabil)
// =========================================================
const TEXT_MODELS = [
  "gemini-3.6-flash",           // Primary (verified works)
  "gemini-3.5-flash-lite",      // Fallback 1 (lite, fast)
  "gemini-flash-lite-latest",   // Fallback 2 (auto-latest lite)
  "gemini-3.5-flash",           // Fallback 3
  "gemini-3.7-flash",           // Fallback 4
  "gemini-3.8-flash",           // Fallback 5
];

export async function generateContent(idea: string): Promise<GeneratedContent> {
  const prompt = `Kamu adalah social media strategist profesional. Buat konten untuk ide berikut:

IDE: "${idea}"

Berikan output dalam format JSON SAJA:
{
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "captions": ["caption 1", "caption 2"],
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "visualSuggestions": ["visual 1", "visual 2"],
  "readinessScore": 85,
  "bestPostingTime": "20:00 WIB"
}

Ketentuan:
- hooks: 3 string, max 10 kata, bikin penasaran
- captions: 2 string, 2-3 kalimat, engaging, ada CTA
- hashtags: 5-8 tag relevan
- visualSuggestions: 2-3 saran (warna, mood, komposisi)
- readinessScore: 0-100
- bestPostingTime: jam terbaik

Bahasa Indonesia. Output JSON valid.`;

  let lastError: any = null;

  for (const modelName of TEXT_MODELS) {
    try {
      console.log(`\n[Text] Trying ${modelName}...`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      console.log(`[✓ Text Success] ${modelName}`);
      return parsed;
    } catch (err: any) {
      console.warn(`[✗ Text Failed] ${modelName}: ${err.message}`);
      lastError = err;

      // Kalau API key invalid, langsung stop
      if (err.message?.includes("API key not valid")) {
        throw err;
      }
      continue;
    }
  }

  throw new Error(
    `Semua text model gagal. Error terakhir: ${lastError?.message || "unknown"}`
  );
}

// =========================================================
// GENERATE IMAGE (Nano Banana)
// Prioritas: gemini-2.5-flash-image (stabil)
// =========================================================
const IMAGE_MODELS = [
  "gemini-2.5-flash-image",           // Nano Banana (stabil)
  "gemini-3.1-flash-image",           // Nano Banana 2
  "gemini-3.1-flash-image-preview",   // Nano Banana 2 Preview
  "gemini-3-pro-image",               // Nano Banana Pro (high quality)
  "gemini-3.1-flash-lite-image",      // Lite fallback
];

export async function generateImage(prompt: string): Promise<string> {
  let lastError: any = null;

  for (const modelName of IMAGE_MODELS) {
    try {
      console.log(`\n[Image] Trying ${modelName}...`);

      const model = genAI.getGenerativeModel({
        model: modelName,
      });

      const result = await model.generateContent(prompt);
      const response = result.response;

      // Extract image from response candidates
      const parts = response.candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData?.data) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          console.log(`[✓ Image Success] ${modelName}`);
          return `data:${mimeType};base64,${base64}`;
        }
      }

      throw new Error("No image data in response");
    } catch (err: any) {
      console.warn(`[✗ Image Failed] ${modelName}: ${err.message}`);
      lastError = err;

      if (err.message?.includes("API key not valid")) {
        throw err;
      }
      continue;
    }
  }

  throw new Error(
    `Semua image model gagal. Error terakhir: ${lastError?.message || "unknown"}`
  );
}