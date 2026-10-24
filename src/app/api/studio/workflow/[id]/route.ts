import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.aiWorkflow.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.aiWorkflow.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/studio/workflow/:id]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}