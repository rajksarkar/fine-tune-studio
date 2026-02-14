"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [openaiKeyPresent, setOpenaiKeyPresent] = useState<boolean | null>(null);
  const [anthropicKeyPresent, setAnthropicKeyPresent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/check")
      .then((res) => res.json())
      .then((data) => {
        setOpenaiKeyPresent(data.openaiKeyPresent);
        setAnthropicKeyPresent(data.anthropicKeyPresent);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p>Checking environment variables...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <p className="text-sm text-gray-600 mb-4">
            These are checked server-side. Add them to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">OPENAI_API_KEY</div>
                <div className="text-sm text-gray-600">Required for OpenAI models</div>
              </div>
              <div className={openaiKeyPresent ? "text-green-600" : "text-red-600"}>
                {openaiKeyPresent ? "✓ Present" : "✗ Missing"}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">ANTHROPIC_API_KEY</div>
                <div className="text-sm text-gray-600">Required for Anthropic models</div>
              </div>
              <div className={anthropicKeyPresent ? "text-green-600" : "text-red-600"}>
                {anthropicKeyPresent ? "✓ Present" : "✗ Missing"}
              </div>
            </div>
          </div>
        </div>

        {(!openaiKeyPresent || !anthropicKeyPresent) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Setup Required</h3>
            <p className="text-sm text-yellow-700 mb-2">
              To use FairFight, you need to add API keys to your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file:
            </p>
            <pre className="bg-yellow-100 p-3 rounded text-sm overflow-x-auto">
{`OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here`}
            </pre>
            <p className="text-sm text-yellow-700 mt-2">
              After adding the keys, restart your Next.js development server.
            </p>
          </div>
        )}

        {openaiKeyPresent && anthropicKeyPresent && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">✓ All required environment variables are configured!</p>
          </div>
        )}
      </div>
    </div>
  );
}
