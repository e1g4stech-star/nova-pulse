import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";

const DEFAULT_TIMES = {
  tiktok: "19:00",
  instagram: "12:00",
  facebook: "09:00",
  youtube: "17:00",
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let profile = await prisma.studioProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = await prisma.studioProfile.create({
        data: {
          userId: user.id,
          brand: "",
          niche: "",
          audience: "",
          voice: "Santai, ramah, langsung ke inti",
          pillars: "Tips, Review, Di balik layar",
          hashtags: "",
          cta: "",
          platforms: ["tiktok", "instagram"],
          times: DEFAULT_TIMES,
        },
      });
    }

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error("[GET /api/studio/profile]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const allowed = [
      "brand", "niche", "audience", "voice", "pillars",
      "hashtags", "cta", "platforms", "times",
    ];
    const data: Record<string, any> = {};
    for (const k of allowed) {
      if (body[k] !== undefined) data[k] = body[k];
    }

    const profile = await prisma.studioProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error("[PATCH /api/studio/profile]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}