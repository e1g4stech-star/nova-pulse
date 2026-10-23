import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workflows = await prisma.aiWorkflow.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, workflows });
  } catch (err: any) {
    console.error("[GET /api/studio/workflow] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, nodes, edges } = body;

    // Validasi input
    if (!Array.isArray(nodes)) {
      return NextResponse.json({ error: "Field nodes harus berupa array" }, { status: 400 });
    }
    if (!Array.isArray(edges)) {
      return NextResponse.json({ error: "Field edges harus berupa array" }, { status: 400 });
    }

    // Simpan ke database dengan format JSON yang benar
    const workflow = await prisma.aiWorkflow.create({
      data: {
        userId: user.id,
        name: name || "Workflow Baru",
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
    });

    console.log("[Workflow POST] Saved successfully:", workflow.id);
    return NextResponse.json({ success: true, workflow });
  } catch (err: any) {
    console.error("[POST /api/studio/workflow] Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menyimpan workflow ke database" },
      { status: 500 }
    );
  }
}