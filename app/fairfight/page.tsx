"use client";

import { useState } from "react";
import type { DebateResponse, TranscriptEntry, JudgeSummary, StanceUpdate, ModelConfig } from "@/lib/types/debate";

const OPENAI_MODELS = ["gpt-5.2", "gpt-5.1", "gpt-5"];
const ANTHROPIC_MODELS = [
  "claude-opus-4-5-20251101",
  "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5-20251001",
];

export default function FairFightPage() {
  const [statement, setStatement] = useState("");
  const [context, setContext] = useState("");
  const [rounds, setRounds] = useState(10);
  const [forProvider, setForProvider] = useState<"openai" | "anthropic">("openai");
  const [forModel, setForModel] = useState("gpt-5.2");
  const [againstProvider, setAgainstProvider] = useState<"openai" | "anthropic">("anthropic");
  const [againstModel, setAgainstModel] = useState("claude-sonnet-4-5-20250929");
  const [isLoading, setIsLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [result, setResult] = useState<DebateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSwap = () => {
    const tempProvider = forProvider;
    const tempModel = forModel;
    setForProvider(againstProvider);
    setForModel(againstModel);
    setAgainstProvider(tempProvider);
    setAgainstModel(tempModel);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) {
      setError("Statement is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setCurrentRound(0);

    try {
      const response = await fetch("/api/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statement: statement.trim(),
          context: context.trim() || undefined,
          rounds,
          forModel: { provider: forProvider, model: forModel },
          againstModel: { provider: againstProvider, model: againstModel },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start debate");
      }

      const data: DebateResponse = await response.json();
      setResult(data);
      
      // Simulate progress by updating currentRound
      for (let i = 1; i <= rounds; i++) {
        setCurrentRound(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
      setCurrentRound(0);
    }
  };

  const getTranscriptByRound = (transcript: TranscriptEntry[]) => {
    const byRound: Record<number, { for?: TranscriptEntry; against?: TranscriptEntry }> = {};
    transcript.forEach((entry) => {
      if (!byRound[entry.round]) {
        byRound[entry.round] = {};
      }
      byRound[entry.round][entry.side.toLowerCase() as "for" | "against"] = entry;
    });
    return byRound;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">FairFight</h1>
        <p className="text-gray-600">Watch two LLMs debate a statement</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label htmlFor="statement" className="block text-sm font-medium mb-2">
            Statement <span className="text-red-500">*</span>
          </label>
          <textarea
            id="statement"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the statement to debate..."
          />
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium mb-2">
            Context / Constraints (optional)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional context or constraints..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="rounds" className="block text-sm font-medium mb-2">
              Rounds
            </label>
            <input
              type="number"
              id="rounds"
              value={rounds}
              onChange={(e) => setRounds(Math.max(1, Math.min(20, parseInt(e.target.value) || 10)))}
              min={1}
              max={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="for-provider" className="block text-sm font-medium mb-2">
              FOR Model Provider
            </label>
            <select
              id="for-provider"
              value={forProvider}
              onChange={(e) => {
                setForProvider(e.target.value as "openai" | "anthropic");
                setForModel(
                  e.target.value === "openai" ? OPENAI_MODELS[0] : ANTHROPIC_MODELS[0]
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          <div>
            <label htmlFor="for-model" className="block text-sm font-medium mb-2">
              FOR Model
            </label>
            <select
              id="for-model"
              value={forModel}
              onChange={(e) => setForModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(forProvider === "openai" ? OPENAI_MODELS : ANTHROPIC_MODELS).map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="against-provider" className="block text-sm font-medium mb-2">
              AGAINST Model Provider
            </label>
            <select
              id="against-provider"
              value={againstProvider}
              onChange={(e) => {
                setAgainstProvider(e.target.value as "openai" | "anthropic");
                setAgainstModel(
                  e.target.value === "openai" ? OPENAI_MODELS[0] : ANTHROPIC_MODELS[0]
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          <div>
            <label htmlFor="against-model" className="block text-sm font-medium mb-2">
              AGAINST Model
            </label>
            <select
              id="against-model"
              value={againstModel}
              onChange={(e) => setAgainstModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(againstProvider === "openai" ? OPENAI_MODELS : ANTHROPIC_MODELS).map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                onChange={handleSwap}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Swap sides</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? `Running debate... (Round ${currentRound}/${rounds})` : "Start Debate"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {isLoading && currentRound > 0 && (
        <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-md">
          <p className="text-blue-700">Processing Round {currentRound} of {rounds}...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Transcript */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Debate Transcript</h2>
            <div className="space-y-4">
              {Object.entries(getTranscriptByRound(result.transcript)).map(([round, entries]) => (
                <div key={round} className="border-l-4 border-blue-500 pl-4 space-y-3">
                  <h3 className="font-semibold text-lg">Round {round}</h3>
                  {entries.for && (
                    <div className="bg-green-50 p-3 rounded">
                      <div className="font-semibold text-green-800 mb-1">FOR ({entries.for.model}):</div>
                      <div className="text-gray-700 whitespace-pre-wrap">{entries.for.text}</div>
                    </div>
                  )}
                  {entries.against && (
                    <div className="bg-red-50 p-3 rounded">
                      <div className="font-semibold text-red-800 mb-1">AGAINST ({entries.against.model}):</div>
                      <div className="text-gray-700 whitespace-pre-wrap">{entries.against.text}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Judge Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Judge&apos;s Summary</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Best FOR Arguments</h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.judgeSummary.best_for.map((arg, i) => (
                    <li key={i} className="text-gray-700">{arg}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Best AGAINST Arguments</h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.judgeSummary.best_against.map((arg, i) => (
                    <li key={i} className="text-gray-700">{arg}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Key Assumptions / Unknowns</h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.judgeSummary.blind_spots.map((spot, i) => (
                    <li key={i} className="text-gray-700">{spot}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Critical Questions (Top 3)</h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.judgeSummary.critical_questions.map((q, i) => (
                    <li key={i} className="text-gray-700">{q}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Decision Heuristic</h3>
                <div className="space-y-2">
                  <p><strong>If true, then:</strong> {result.judgeSummary.decision_heuristic.if_true_then}</p>
                  <p><strong>If false, then:</strong> {result.judgeSummary.decision_heuristic.if_false_then}</p>
                  <div>
                    <strong>What would change my mind:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {result.judgeSummary.decision_heuristic.what_would_change_my_mind.map((item, i) => (
                        <li key={i} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stance Updates */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Final Stance Updates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">FOR Model</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Position:</strong>{" "}
                    <span className={result.forStance.final_position === "STAY" ? "text-green-600" : "text-red-600"}>
                      {result.forStance.final_position === "STAY" ? "STAY FOR" : "FLIP to AGAINST"}
                    </span>
                  </p>
                  <p>
                    <strong>Confidence:</strong> {result.forStance.confidence}%
                  </p>
                  <p><strong>Why:</strong> {result.forStance.why}</p>
                  <div>
                    <strong>Top 3 Decisive Points:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {result.forStance.top_3_decisive_points.map((point, i) => (
                        <li key={i} className="text-gray-700">{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2">AGAINST Model</h3>
                <div className="space-y-2">
                  <p>
                    <strong>Position:</strong>{" "}
                    <span className={result.againstStance.final_position === "STAY" ? "text-red-600" : "text-green-600"}>
                      {result.againstStance.final_position === "STAY" ? "STAY AGAINST" : "FLIP to FOR"}
                    </span>
                  </p>
                  <p>
                    <strong>Confidence:</strong> {result.againstStance.confidence}%
                  </p>
                  <p><strong>Why:</strong> {result.againstStance.why}</p>
                  <div>
                    <strong>Top 3 Decisive Points:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {result.againstStance.top_3_decisive_points.map((point, i) => (
                        <li key={i} className="text-gray-700">{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
