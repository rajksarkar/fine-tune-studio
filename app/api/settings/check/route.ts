import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    openaiKeyPresent: !!process.env.OPENAI_API_KEY,
    anthropicKeyPresent: !!process.env.ANTHROPIC_API_KEY,
  });
}
