import { NextRequest, NextResponse } from "next/server";
import { DebateRequestSchema } from "@/lib/types/debate";
import { runDebate } from "@/lib/debate/runDebate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = DebateRequestSchema.parse(body);

    const result = await runDebate(validated);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API] Debate error:", error);
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    if (error.message?.includes("API_KEY")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error.message?.includes("rate limit") || error.message?.includes("429") || error.message?.includes("529")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "An error occurred during the debate" },
      { status: 500 }
    );
  }
}
