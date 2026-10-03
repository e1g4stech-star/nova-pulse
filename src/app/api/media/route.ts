import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";
import { uploadFile, detectFileType } from "@/lib/blob";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: any = { userId: user.id };
    if (type && type !== "all") where.fileType = type;

    const media = await prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: media });
  } catch (error: any) {
    console.error("GET media error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File maksimal 50 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(buffer, file.name, file.type);

    const media = await prisma.media.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileUrl: result.url,
        fileKey: result.key,
        fileType: detectFileType(file.type),
        mimeType: file.type,
        fileSize: file.size,
      },
    });

    return NextResponse.json({ success: true, data: media }, { status: 201 });
  } catch (error: any) {
    console.error("POST media error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}