import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";
import { deleteFile } from "@/lib/blob";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, context: any) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const media = await prisma.media.findUnique({ where: { id } });

    if (!media) {
      return NextResponse.json({ error: "Media tidak ditemukan" }, { status: 404 });
    }

    if (media.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      await deleteFile(media.fileUrl);
    } catch (err) {
      console.warn("Blob delete failed:", err);
    }

    await prisma.media.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE media error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}