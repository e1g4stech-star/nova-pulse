import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYS = "Kamu adalah ahli strategi konten media sosial. Berikan output yang actionable, kreatif, dan dalam Bahasa Indonesia.";

async function callOpenRouter(prompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY kosong");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "qwen/qwen3.6-plus:free",
      messages: [{ role: "system", content: SYS }, { role: "user", content: prompt }],
      temperature: 0.8,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGroq(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY kosong");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "system", content: SYS }, { role: "user", content: prompt }],
      temperature: 0.8,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY kosong");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: SYS + "\n\n" + prompt }] }],
      generationConfig: { temperature: 0.8 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt wajib diisi" }, { status: 400 });

    let result = "";
    let provider = "";
    try {
      result = await callOpenRouter(prompt);
      provider = "OpenRouter";
    } catch (e: any) {
      console.warn("OpenRouter gagal:", e.message);
      try {
        result = await callGroq(prompt);
        provider = "Groq";
      } catch (e2: any) {
        console.warn("Groq gagal:", e2.message);
        result = await callGemini(prompt);
        provider = "Gemini";
      }
    }
    return NextResponse.json({ success: true, result, provider });
  } catch (err: any) {
    console.error("[POST /api/ai-studio]", err);
    return NextResponse.json({ error: err.message || "Semua AI gagal" }, { status: 500 });
  }
}