import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Fine-Tune Studio</h1>
      <p className="text-lg text-gray-600 mb-8">
        Orchestrate OpenAI fine-tuning for GPT-4o mini and GPT-4o
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/convert" className="block p-6 border rounded-lg hover:bg-gray-50">
          <h2 className="text-2xl font-semibold mb-2">Convert</h2>
          <p className="text-gray-600">
            Convert text, PDF, DOC, and other files to JSONL format for training
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
