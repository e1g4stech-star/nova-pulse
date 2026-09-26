import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Ambil semua postingan
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
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

// POST - Buat postingan baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, title, desc, status = "draft", hashtags = [] } = body;

    if (!title || !platform) {
      return NextResponse.json(
        { error: "Judul dan platform wajib diisi" },
        { status: 400 }
      );
    }

    // Untuk development, gunakan userId dummy dulu
    // Nanti setelah NextAuth, ini akan pakai session.user.id
    let userId = "cmuhtxewr0000jrngtjoiqfxx"; // ID Admin Nova dari Prisma Studio

    // Cek apakah user ada, kalau tidak buat baru
    const existingUser = await prisma.user.findFirst();
    
    if (!existingUser) {
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          email: "admin@novapulse.com",
          name: "Admin Nova",
        },
      });
      userId = newUser.id;
    } else {
      userId = existingUser.id;
    }

    const post = await prisma.post.create({
      data: {
        userId,
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
