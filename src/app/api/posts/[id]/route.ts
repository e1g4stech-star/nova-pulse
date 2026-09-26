import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH - Update postingan (hanya milik user)
export async function PATCH(req: NextRequest, context: any) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    // Cek dulu apakah postingan milik user
    const existing = await prisma.post.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Postingan tidak ditemukan" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: post });
  } catch (error: any) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Hapus postingan (hanya milik user)
export async function DELETE(req: NextRequest, context: any) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Cek dulu apakah postingan milik user
    const existing = await prisma.post.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Postingan tidak ditemukan" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}