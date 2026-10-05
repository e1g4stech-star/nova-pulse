import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/custom-auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const userId = user.id;
    const contains = { contains: q, mode: 'insensitive' as const };

    // Parallel queries
    const [posts, notes, transactions, calendarEvents, affiliateLinks] = await Promise.all([
      prisma.post.findMany({
        where: {
          userId,
          OR: [{ title: contains }, { desc: contains }],
        },
        take: 5,
        select: { id: true, title: true, desc: true, platform: true, status: true },
      }).catch(() => []),

      prisma.note.findMany({
        where: {
          userId,
          OR: [{ title: contains }, { content: contains }],
        },
        take: 5,
        select: { id: true, title: true, content: true },
      }).catch(() => []),

      prisma.transaction.findMany({
        where: {
          userId,
          OR: [{ description: contains }, { category: contains }],
        },
        take: 5,
        select: { id: true, description: true, amount: true, category: true, type: true },
      }).catch(() => []),

      prisma.calendarEvent.findMany({
        where: {
          userId,
          OR: [{ title: contains }, { description: contains }],
        },
        take: 5,
        select: { id: true, title: true, description: true, startDate: true },
      }).catch(() => []),

      prisma.affiliateLink.findMany({
        where: {
          userId,
          OR: [{ title: contains }, { description: contains }, { category: contains }],
        },
        take: 5,
        select: { id: true, title: true, slug: true, clicks: true, category: true },
      }).catch(() => []),
    ]);

    const results = [
      ...posts.map((p) => ({
        id: p.id,
        type: 'post',
        title: p.title,
        subtitle: p.desc?.substring(0, 60) || p.platform || '',
        href: '/posts',
        meta: p.status,
      })),
      ...notes.map((n) => ({
        id: n.id,
        type: 'note',
        title: n.title,
        subtitle: n.content?.substring(0, 60) || '',
        href: '/dashboard',
        meta: 'catatan',
      })),
      ...transactions.map((t) => ({
        id: t.id,
        type: 'transaction',
        title: t.description || t.category,
        subtitle: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        href: '/finance',
        meta: 'Rp ' + (t.amount || 0).toLocaleString('id-ID'),
      })),
      ...calendarEvents.map((e) => ({
        id: e.id,
        type: 'event',
        title: e.title,
        subtitle: e.description?.substring(0, 60) || '',
        href: '/kalender',
        meta: new Date(e.startDate).toLocaleDateString('id-ID'),
      })),
      ...affiliateLinks.map((l) => ({
        id: l.id,
        type: 'affiliate',
        title: l.title,
        subtitle: '/r/' + l.slug,
        href: '/affiliate',
        meta: l.clicks + ' clicks',
      })),
    ];

    return NextResponse.json({ results, query: q });
  } catch (err) {
    console.error('[GET /api/search]', err);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}