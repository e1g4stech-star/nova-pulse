import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const link = await prisma.affiliateLink.findUnique({ where: { slug: code } });

    if (!link || !link.isActive) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    try {
      const ipAddress =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        null;

      await Promise.all([
        prisma.affiliateClick.create({
          data: {
            linkId: link.id,
            ipAddress,
            userAgent: req.headers.get('user-agent') || null,
            referer: req.headers.get('referer') || null,
          },
        }),
        prisma.affiliateLink.update({
          where: { id: link.id },
          data: { clicks: { increment: 1 } },
        }),
      ]);
    } catch (e) {
      console.warn('[track click]', e);
    }

    return NextResponse.redirect(link.affiliateUrl);
  } catch (err) {
    console.error('[GET /r/:code]', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}