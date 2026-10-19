import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYS = "Kamu produser konten media sosial berbahasa Indonesia yang berpengalaman. Tulis natural dan spesifik. Jangan membuat klaim hasil yang dijanjikan, statistik karangan, atau testimoni palsu.";

async function callOpenRouter(prompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY tidak ada");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "qwen/qwen3.6-plus:free",
      messages: [
        { role: "system", content: SYS },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter kosong");
  return JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim());
}

async function callGroq(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY tidak ada");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: SYS },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq kosong");
  return JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim());
}

async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY tidak ada");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: SYS + "\n\n" + prompt }] }],
      generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) throw new Error(`Gemini Error: ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini kosong");
  return JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim());
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "prompt wajib" }, { status: 400 });

    let result;
    let successProvider = "";

    try {
      result = await callOpenRouter(prompt);
      successProvider = "OpenRouter";
    } catch (e: any) {
      console.warn("OpenRouter gagal:", e.message);
      try {
        result = await callGroq(prompt);
        successProvider = "Groq";
      } catch (e: any) {
        console.warn("Groq gagal:", e.message);
        result = await callGemini(prompt);
        successProvider = "Gemini";
      }
    }

    console.log(`âœ… Berhasil di-generate menggunakan: ${successProvider}`);
    return NextResponse.json({ success: true, result, provider: successProvider });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Semua AI sedang sibuk / gagal." }, { status: 500 });
  }
}