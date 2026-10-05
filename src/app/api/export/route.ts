import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/custom-auth';

export const runtime = 'nodejs';

// Helper: safely query, return [] kalau error
async function safeQuery<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[export] Query failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const settings = await safeQuery(async () =>
      await prisma.userSettings.findMany({ where: { userId } })
    );

    const posts = await safeQuery(async () =>
      await prisma.post.findMany({ where: { userId } })
    );

    const notes = await safeQuery(async () =>
      await prisma.note.findMany({ where: { userId } })
    );

    const transactions = await safeQuery(async () =>
      await prisma.transaction.findMany({ where: { userId } })
    );

    const calendarEvents = await safeQuery(async () =>
      await prisma.calendarEvent.findMany({ where: { userId } })
    );

    const media = await safeQuery(async () =>
      await prisma.media.findMany({ where: { userId } })
    );

    const aiChats = await safeQuery(async () =>
      await prisma.aIChat.findMany({ where: { userId } })
    );

    const affiliateLinks = await safeQuery(async () =>
      await prisma.affiliateLink.findMany({ where: { userId } })
    );

    const affiliateClicks = await safeQuery(async () =>
      await prisma.affiliateClick.findMany({
        where: {
          link: { userId },
        },
        include: {
          link: {
            select: { id: true, slug: true, title: true },
          },
        },
      })
    );

    const socialConnections = await safeQuery(async () =>
      await prisma.socialConnection.findMany({ where: { userId } })
    );

    const exportData = {
      meta: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        app: 'Nova-Pulse',
        userId,
      },
      user: userData,
      settings,
      data: {
        posts,
        notes,
        transactions,
        calendarEvents,
        media,
        aiChats,
        affiliateLinks,
        affiliateClicks,
        socialConnections,
      },
      stats: {
        posts: posts.length,
        notes: notes.length,
        transactions: transactions.length,
        calendarEvents: calendarEvents.length,
        media: media.length,
        aiChats: aiChats.length,
        affiliateLinks: affiliateLinks.length,
        affiliateClicks: affiliateClicks.length,
        socialConnections: socialConnections.length,
      },
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `nova-pulse-backup-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/export]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Export failed' },
      { status: 500 }
    );
  }
}