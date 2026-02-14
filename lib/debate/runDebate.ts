import type { DebateRequest, DebateResponse, TranscriptEntry, ModelConfig } from "@/lib/types/debate";
import { createProvider } from "@/lib/providers";

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.response?.status;
      
      // Retry on rate limit errors (429, 529)
      if ((status === 429 || status === 529) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1}, waiting ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error("Unknown error");
}

export async function runDebate(request: DebateRequest): Promise<DebateResponse> {
  const { statement, context, rounds, forModel, againstModel } = request;

  // Validate API keys
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (forModel.provider === "openai" && !openaiKey) {
    throw new Error("OPENAI_API_KEY is required for FOR model");
  }
  if (forModel.provider === "anthropic" && !anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY is required for FOR model");
  }
  if (againstModel.provider === "openai" && !openaiKey) {
    throw new Error("OPENAI_API_KEY is required for AGAINST model");
  }
  if (againstModel.provider === "anthropic" && !anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY is required for AGAINST model");
  }

  const forProvider = createProvider(
    forModel.provider,
    forModel.provider === "openai" ? openaiKey! : anthropicKey!
  );
  const againstProvider = createProvider(
    againstModel.provider,
    againstModel.provider === "openai" ? openaiKey! : anthropicKey!
  );

  const transcript: TranscriptEntry[] = [];

  // Run debate rounds
  for (let round = 1; round <= rounds; round++) {
    // FOR turn
    const forText = await retryWithBackoff(() =>
      forProvider.generateTurn(statement, context, "FOR", transcript, forModel.model)
    );
    transcript.push({
      round,
      side: "FOR",
      provider: forModel.provider,
      model: forModel.model,
      text: forText,
    });

    // AGAINST turn
    const againstText = await retryWithBackoff(() =>
      againstProvider.generateTurn(statement, context, "AGAINST", transcript, againstModel.model)
    );
    transcript.push({
      round,
      side: "AGAINST",
      provider: againstModel.provider,
      model: againstModel.model,
      text: againstText,
    });
  }

  // Determine judge model
  // Use OpenAI gpt-5.2 by default, unless neither side is OpenAI, then use Claude Sonnet 4.5
  let judgeModel: ModelConfig;
  if (forModel.provider === "openai" || againstModel.provider === "openai") {
    judgeModel = { provider: "openai", model: "gpt-5.2" };
  } else {
    judgeModel = { provider: "anthropic", model: "claude-sonnet-4-5-20250929" };
  }

  const judgeProvider = createProvider(
    judgeModel.provider,
    judgeModel.provider === "openai" ? openaiKey! : anthropicKey!
  );

  // Judge summary
  const judgeSummary = await retryWithBackoff(() =>
    judgeProvider.summarizeJudge(statement, context, transcript, judgeModel.model)
  );

  // Stance updates
  const forStance = await retryWithBackoff(() =>
    forProvider.stanceUpdate(statement, context, "FOR", transcript, judgeSummary, forModel.model)
  );

  const againstStance = await retryWithBackoff(() =>
    againstProvider.stanceUpdate(statement, context, "AGAINST", transcript, judgeSummary, againstModel.model)
  );

  return {
    transcript,
    judgeSummary,
    forStance,
    againstStance,
  };
}
