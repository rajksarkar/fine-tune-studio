import { z } from "zod";

export const ModelProviderSchema = z.enum(["openai", "anthropic"]);
export type ModelProvider = z.infer<typeof ModelProviderSchema>;

export const ModelConfigSchema = z.object({
  provider: ModelProviderSchema,
  model: z.string(),
});
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

export const DebateRequestSchema = z.object({
  statement: z.string().min(1),
  context: z.string().optional(),
  rounds: z.number().int().min(1).max(20),
  forModel: ModelConfigSchema,
  againstModel: ModelConfigSchema,
});
export type DebateRequest = z.infer<typeof DebateRequestSchema>;

export const TranscriptEntrySchema = z.object({
  round: z.number(),
  side: z.enum(["FOR", "AGAINST"]),
  provider: z.string(),
  model: z.string(),
  text: z.string(),
});
export type TranscriptEntry = z.infer<typeof TranscriptEntrySchema>;

export const DecisionHeuristicSchema = z.object({
  if_true_then: z.string(),
  if_false_then: z.string(),
  what_would_change_my_mind: z.array(z.string()),
});
export type DecisionHeuristic = z.infer<typeof DecisionHeuristicSchema>;

export const JudgeSummarySchema = z.object({
  best_for: z.array(z.string()),
  best_against: z.array(z.string()),
  blind_spots: z.array(z.string()),
  critical_questions: z.array(z.string()),
  decision_heuristic: DecisionHeuristicSchema,
});
export type JudgeSummary = z.infer<typeof JudgeSummarySchema>;

export const StanceUpdateSchema = z.object({
  final_position: z.enum(["STAY", "FLIP"]),
  confidence: z.number().min(0).max(100),
  why: z.string(),
  top_3_decisive_points: z.array(z.string()).length(3),
});
export type StanceUpdate = z.infer<typeof StanceUpdateSchema>;

export const DebateResponseSchema = z.object({
  transcript: z.array(TranscriptEntrySchema),
  judgeSummary: JudgeSummarySchema,
  forStance: StanceUpdateSchema,
  againstStance: StanceUpdateSchema,
});
export type DebateResponse = z.infer<typeof DebateResponseSchema>;
