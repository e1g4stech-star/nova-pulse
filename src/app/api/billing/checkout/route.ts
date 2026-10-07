import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";
import { PLANS, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
        const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists in DB (FK safety)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });
    if (!dbUser) {
      return NextResponse.json(
        { error: "Session invalid. Logout & login ulang." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { plan, cycle } = body as { plan: PlanId; cycle: "monthly" | "yearly" };

    if (!plan || !["pro", "business"].includes(plan)) {
      return NextResponse.json({ error: "Plan tidak valid" }, { status: 400 });
    }
    if (!cycle || !["monthly", "yearly"].includes(cycle)) {
      return NextResponse.json({ error: "Cycle tidak valid" }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    const price = cycle === "monthly" ? planConfig.price : planConfig.priceYearly;
    if (price <= 0) {
      return NextResponse.json({ error: "Plan gratis tidak perlu checkout" }, { status: 400 });
    }

    const orderId = `NOVA-${user.id.substring(0, 8)}-${Date.now()}`;

    const expiresAt = new Date();
    if (cycle === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1);
    else expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: planConfig.id,
        status: "pending",
        price,
        currency: "IDR",
        expiresAt,
        midtransOrderId: orderId,
      },
    });

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const snapUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    if (!serverKey) {
      return NextResponse.json({ error: "MIDTRANS_SERVER_KEY tidak ada" }, { status: 500 });
    }

    const auth = Buffer.from(serverKey + ":").toString("base64");

    const snapPayload = {
      transaction_details: { order_id: orderId, gross_amount: price },
      item_details: [{
        id: planConfig.id,
        price,
        quantity: 1,
        name: `Nova Pulse ${planConfig.name} - ${cycle === "monthly" ? "Bulanan" : "Tahunan"}`,
      }],
      customer_details: {
        first_name: user.name || user.email.split("@")[0],
        email: user.email,
      },
      callbacks: {
        finish: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/billing/success?order_id=${orderId}`,
        error: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/billing?status=error`,
        pending: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/billing?status=pending`,
      },
    };

    const snapRes = await fetch(snapUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(snapPayload),
    });

    if (!snapRes.ok) {
      const errText = await snapRes.text();
      console.error("[billing/checkout] Snap error:", errText);
      return NextResponse.json(
        { error: "Gagal buat transaksi Midtrans", detail: errText },
        { status: 500 }
      );
    }

    const snapData = await snapRes.json();

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { midtransToken: snapData.token },
    });

    return NextResponse.json({
      success: true,
      orderId,
      snapToken: snapData.token,
      redirectUrl: snapData.redirect_url,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error("[billing/checkout]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}