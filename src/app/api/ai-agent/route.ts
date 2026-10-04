import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/custom-auth";
import { generateChatResponse, ChatMessage } from "@/lib/gemini-chat";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST - AI Agent actions
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "analyze") {
      return handleAnalyze(user.id);
    }

    if (action === "generate") {
      return handleGenerate(user.id, body.count || 5);
    }

    if (action === "remind") {
      return handleRemind(user.id);
    }

    if (action === "strategy") {
      return handleStrategy(user.id);
    }

    if (action === "chat") {
      return handleChat(user.id, body.message, body.history || []);
    }

    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  } catch (error: any) {
    console.error("AI Agent error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// ANALYZE — Baca data user & kasih insight
// =========================================================
async function handleAnalyze(userId: string) {
  const [posts, transactions, events, media] = await Promise.all([
    prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 30,
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
    prisma.media.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === "published").length;
  const draftPosts = posts.filter((p) => p.status === "draft").length;
  const scheduledPosts = posts.filter((p) => p.status === "scheduled").length;

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  // Compose data summary untuk AI
  const dataSummary = `
Data user saat ini:
- Total Postingan: ${totalPosts}
- Published: ${publishedPosts}
- Draft: ${draftPosts}
- Scheduled: ${scheduledPosts}

Keuangan:
- Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}
- Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}
- Saldo: Rp ${(totalIncome - totalExpense).toLocaleString("id-ID")}

Jadwal Mendatang: ${events.length} event
${events.slice(0, 5).map((e) => `- ${new Date(e.startDate).toLocaleDateString("id-ID")}: ${e.title}`).join("\n")}

Media Terbaru: ${media.length} file
Platform yang dipakai: ${[...new Set(posts.map((p) => p.platform))].join(", ") || "belum ada"}
`;

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: `Analisa data berikut dan berikan 5 insight cerdas + 3 rekomendasi konkret:

${dataSummary}

Format output:
## 📊 Insight
1-5 poin analisis

## 🎯 Rekomendasi
3 langkah actionable

Bahasa Indonesia, singkat, to the point.`,
    },
  ];

  const analysis = await generateChatResponse(
    messages,
    "Kamu adalah business analyst ahli untuk content creator. Berikan analisis berbasis data yang actionable."
  );

  return NextResponse.json({
    success: true,
    data: {
      analysis,
      stats: {
        totalPosts,
        publishedPosts,
        draftPosts,
        scheduledPosts,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        upcomingEvents: events.length,
        mediaCount: media.length,
      },
    },
  });
}

// =========================================================
// GENERATE — Buat N ide konten dari data user
// =========================================================
async function handleGenerate(userId: string, count: number) {
  const posts = await prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const platforms = [...new Set(posts.map((p) => p.platform))];

  const prompt = `Kamu adalah content strategist. Berdasarkan data user:
- Postingan terakhir: ${posts.map((p) => p.title).slice(0, 5).join(" | ") || "belum ada"}
- Platform yang dipakai: ${platforms.join(", ") || "belum ada"}

Buat ${count} ide konten BARU yang:
1. Relevan dengan niche user
2. Potensi viral tinggi
3. Format actionable (hook + body + CTA)

Output format JSON:
{
  "ideas": [
    {
      "title": "Judul konten",
      "platform": "instagram/tiktok/youtube",
      "hook": "Hook 3 detik pertama",
      "format": "reel/video/carousel/story",
      "why": "Kenapa ide ini bagus",
      "bestTime": "jam optimal posting"
    }
  ]
}

Bahasa Indonesia. Output JSON valid saja.`;

  const response = await generateChatResponse(
    [{ role: "user", content: prompt }],
    "Kamu adalah content strategist ahli. Selalu output JSON valid."
  );

  // Parse JSON
  let ideas: any[] = [];
  try {
    const cleaned = response.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    ideas = parsed.ideas || [];
  } catch (err) {
    console.error("JSON parse error:", err);
    // Fallback: return raw response
    return NextResponse.json({
      success: true,
      data: { ideas: [], raw: response },
    });
  }

  return NextResponse.json({
    success: true,
    data: { ideas },
  });
}

// =========================================================
// REMIND — Reminder jadwal hari ini
// =========================================================
async function handleRemind(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEvents = await prisma.calendarEvent.findMany({
    where: {
      userId,
      startDate: {
        gte: today,
        lt: tomorrow,
      },
    },
    orderBy: { startDate: "asc" },
  });

  const upcomingScheduled = await prisma.post.findMany({
    where: {
      userId,
      status: "scheduled",
    },
    take: 5,
  });

  const reminders: string[] = [];

  if (todayEvents.length > 0) {
    reminders.push(`📅 **${todayEvents.length} event hari ini:**`);
    todayEvents.forEach((e) => {
      const time = new Date(e.startDate).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      reminders.push(`  • ${time} — ${e.title}`);
    });
  } else {
    reminders.push("📅 Tidak ada event hari ini");
  }

  if (upcomingScheduled.length > 0) {
    reminders.push("");
    reminders.push(`📝 **${upcomingScheduled.length} post terjadwal:**`);
    upcomingScheduled.forEach((p) => {
      reminders.push(`  • ${p.title} (${p.platform})`);
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      reminders,
      todayEvents,
      scheduledPosts: upcomingScheduled,
    },
  });
}

// =========================================================
// STRATEGY — Rekomendasi strategi konten
// =========================================================
async function handleStrategy(userId: string) {
  const posts = await prisma.post.findMany({
    where: { userId, status: "published" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const events = await prisma.calendarEvent.findMany({
    where: { userId, startDate: { gte: new Date() } },
    take: 5,
  });

  const prompt = `Sebagai strategist konten profesional, buat STRATEGI KONTEN 7 HARI ke depan untuk user ini:

Konteks:
- Postingan terakhir: ${posts.map((p) => p.title).slice(0, 5).join(", ") || "belum ada"}
- Jumlah post published: ${posts.length}
- Event mendatang: ${events.map((e) => e.title).join(", ") || "belum ada"}

Buat strategi dalam format:
## 🎯 Tema Minggu Ini
(1 tema utama)

## 📅 Jadwal Konten Harian
- Senin: [jenis konten + platform + waktu]
- Selasa: ...
- dst (7 hari)

## 💡 Tips Engagement
3 tips konkret

## 📊 Target Metrics
- Target reach, engagement, followers

Bahasa Indonesia. Singkat & actionable.`;

  const strategy = await generateChatResponse(
    [{ role: "user", content: prompt }],
    "Kamu adalah content strategist senior. Buat strategi konkret, bukan teori."
  );

  return NextResponse.json({
    success: true,
    data: { strategy },
  });
}

// =========================================================
// CHAT — Custom chat dengan konteks data user
// =========================================================
async function handleChat(userId: string, message: string, history: any[]) {
  // Ambil snapshot data user sebagai konteks
  const postCount = await prisma.post.count({ where: { userId } });
  const eventCount = await prisma.calendarEvent.count({
    where: { userId, startDate: { gte: new Date() } },
  });

  const context = `
Konteks user:
- Total postingan: ${postCount}
- Event mendatang: ${eventCount}
`;

  const messages: ChatMessage[] = [
    ...history.map((h: any) => ({
      role: h.role as "user" | "model",
      content: h.content,
    })),
    { role: "user", content: `${context}\n\nPertanyaan: ${message}` },
  ];

  const response = await generateChatResponse(
    messages,
    "Kamu adalah AI Agent Nova Pulse. Bantu user dengan saran berbasis data mereka."
  );

  return NextResponse.json({
    success: true,
    data: { response },
  });
}