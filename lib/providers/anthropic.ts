import Anthropic from "@anthropic-ai/sdk";
import type { Provider } from "./base";
import type { JudgeSummary, StanceUpdate, TranscriptEntry } from "@/lib/types/debate";
import { JudgeSummarySchema, StanceUpdateSchema } from "@/lib/types/debate";

export class AnthropicProvider implements Provider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateTurn(
    statement: string,
    context: string | undefined,
    side: "FOR" | "AGAINST",
    transcript: TranscriptEntry[],
    model: string
  ): Promise<string> {
    const role = side === "FOR" 
      ? "You are arguing FOR the statement. Your goal is to convince that the statement is true or the decision should be 'yes'."
      : "You are arguing AGAINST the statement. Your goal is to convince that the statement is false or the decision should be 'no'.";

    const transcriptText = transcript
      .map((entry) => `Round ${entry.round} - ${entry.side}: ${entry.text}`)
      .join("\n\n");

    const systemPrompt = `${role}

You must stay in character. Do not break character. Be direct and concise. No long introductions or niceties.

Your response must contain:
1) "New points" (max 5 bullets) - novel arguments not yet made
2) "Rebuttals to opponent" (max 5 bullets) - counter their latest arguments
3) "Evidence I'd want" (max 3 bullets) - what data would strengthen your case

Keep your response to 200-350 tokens. Be concise and impactful.`;

    const userPrompt = `Statement: ${statement}
${context ? `Context: ${context}\n` : ""}
Transcript so far:
${transcriptText || "This is the first round."}

Your turn:`;

    const startTime = Date.now();
    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
      });

      const duration = Date.now() - startTime;
      console.log(`[Anthropic] generateTurn (${model}): ${duration}ms`);

      const content = response.content[0];
      if (content.type === "text") {
        return content.text;
      }
      return "";
    } catch (error: any) {
      console.error(`[Anthropic] generateTurn error:`, error);
      throw new Error(`Anthropic API error: ${error.message || "Unknown error"}`);
    }
  }

  async summarizeJudge(
    statement: string,
    context: string | undefined,
    transcript: TranscriptEntry[],
    model: string
  ): Promise<JudgeSummary> {
    const transcriptText = transcript
      .map((entry) => `Round ${entry.round} - ${entry.side}: ${entry.text}`)
      .join("\n\n");

    const systemPrompt = `You are an impartial judge summarizing a debate. Output STRICT JSON matching the required schema.`;

    const userPrompt = `Statement: ${statement}
${context ? `Context: ${context}\n` : ""}
Full debate transcript:
${transcriptText}

Analyze the debate and output JSON with:
- best_for: array of strongest FOR arguments (strings)
- best_against: array of strongest AGAINST arguments (strings)
- blind_spots: array of key assumptions/unknowns/missing info (strings)
- critical_questions: array of the 3 most important questions to ask before deciding (strings)
- decision_heuristic: object with:
  - if_true_then: what follows if statement is true
  - if_false_then: what follows if statement is false
  - what_would_change_my_mind: array of conditions that would change your mind

Output ONLY valid JSON, no markdown, no code blocks.`;

    const startTime = Date.now();
    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.5,
      });

      const duration = Date.now() - startTime;
      console.log(`[Anthropic] summarizeJudge (${model}): ${duration}ms`);

      const content = response.content[0];
      if (content.type === "text") {
        const text = content.text.trim();
        // Remove markdown code blocks if present
        const jsonText = text.replace(/^```json\s*|\s*```$/g, "").trim();
        const parsed = JSON.parse(jsonText);
        return JudgeSummarySchema.parse(parsed);
      }
      throw new Error("No text content in response");
    } catch (error: any) {
      console.error(`[Anthropic] summarizeJudge error:`, error);
      throw new Error(`Anthropic API error: ${error.message || "Unknown error"}`);
    }
  }

  async stanceUpdate(
    statement: string,
    context: string | undefined,
    side: "FOR" | "AGAINST",
    transcript: TranscriptEntry[],
    judgeSummary: JudgeSummary,
    model: string
  ): Promise<StanceUpdate> {
    const role = side === "FOR" 
      ? "You argued FOR the statement."
      : "You argued AGAINST the statement.";

    const transcriptText = transcript
      .map((entry) => `Round ${entry.round} - ${entry.side}: ${entry.text}`)
      .join("\n\n");

    const systemPrompt = `You are a debater reflecting on your performance. Output STRICT JSON matching the required schema.`;

    const userPrompt = `Statement: ${statement}
${context ? `Context: ${context}\n` : ""}
${role}

Debate transcript:
${transcriptText}

Judge's summary:
${JSON.stringify(judgeSummary, null, 2)}

After hearing the full debate and the judge's analysis, do you:
- STAY: maintain your original position (FOR stays FOR, AGAINST stays AGAINST)
- FLIP: change your position (FOR becomes AGAINST, or vice versa)

Output JSON with:
- final_position: "STAY" or "FLIP"
- confidence: number 0-100
- why: explanation of your decision
- top_3_decisive_points: array of exactly 3 points that most influenced your decision

Output ONLY valid JSON, no markdown, no code blocks.`;

    const startTime = Date.now();
    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.6,
      });

      const duration = Date.now() - startTime;
      console.log(`[Anthropic] stanceUpdate (${model}): ${duration}ms`);

      const content = response.content[0];
      if (content.type === "text") {
        const text = content.text.trim();
        // Remove markdown code blocks if present
        const jsonText = text.replace(/^```json\s*|\s*```$/g, "").trim();
        const parsed = JSON.parse(jsonText);
        return StanceUpdateSchema.parse(parsed);
      }
      throw new Error("No text content in response");
    } catch (error: any) {
      console.error(`[Anthropic] stanceUpdate error:`, error);
      throw new Error(`Anthropic API error: ${error.message || "Unknown error"}`);
    }
  }
}
