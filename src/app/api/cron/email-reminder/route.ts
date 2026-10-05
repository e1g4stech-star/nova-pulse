import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { renderReminderEmail } from '@/lib/email/reminder-template';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = req.nextUrl.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    const authorized =
      authHeader === 'Bearer ' + cronSecret ||
      secret === cronSecret ||
      process.env.NODE_ENV === 'development';

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.RESEND_FROM_NAME || 'Nova-Pulse';

    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY tidak ada' }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    const targetHour = req.nextUrl.searchParams.get('hour');
    const now = new Date();
    const currentHour = targetHour
      ? String(parseInt(targetHour)).padStart(2, '0') + ':00'
      : String(now.getHours()).padStart(2, '0') + ':00';

    const users = await prisma.userSettings.findMany({
      where: {
        emailReminder: true,
        summaryTime: currentHour,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada user di jam ini',
        currentHour,
        sent: 0,
      });
    }

    const results = [];

    for (const settings of users) {
      const user = settings.user;
      if (!user.email) continue;

      const userId = user.id;

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const tomorrowStart = new Date(todayEnd);
      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

      const [todayEvents, tomorrowEvents, draftCount, affiliateLinks] = await Promise.all([
        prisma.calendarEvent.findMany({
          where: { userId, startDate: { gte: todayStart, lt: todayEnd } },
          orderBy: { startDate: 'asc' },
          take: 10,
        }),
        prisma.calendarEvent.findMany({
          where: { userId, startDate: { gte: tomorrowStart, lt: tomorrowEnd } },
          orderBy: { startDate: 'asc' },
          take: 10,
        }),
        prisma.post.count({ where: { userId, status: 'draft' } }),
        prisma.affiliateLink.findMany({
          where: { userId },
          select: { clicks: true, earnings: true },
        }),
      ]);

      const totalClicks = affiliateLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
      const totalEarnings = affiliateLinks.reduce((sum, l) => sum + (l.earnings || 0), 0);

      const html = renderReminderEmail({
        userName: user.name || user.email.split('@')[0],
        todayEvents: todayEvents.map((e) => ({
          title: e.title,
          time: new Date(e.startDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          platform: e.platform || undefined,
        })),
        tomorrowEvents: tomorrowEvents.map((e) => ({
          title: e.title,
          time: new Date(e.startDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          platform: e.platform || undefined,
        })),
        draftPosts: draftCount,
        affiliateClicks: totalClicks,
        affiliateEarnings: totalEarnings,
      });

      try {
        const sendResult = await resend.emails.send({
          from: fromName + ' <' + fromEmail + '>',
          to: user.email,
          subject: '📅 ' + todayEvents.length + ' konten hari ini — Nova-Pulse Reminder',
          html,
        });

        results.push({ email: user.email, id: sendResult.data?.id, status: 'sent' });
      } catch (sendErr) {
        console.error('[cron] Failed to ' + user.email + ':', sendErr);
        results.push({
          email: user.email,
          status: 'failed',
          error: sendErr instanceof Error ? sendErr.message : 'unknown',
        });
      }
    }

    return NextResponse.json({
      success: true,
      currentHour,
      total: results.length,
      sent: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    });
  } catch (err) {
    console.error('[cron/email-reminder]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}