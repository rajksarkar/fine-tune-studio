import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import type { Provider } from "./base";

export function createProvider(provider: "openai" | "anthropic", apiKey: string): Provider {
  if (provider === "openai") {
    return new OpenAIProvider(apiKey);
  } else {
    return new AnthropicProvider(apiKey);
  }
}
