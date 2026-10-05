import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/custom-auth';

export const runtime = 'nodejs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.affiliateLink.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data: any = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.affiliateUrl !== undefined) data.affiliateUrl = String(body.affiliateUrl).trim();
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.category !== undefined) data.category = String(body.category);
    if (body.commissionPct !== undefined) data.commissionPct = Number(body.commissionPct) || 0;
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const link = await prisma.affiliateLink.update({ where: { id }, data });
    return NextResponse.json({ link });
  } catch (err) {
    console.error('[PATCH /api/affiliate/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.affiliateLink.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.affiliateLink.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/affiliate/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}