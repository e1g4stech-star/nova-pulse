import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYS = "Kamu adalah asisten AI yang membantu kreator konten. Ikuti instruksi user dengan tepat dan hasilkan output yang actionable.";

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

    const { nodes, edges } = await req.json();

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json({ error: "Format tidak valid" }, { status: 400 });
    }

    // 1. Cari node input, ai, dan output
    const inputNode = nodes.find((n: any) => n.data?.label === "Input Ide" || n.data?.label?.toLowerCase().includes("input"));
    const aiNode = nodes.find((n: any) => n.data?.label?.toLowerCase().includes("ai") || n.data?.label?.toLowerCase().includes("generate"));
    const outputNode = nodes.find((n: any) => n.data?.label?.toLowerCase().includes("output") || n.data?.label?.toLowerCase().includes("hasil"));

    if (!inputNode) {
      return NextResponse.json({ error: "Node 'Input Ide' tidak ditemukan." }, { status: 400 });
    }
    if (!aiNode) {
      return NextResponse.json({ error: "Node 'AI Generate' tidak ditemukan." }, { status: 400 });
    }

    const inputText = inputNode.data.text || "";
    const aiInstruction = aiNode.data.text || "Buat konten berdasarkan ide berikut:";

    if (!inputText.trim()) {
      return NextResponse.json({ error: "Node 'Input Ide' masih kosong. Klik node tersebut dan ketik ide konten." }, { status: 400 });
    }

    // 2. Gabungkan instruksi dan input
    const finalPrompt = `${aiInstruction}\n\nIDE KONTEN: ${inputText}`;

    // 3. Panggil AI (OpenRouter -> Groq -> Gemini)
    let result = "";
    let provider = "";

    try {
      result = await callOpenRouter(finalPrompt);
      provider = "OpenRouter";
    } catch (e: any) {
      console.warn("OpenRouter gagal:", e.message);
      try {
        result = await callGroq(finalPrompt);
        provider = "Groq";
      } catch (e2: any) {
        console.warn("Groq gagal:", e2.message);
        result = await callGemini(finalPrompt);
        provider = "Gemini";
      }
    }

    return NextResponse.json({ success: true, result, provider, outputNodeId: outputNode?.id });
  } catch (err: any) {
    console.error("[POST /api/studio/workflow/run]", err);
    return NextResponse.json({ error: err.message || "Gagal menjalankan workflow" }, { status: 500 });
  }
}