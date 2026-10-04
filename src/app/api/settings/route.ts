import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/custom-auth';

export const runtime = 'nodejs';

// ============================================================
// GET — ambil settings user yang sedang login (auto-create kalau belum ada)
// ============================================================
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[GET /api/settings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// PATCH — partial update
// ============================================================
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const allowed = [
      'theme',
      'fontSize',
      'compactMode',
      'particlesOn',
      'accentColor',
      'language',
      'timezone',
      'currency',
      'aiModel',
      'aiTemperature',
      'aiSystemPrompt',
      'autoSaveChat',
      'emailReminder',
      'browserNotify',
      'dailySummary',
      'summaryTime',
    ] as const;

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Validasi ringan
    if (data.aiTemperature !== undefined) {
      const t = Number(data.aiTemperature);
      if (!Number.isFinite(t) || t < 0 || t > 2) {
        return NextResponse.json(
          { error: 'aiTemperature must be between 0 and 2' },
          { status: 400 }
        );
      }
      data.aiTemperature = t;
    }

    if (data.accentColor !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(String(data.accentColor))) {
        return NextResponse.json(
          { error: 'accentColor must be hex format (#RRGGBB)' },
          { status: 400 }
        );
      }
    }

    if (data.fontSize !== undefined) {
      if (!['small', 'normal', 'large'].includes(String(data.fontSize))) {
        return NextResponse.json(
          { error: 'fontSize must be small | normal | large' },
          { status: 400 }
        );
      }
    }

    if (data.summaryTime !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(String(data.summaryTime))) {
        return NextResponse.json(
          { error: 'summaryTime must be HH:mm' },
          { status: 400 }
        );
      }
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });

    return NextResponse.json({ settings });
  } catch (err) {
    console.error('[PATCH /api/settings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}