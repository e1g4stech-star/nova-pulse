import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length < 3) {
      return NextResponse.json(
        { error: "Prompt minimal 3 karakter" },
        { status: 400 }
      );
    }

    const imageData = await generateImage(prompt);

    return NextResponse.json({ success: true, data: { image: imageData } });
  } catch (error: any) {
    console.error("AI Image error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal generate gambar" },
      { status: 500 }
    );
  }
}
