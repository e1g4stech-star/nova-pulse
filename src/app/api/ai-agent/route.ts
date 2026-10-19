import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";
import { generateChatResponse, ChatMessage } from "@/lib/gemini-chat";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, history = [] } = body;

    // 1. Ambil data Posts, Transaksi, Media
    const posts = await prisma.post.findMany({ where: { userId: user.id }, take: 20, orderBy: { createdAt: "desc" } });
    const transactions = await prisma.transaction.findMany({ where: { userId: user.id }, take: 20, orderBy: { date: "desc" } });
    const media = await prisma.media.findMany({ where: { userId: user.id }, take: 10, orderBy: { createdAt: "desc" } });
    
    // 2. Ambil data Studio Konten (Ini yang tadi error)
    const studioCards = await prisma.studioCard.findMany({
      where: { userId: user.id },
      select: { title: true, stage: true, platforms: true, schedule: true }
    });
    const studioProfile = await prisma.studioProfile.findUnique({
      where: { userId: user.id },
      select: { brand: true, niche: true, pillars: true }
    });
    
    const events = await prisma.calendarEvent.findMany({ where: { userId: user.id }, take: 20, orderBy: { startDate: "asc" } });

    // 3. Susun Prompt
    const systemPrompt = `Kamu adalah AI Agent untuk Nova Pulse, asisten konten kreator.
    
Data Pengguna:
- Email: ${user.email}

Profil Merek (Studio Konten):
${studioProfile ? `Brand: ${studioProfile.brand}, Niche: ${studioProfile.niche}, Pilar: ${studioProfile.pillars}` : "Belum diisi"}

Data Studio Konten (Pipeline):
${studioCards.length > 0 
  ? studioCards.map(c => `- [${c.stage.toUpperCase()}] ${c.title} (Platform: ${c.platforms.join(", ")}, Jadwal: ${c.schedule || "Belum ada"})`).join("\n")
  : "Belum ada konten di Studio Konten."}

Data Posts (${posts.length}):
${posts.map(p => `- ${p.title} (${p.status})`).join("\n") || "Kosong"}

Data Transaksi:
${transactions.map(t => `- ${t.type} Rp ${t.amount}`).join("\n") || "Kosong"}

Jawab pertanyaan user dengan ramah, cerdas, dan berikan saran konkret berdasarkan data di atas.`;

    const chatHistory: ChatMessage[] = [
      { role: "user", content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: message }
    ];

    // 4. Generate respons AI
    let aiText = "";
    try {
      aiText = await generateChatResponse(chatHistory);
    } catch (err: any) {
      console.error("[AI Agent] Error:", err.message);
      return NextResponse.json({ error: "Gagal menghubungi AI: " + err.message }, { status: 503 });
    }

    return NextResponse.json({ success: true, reply: aiText });
  } catch (err: any) {
    console.error("[AI Agent POST] Error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}