import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

function pcmToWav(pcmBase64: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): string {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]).toString("base64");
}

async function generateGeminiTTS(text: string, voice: string, languageCode: string, apiKey: string) {
  const model = "gemini-2.5-flash-preview-tts";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const langName = languageCode === "su-ID" ? "Bahasa Sunda" : languageCode === "jv-ID" ? "Bahasa Jawa" : "Bahasa Indonesia";

  const payload = {
    contents: [{ parts: [{ text: `Bacakan narasi berikut dengan suara natural dan jelas dalam ${langName}:\n\n${text}` }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini TTS ${res.status}: ${err.slice(0, 400)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        audioBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "audio/wav",
      };
    }
  }

  throw new Error("Gemini TTS tidak mengembalikan audio.");
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { text, voice, languageCode } = (await req.json()) as { text: string; voice?: string; languageCode?: string };
    if (!text || text.trim().length === 0) return NextResponse.json({ error: "text wajib diisi" }, { status: 400 });
    if (text.length > 5000) return NextResponse.json({ error: "Text terlalu panjang (maks 5000)" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY tidak ada" }, { status: 500 });

    const voiceName = voice || "Kore";
    const lang = languageCode || "id-ID";
    const result = await generateGeminiTTS(text.trim(), voiceName, lang, apiKey);

    let finalBase64 = result.audioBase64;
    let finalMime = result.mimeType;

    if (finalMime.includes("L16") || finalMime.includes("pcm")) {
      finalBase64 = pcmToWav(result.audioBase64, 24000, 1, 16);
      finalMime = "audio/wav";
    }

    return NextResponse.json({
      success: true,
      audio: finalBase64,
      mimeType: finalMime,
      provider: "gemini",
      length: text.length,
    });
  } catch (err) {
    console.error("[POST /api/studio/tts]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "TTS error" }, { status: 500 });
  }
}