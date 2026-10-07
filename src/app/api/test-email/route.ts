import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCurrentUser } from "@/lib/custom-auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const fromName = process.env.RESEND_FROM_NAME || "Nova-Pulse";

    if (!apiKey) {
      return NextResponse.json({ error: "RESEND_API_KEY tidak ada" }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0e1a;padding:40px 20px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:30px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#5ee7ff,#a855f7);padding:15px 30px;border-radius:10px;">
            <h1 style="color:white;margin:0;font-size:24px;">🚀 Nova-Pulse</h1>
          </div>
        </div>
        <h2 style="color:#5ee7ff;margin:0 0 20px;">✅ Email Reminder Aktif!</h2>
        <p style="color:#e2e8f0;line-height:1.6;">
          Halo <strong>${user.name || user.email}</strong>,
        </p>
        <p style="color:#e2e8f0;line-height:1.6;">
          Ini email test untuk memastikan reminder kamu berjalan dengan baik.
        </p>
        <p style="color:#e2e8f0;line-height:1.6;">
          Setiap hari, kamu akan menerima email berisi:
        </p>
        <ul style="color:#e2e8f0;line-height:1.8;">
          <li>📅 Konten yang harus diposting hari ini</li>
          <li>📆 Preview konten besok</li>
          <li>📝 Jumlah draft yang menunggu</li>
          <li>💰 Statistik affiliate</li>
        </ul>
        <div style="text-align:center;margin-top:30px;">
          <a href="http://localhost:3000/dashboard" style="display:inline-block;background:linear-gradient(135deg,#5ee7ff,#a855f7);color:white;text-decoration:none;padding:12px 30px;border-radius:8px;font-weight:bold;">
            Buka Nova-Pulse →
          </a>
        </div>
        <p style="color:#64748b;font-size:12px;text-align:center;margin-top:30px;">
          Email ini dikirim otomatis oleh Nova-Pulse.
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: user.email,
      subject: "✅ Test Email - Nova-Pulse Reminder",
      html,
    });

    return NextResponse.json({
      success: true,
      message: "Email test terkirim!",
      emailId: result.data?.id,
      sentTo: user.email,
    });
  } catch (err) {
    console.error("[test-email]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal kirim email" },
      { status: 500 }
    );
  }
}