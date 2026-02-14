import type { JudgeSummary, StanceUpdate, TranscriptEntry } from "@/lib/types/debate";

export interface Provider {
  generateTurn(
    statement: string,
    context: string | undefined,
    side: "FOR" | "AGAINST",
    transcript: TranscriptEntry[],
    model: string
  ): Promise<string>;

  summarizeJudge(
    statement: string,
    context: string | undefined,
    transcript: TranscriptEntry[],
    model: string
  ): Promise<JudgeSummary>;

  stanceUpdate(
    statement: string,
    context: string | undefined,
    side: "FOR" | "AGAINST",
    transcript: TranscriptEntry[],
    judgeSummary: JudgeSummary,
    model: string
  ): Promise<StanceUpdate>;
}
