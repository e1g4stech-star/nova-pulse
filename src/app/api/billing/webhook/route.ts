import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const runtime = "nodejs";

// Midtrans webhook payload
interface MidtransNotification {
  order_id: string;
  transaction_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  gross_amount: string;
  signature_key: string;
  status_code: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MidtransNotification;
    console.log("[webhook] Received:", JSON.stringify(body, null, 2));

    const {
      order_id,
      transaction_status,
      fraud_status,
      signature_key,
      status_code,
      gross_amount,
      payment_type,
    } = body;

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: "Server key not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      console.error("[webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Find subscription
    const subscription = await prisma.subscription.findUnique({
      where: { midtransOrderId: order_id },
      include: { user: true },
    });

    if (!subscription) {
      console.error("[webhook] Subscription not found:", order_id);
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Determine status
    let newStatus = subscription.status;
    let userPlan: string | null = null;

    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      if (fraud_status === "challenge" || fraud_status === "deny") {
        newStatus = "failed";
      } else {
        newStatus = "active";
        userPlan = subscription.plan;
      }
    } else if (transaction_status === "pending") {
      newStatus = "pending";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      newStatus = "failed";
    } else if (transaction_status === "refund" || transaction_status === "partial_refund") {
      newStatus = "refunded";
    }

    // Update subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: newStatus,
        paymentMethod: payment_type || null,
        paidAt: newStatus === "active" ? new Date() : null,
        metadata: JSON.stringify(body),
      },
    });

    // Update user plan if payment success
    if (userPlan) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: {
          plan: userPlan,
          planStartedAt: new Date(),
          planExpiresAt: subscription.expiresAt,
          planPrice: subscription.price,
        },
      });
      console.log(`[webhook] User ${subscription.user.email} upgraded to ${userPlan}`);
    }

    return NextResponse.json({
      success: true,
      order_id,
      status: newStatus,
      userPlan,
    });
  } catch (err) {
    console.error("[webhook]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}