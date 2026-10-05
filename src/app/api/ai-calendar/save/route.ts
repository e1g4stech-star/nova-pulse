import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/custom-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { plan, startDate, platform } = body;

    if (!Array.isArray(plan) || plan.length === 0) {
      return NextResponse.json({ error: 'Plan kosong' }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(9, 0, 0, 0);

    let created = 0;
    const errors: string[] = [];

    for (const item of plan) {
      try {
        const eventDate = new Date(start);
        eventDate.setDate(start.getDate() + (item.day - 1));

        await prisma.calendarEvent.create({
          data: {
            userId: user.id,
            title: String(item.title).substring(0, 200),
            description: [
              item.description,
              item.hashtags && item.hashtags.length > 0
                ? '\n\n#' + item.hashtags.join(' #')
                : '',
            ].join(''),
            startDate: eventDate,
            allDay: true,
            color: 'purple',
            category: item.contentType || 'konten',
            platform: platform || null,
          },
        });
        created++;
      } catch (err) {
        console.error('[save] Failed for item:', item.title, err);
        errors.push(item.title);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      failed: errors.length,
      errors: errors.slice(0, 5),
    });
  } catch (err) {
    console.error('[POST /api/ai-calendar/save]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}