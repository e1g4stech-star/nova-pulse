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

    const link = await prisma.affiliateLink.findFirst({
      where: { id, userId: user.id },
    });
    if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const clicks = await prisma.affiliateClick.findMany({
      where: { linkId: id },
      orderBy: { clickedAt: "desc" },
      take: 100,
    });

    const totalClicks = clicks.length;
    const totalConversions = clicks.filter((c) => c.converted).length;
    const totalEarnings = clicks
      .filter((c) => c.converted)
      .reduce((sum, c) => sum + (c.conversionValue || 0), 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return NextResponse.json({
      link,
      stats: { totalClicks, totalConversions, totalEarnings, conversionRate },
      recentClicks: clicks.slice(0, 20),
    });
  } catch (err) {
    console.error("[GET stats]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}