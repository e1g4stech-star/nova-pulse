import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

// --- Helper AI Providers ---
async function askOpenRouter(prompt: string, history: any[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY kosong");

  const messages = history.map((m: any) => ({ role: m.role, content: m.content }));
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "qwen/qwen3.6-plus:free",
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function askGroq(prompt: string, history: any[]) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY kosong");

  const messages = history.map((m: any) => ({ role: m.role, content: m.content }));
  messages.push({ role: "user", content: prompt });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function askGemini(prompt: string, history: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY kosong");

  const contents = history.map((m: any) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));
  contents.push({ role: "user", parts: [{ text: prompt }] });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents, generationConfig: { temperature: 0.7 } }),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: "Pesan kosong" }, { status: 400 });

    // 1. Cek apakah chat ada di database
    const chat = await prisma.aIChat.findFirst({
      where: { id, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 10 } },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat tidak ditemukan di database. Silakan buat chat baru." }, { status: 404 });
    }

    // 2. Simpan pesan user
    await prisma.aIMessage.create({
      data: { chatId: id, role: "user", content: message },
    });

    // 3. Minta balasan AI (OpenRouter -> Groq -> Gemini)
    let reply = "";
    let provider = "";
    try {
      reply = await askOpenRouter(message, chat.messages);
      provider = "OpenRouter";
    } catch (e: any) {
      console.warn("[Chat] OpenRouter gagal, coba Groq...", e.message);
      try {
        reply = await askGroq(message, chat.messages);
        provider = "Groq";
      } catch (e2: any) {
        console.warn("[Chat] Groq gagal, coba Gemini...", e2.message);
        reply = await askGemini(message, chat.messages);
        provider = "Gemini";
      }
    }

    if (!reply) reply = "Maaf, semua server AI sedang sibuk. Coba lagi sebentar lagi.";

    // 4. Simpan balasan AI ke database
    const aiMsg = await prisma.aIMessage.create({
      data: { chatId: id, role: "assistant", content: reply },
    });

    console.log(`[Chat] Balasan berhasil dari: ${provider}`);
    return NextResponse.json({ success: true, message: aiMsg, provider });
  } catch (err: any) {
    console.error("[AI Chat POST] Error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}