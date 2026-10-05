import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/custom-auth';

export const runtime = 'nodejs';

function generateSlug(length = 8): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < length; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const links = await prisma.affiliateLink.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ links });
  } catch (err) {
    console.error('[GET /api/affiliate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, affiliateUrl, description, category, commissionPct } = body;

    if (!title || !affiliateUrl) {
      return NextResponse.json({ error: 'Title dan URL wajib diisi' }, { status: 400 });
    }

    try {
      new URL(affiliateUrl);
    } catch {
      return NextResponse.json({ error: 'URL tidak valid' }, { status: 400 });
    }

    let slug = generateSlug();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.affiliateLink.findUnique({ where: { slug } });
      if (!exists) break;
      slug = generateSlug();
      attempts++;
    }

    const link = await prisma.affiliateLink.create({
      data: {
        userId: user.id,
        slug,
        title: String(title).trim(),
        affiliateUrl: String(affiliateUrl).trim(),
        description: description ? String(description).trim() : null,
        category: category ? String(category) : 'umum',
        commissionPct: Number(commissionPct) || 0,
      },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/affiliate]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}