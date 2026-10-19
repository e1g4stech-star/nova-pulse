import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const card = await prisma.studioCard.findFirst({
      where: { id, userId: user.id },
    });

    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, card });
  } catch (err) {
    console.error("[GET /api/studio/cards/:id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const allowed = [
      "title", "stage", "platforms", "format", "pillar", "hook",
      "script", "captions", "tags", "ytTitle", "ytDesc", "cta",
      "schedule", "checklist", "perf", "prompts", "pOpt", "example",
    ];
    const data: Record<string, any> = {};
    for (const k of allowed) {
      if (body[k] !== undefined) {
        data[k] = k === "schedule" && body[k] ? new Date(body[k]) : body[k];
      }
    }

    const existing = await prisma.studioCard.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const card = await prisma.studioCard.update({ where: { id }, data });
    return NextResponse.json({ success: true, card });
  } catch (err) {
    console.error("[PATCH /api/studio/cards/:id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.studioCard.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.studioCard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/studio/cards/:id]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}