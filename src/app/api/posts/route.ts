import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Ambil postingan MILIK USER YANG LOGIN
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const posts = await prisma.post.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error: any) {
    console.error("GET posts error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal ambil postingan" },
      { status: 500 }
    );
  }
}

// POST - Buat postingan baru untuk user yang login
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { platform, title, desc, status = "draft", hashtags = [] } = body;

    if (!title || !platform) {
      return NextResponse.json(
        { error: "Judul dan platform wajib diisi" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        userId: session.user.id,
        platform,
        title,
        desc: desc || "",
        status,
        hashtags,
      },
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error: any) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal simpan postingan" },
      { status: 500 }
    );
  }
}