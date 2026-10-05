import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/custom-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Model yang tersedia untuk API key kita (berdasarkan list)
const MODEL_FALLBACKS = [
  'gemini-3.5-flash',       // paling baru stabil
  'gemini-2.5-flash',       // stabil + cepat
  'gemini-3.5-flash-lite',  // versi ringan
  'gemini-flash-latest',    // auto-latest
];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { niche, platform, tone, days = 30 } = body;

    if (!niche || !platform) {
      return NextResponse.json({ error: 'Niche dan platform wajib diisi' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY tidak ada' }, { status: 500 });
    }

    const prompt = `Kamu adalah content strategist expert. Buatkan plan konten ${days} hari untuk:

- Niche: ${niche}
- Platform: ${platform}
- Tone: ${tone || 'edukatif'}

Format WAJIB: JSON array of objects dengan struktur PERSIS:
[
  {
    "day": 1,
    "title": "Judul konten max 60 karakter",
    "description": "Deskripsi 1-2 kalimat actionable",
    "contentType": "carousel",
    "hashtags": ["tag1", "tag2", "tag3"]
  }
]

Ketentuan:
- Total ${days} items
- Variasi contentType (carousel, reels, story, post, video, tutorial)
- Setiap ide unik dan actionable
- HANYA return JSON array, TANPA teks lain, TANPA markdown, TANPA backtick

Output harus valid JSON yang bisa langsung di-JSON.parse()`;

    let lastError = '';
    let text = '';
    let usedModel = '';

    // Coba setiap model fallback
    for (const modelName of MODEL_FALLBACKS) {
      try {
        console.log(`[ai-calendar] Trying model: ${modelName}`);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          lastError = `${modelName} (${res.status}): ${errText.substring(0, 150)}`;
          console.warn(`[ai-calendar] ${modelName} failed:`, res.status);
          continue;
        }

        const data = await res.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (candidateText) {
          text = candidateText;
          usedModel = modelName;
          console.log(`[ai-calendar] ✅ Success with: ${modelName}`);
          break;
        }
      } catch (e) {
        lastError = `${modelName}: ${e instanceof Error ? e.message : 'unknown'}`;
        console.error(`[ai-calendar] ${modelName} exception:`, e);
        continue;
      }
    }

    if (!text) {
      return NextResponse.json(
        { error: 'Semua model gagal. Terakhir: ' + lastError },
        { status: 500 }
      );
    }

    // Bersihkan markdown
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    // Cari array JSON
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) cleaned = arrayMatch[0];

    let plan;
    try {
      plan = JSON.parse(cleaned);
    } catch (e) {
      console.error('[ai-calendar] Parse error:', cleaned.substring(0, 500));
      return NextResponse.json(
        { error: 'Format AI tidak valid', raw: cleaned.substring(0, 500) },
        { status: 500 }
      );
    }

    if (!Array.isArray(plan)) {
      return NextResponse.json({ error: 'AI tidak return array' }, { status: 500 });
    }

    const normalized = plan.slice(0, days).map((item: any, idx: number) => ({
      day: idx + 1,
      title: String(item.title || `Konten hari ${idx + 1}`).substring(0, 100),
      description: String(item.description || '').substring(0, 300),
      contentType: String(item.contentType || 'post'),
      hashtags: Array.isArray(item.hashtags) ? item.hashtags.slice(0, 5).map(String) : [],
    }));

    return NextResponse.json({
      plan: normalized,
      model: usedModel,
    });
  } catch (err) {
    console.error('[POST /api/ai-calendar]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}