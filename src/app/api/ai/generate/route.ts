import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { idea } = await req.json();

    if (!idea || idea.trim().length < 3) {
      return NextResponse.json(
        { error: "Ide konten minimal 3 karakter" },
        { status: 400 }
      );
    }

    const result = await generateContent(idea);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("AI Generate error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal generate konten" },
      { status: 500 }
    );
  }
}
