# FairFight

A local-first web application that lets two LLMs debate a statement: one takes the FOR side, the other takes the AGAINST side, for N rounds (default 10). After the debate, the app produces a structured summary of the strongest arguments, key uncertainties, and stance updates from each model.

## Features

- **Dual LLM Debates**: Choose from OpenAI (gpt-5.2, gpt-5.1, gpt-5) or Anthropic (Claude Opus, Sonnet, Haiku) models
- **Configurable Rounds**: Set 1-20 rounds of debate
- **Live Transcript**: Watch the debate unfold in real-time
- **Structured Analysis**: Get judge summaries with best arguments, blind spots, and critical questions
- **Stance Updates**: See if each model maintains or flips their position after the debate

## Setup

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for OpenAI models)
- Anthropic API key (for Anthropic models)

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

3. Start the development server:
```bash
npm run dev
```

4. Navigate to `http://localhost:3000/fairfight` in your browser

## Usage

1. **Enter a Statement**: Type the statement you want the models to debate
2. **Add Context (Optional)**: Provide additional context or constraints
3. **Configure Rounds**: Set the number of debate rounds (1-20, default 10)
4. **Select Models**: Choose which models will argue FOR and AGAINST
5. **Swap Sides**: Use the checkbox to quickly swap which model is FOR/AGAINST
6. **Start Debate**: Click "Start Debate" and watch the models argue

## How It Works

### Debate Protocol

Each model is forced into a role and must not break character:
- **FOR model**: Argues that the statement is true or the decision should be "yes"
- **AGAINST model**: Argues the opposite or the decision should be "no"

Each turn contains:
1. **New points** (max 5 bullets) - novel arguments not yet made
2. **Rebuttals to opponent** (max 5 bullets) - counter their latest arguments
3. **Evidence I'd want** (max 3 bullets) - what data would strengthen the case

Turns are kept concise (200-350 tokens target).

### Round Logic

For each round:
1. FOR model generates a turn given the statement, context, and full transcript
2. AGAINST model generates a turn given the same inputs plus FOR's new turn

After all rounds:
1. A judge (OpenAI gpt-5.2 by default, or Claude Sonnet 4.5 if neither side is OpenAI) summarizes the debate
2. Each debater provides a stance update: STAY or FLIP with confidence and reasoning

### Output Structure

The app produces:
- **Full Transcript**: All rounds with FOR and AGAINST arguments
- **Judge's Summary**:
  - Best FOR arguments
  - Best AGAINST arguments
  - Key assumptions / unknowns
  - Critical questions (top 3)
  - Decision heuristic
- **Stance Updates**: Each model's final position, confidence, reasoning, and top 3 decisive points

## API Design

### POST /api/debate

**Request:**
```json
{
  "statement": "string",
  "context": "string (optional)",
  "rounds": number,
  "forModel": {
    "provider": "openai" | "anthropic",
    "model": "string"
  },
  "againstModel": {
    "provider": "openai" | "anthropic",
    "model": "string"
  }
}
```

**Response:**
```json
{
  "transcript": [
    {
      "round": number,
      "side": "FOR" | "AGAINST",
      "provider": "string",
      "model": "string",
      "text": "string"
    }
  ],
  "judgeSummary": {
    "best_for": string[],
    "best_against": string[],
    "blind_spots": string[],
    "critical_questions": string[],
    "decision_heuristic": {
      "if_true_then": "string",
      "if_false_then": "string",
      "what_would_change_my_mind": string[]
    }
  },
  "forStance": {
    "final_position": "STAY" | "FLIP",
    "confidence": number,
    "why": "string",
    "top_3_decisive_points": string[]
  },
  "againstStance": {
    "final_position": "STAY" | "FLIP",
    "confidence": number,
    "why": "string",
    "top_3_decisive_points": string[]
  }
}
```

## Error Handling

The app handles:
- Missing API keys (shows friendly error)
- Rate limits (automatic retry with exponential backoff, max 2 retries)
- Invalid models (validation error)
- Network errors (user-friendly messages)

## Security

- API keys are never exposed to the browser
- All API calls are made server-side
- `.env.local` is in `.gitignore`

## Settings Page

Visit `/settings` to check if your environment variables are configured correctly.

## Limitations

- No streaming support (full transcript returned after completion)
- Server timeout protection may limit very long debates
- Cost depends on model selection and number of rounds
- Models may occasionally break character (though prompts try to prevent this)

## Example

**Statement**: "We should move our offsite from NYC to Miami due to weather risk."

**Rounds**: 6

**FOR**: gpt-5.2

**AGAINST**: claude-sonnet-4-5-20250929

This will produce a 6-round debate with structured summaries and stance updates from both models.

## Tech Stack

- **Next.js 15+** with App Router (TypeScript)
- **TailwindCSS** for styling
- **Zod** for validation
- **OpenAI** official Node SDK
- **Anthropic** official Node SDK

## License

This project is part of the Fine-Tune Studio workspace.
