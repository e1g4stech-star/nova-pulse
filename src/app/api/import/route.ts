import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/custom-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const userId = user.id;

    if (!body.meta || !body.meta.version) {
      return NextResponse.json(
        { error: 'Format backup tidak valid' },
        { status: 400 }
      );
    }

    const stats = {
      posts: 0,
      notes: 0,
      transactions: 0,
    };

    // Import posts
    if (Array.isArray(body.data?.posts)) {
      for (const p of body.data.posts) {
        try {
          await prisma.post.create({
            data: {
              userId,
              title: p.title || 'Untitled',
              desc: p.desc || '',
              platform: p.platform || 'other',
              status: p.status || 'draft',
              hashtags: p.hashtags || [],
              likes: p.likes || 0,
            },
          });
          stats.posts++;
        } catch (e) {
          console.error('Import post error:', e);
        }
      }
    }

    // Import notes
    if (Array.isArray(body.data?.notes)) {
      for (const n of body.data.notes) {
        try {
          await prisma.note.create({
            data: {
              userId,
              title: n.title || 'Untitled',
              content: n.content || '',
            },
          });
          stats.notes++;
        } catch (e) {
          console.error('Import note error:', e);
        }
      }
    }

    // Import transactions
    if (Array.isArray(body.data?.transactions)) {
      for (const t of body.data.transactions) {
        try {
          await prisma.transaction.create({
            data: {
              userId,
              amount: Number(t.amount) || 0,
              type: t.type || 'expense',
              category: t.category || 'other',
              note: t.description || '',
            },
          });
          stats.transactions++;
        } catch (e) {
          console.error('Import transaction error:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Import berhasil',
      stats,
    });
  } catch (err) {
    console.error('[POST /api/import]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    );
  }
}