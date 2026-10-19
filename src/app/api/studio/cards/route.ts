import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stage = req.nextUrl.searchParams.get("stage");
    const cards = await prisma.studioCard.findMany({
      where: { userId: user.id, ...(stage ? { stage } : {}) },
      orderBy: [{ schedule: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, cards });
  } catch (err) {
    console.error("[GET /api/studio/cards]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const card = await prisma.studioCard.create({
      data: {
        userId: user.id,
        title: body.title || "",
        stage: body.stage || "ide",
        platforms: body.platforms || ["tiktok", "instagram"],
        format: body.format || "short",
        pillar: body.pillar || "",
        hook: body.hook || "",
        script: body.script || [],
        captions: body.captions || {},
        tags: body.tags || {},
        ytTitle: body.ytTitle || "",
        ytDesc: body.ytDesc || "",
        cta: body.cta || "",
        schedule: body.schedule ? new Date(body.schedule) : null,
        checklist: body.checklist || [],
        perf: body.perf || { views: "", likes: "", comments: "", shares: "" },
        prompts: body.prompts || {},
        pOpt: body.pOpt || { lang: "en", style: "Sinematik realistis", voice: "Hangat dan santai" },
        example: body.example || false,
      },
    });

    return NextResponse.json({ success: true, card });
  } catch (err) {
    console.error("[POST /api/studio/cards]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}