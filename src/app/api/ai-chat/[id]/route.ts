import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";
import {
  generateChatResponse,
  NOVA_PULSE_SYSTEM_PROMPT,
  ChatMessage,
} from "@/lib/gemini-chat";

export const runtime = "nodejs";
export const maxDuration = 60;

// =========================================================
// GET — Ambil chat + semua messages
// =========================================================
export async function GET(req: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const chat = await prisma.aIChat.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: chat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// POST — Kirim message & dapat response AI (atomic transaction)
// =========================================================
export async function POST(req: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message kosong" }, { status: 400 });
    }

    // Verify chat exists & milik user
    const chat = await prisma.aIChat.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20,
        },
      },
    });

    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Build conversation history (JANGAN simpan user message dulu)
    const history: ChatMessage[] = chat.messages.map((m) => ({
      role: m.role as "user" | "model" | "system",
      content: m.content,
    }));
    history.push({ role: "user", content: message });

    // ⭐ GENERATE AI RESPONSE DULU — sebelum simpan ke DB
    let aiResponse: string;
    try {
      aiResponse = await generateChatResponse(history, NOVA_PULSE_SYSTEM_PROMPT);
    } catch (aiError: any) {
      console.error("[AI Chat] Generation failed:", aiError);

      // Return 503 untuk timeout/overload — JANGAN simpan user message
      const errMsg = aiError?.message || "AI tidak dapat merespons";
      const isTimeout =
        errMsg.includes("503") ||
        errMsg.includes("504") ||
        errMsg.includes("timeout") ||
        errMsg.includes("overload") ||
        errMsg.includes("ramai") ||
        errMsg.includes("Server AI");

      return NextResponse.json(
        {
          error: errMsg,
          isTimeout,
          hint: isTimeout
            ? "Google AI sedang ramai. Coba lagi 1-2 menit."
            : "Terjadi kesalahan. Coba lagi.",
        },
        { status: isTimeout ? 503 : 500 }
      );
    }

    // ⭐ SIMPAN user + AI message sebagai TRANSACTION — atomic
    const [userMessage, aiMessage] = await prisma.$transaction([
      prisma.aIMessage.create({
        data: { chatId: id, role: "user", content: message },
      }),
      prisma.aIMessage.create({
        data: { chatId: id, role: "model", content: aiResponse },
      }),
    ]);

    // Update chat title / updatedAt
    if (chat.title === "Chat Baru" && chat.messages.length === 0) {
      const newTitle =
        message.slice(0, 50) + (message.length > 50 ? "..." : "");
      await prisma.aIChat.update({
        where: { id },
        data: { title: newTitle, updatedAt: new Date() },
      });
    } else {
      await prisma.aIChat.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userMessage: {
          id: userMessage.id,
          role: "user",
          content: userMessage.content,
          createdAt: userMessage.createdAt,
        },
        aiMessage: {
          id: aiMessage.id,
          role: "model",
          content: aiMessage.content,
          createdAt: aiMessage.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error("[AI Chat POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE — Hapus chat
// =========================================================
export async function DELETE(req: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const chat = await prisma.aIChat.findUnique({ where: { id } });
    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.aIChat.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// PATCH — Update chat (pin/unpin, rename)
// =========================================================
export async function PATCH(req: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const chat = await prisma.aIChat.findUnique({ where: { id } });
    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Whitelist field yang boleh di-update
    const data: any = {};
    if (typeof body.isPinned === "boolean") data.isPinned = body.isPinned;
    if (typeof body.title === "string") data.title = body.title;

    const updated = await prisma.aIChat.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}