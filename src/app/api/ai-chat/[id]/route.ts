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

// GET - Ambil chat + semua messages
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

// POST - Kirim message baru & dapat response AI
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
          take: 20, // Ambil 20 message terakhir untuk context
        },
      },
    });

    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Simpan user message
    await prisma.aIMessage.create({
      data: {
        chatId: id,
        role: "user",
        content: message,
      },
    });

    // Build conversation history
    const history: ChatMessage[] = chat.messages.map((m) => ({
      role: m.role as "user" | "model" | "system",
      content: m.content,
    }));
    history.push({ role: "user", content: message });

    // Generate AI response
    const aiResponse = await generateChatResponse(
      history,
      NOVA_PULSE_SYSTEM_PROMPT
    );

    // Simpan AI response
    const aiMessage = await prisma.aIMessage.create({
      data: {
        chatId: id,
        role: "model",
        content: aiResponse,
      },
    });

    // Auto-update chat title kalau masih "Chat Baru"
    if (chat.title === "Chat Baru" && chat.messages.length === 0) {
      const newTitle = message.slice(0, 50) + (message.length > 50 ? "..." : "");
      await prisma.aIChat.update({
        where: { id },
        data: { title: newTitle },
      });
    } else {
      // Touch updatedAt
      await prisma.aIChat.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        userMessage: { role: "user", content: message },
        aiMessage: {
          id: aiMessage.id,
          role: "model",
          content: aiResponse,
          createdAt: aiMessage.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Hapus chat
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

// PATCH - Update chat (pin/unpin, rename)
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

    const updated = await prisma.aIChat.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}