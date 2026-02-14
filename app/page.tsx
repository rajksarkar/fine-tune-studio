import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Fine-Tune Studio</h1>
      <p className="text-lg text-gray-600 mb-8">
        Orchestrate OpenAI fine-tuning for supported models (gpt-3.5-turbo, gpt-4-0613, and others)
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/fairfight" className="block p-6 border rounded-lg hover:bg-gray-50 bg-blue-50 border-blue-200">
          <h2 className="text-2xl font-semibold mb-2">FairFight</h2>
          <p className="text-gray-600">
            Watch two LLMs debate a statement with structured summaries and stance updates
          </p>
        </Link>
        <Link href="/convert" className="block p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-2xl font-semibold mb-2">Convert</h2>
          <p className="text-gray-600">
            Convert text, Markdown, PDF, DOC, and other files to JSONL format for training
          </p>
        </Link>
        <Link href="/train" className="block p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-2xl font-semibold mb-2">Train</h2>
          <p className="text-gray-600">
            Upload training files, create fine-tuning jobs, and monitor their progress
          </p>
        </Link>
        <Link href="/test" className="block p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-2xl font-semibold mb-2">Test</h2>
          <p className="text-gray-600">
            Test your models, compare outputs, and iterate on improvements
          </p>
        </Link>
      </div>
    </div>
  )
}
