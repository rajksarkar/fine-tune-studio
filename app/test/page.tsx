'use client'

import { useState, useEffect } from 'react'

interface Model {
  base: string[]
  fine_tuned: Array<{
    id: string
    base_model: string
    createdAt: string
  }>
}

export default function TestPage() {
  const [models, setModels] = useState<Model>({ base: [], fine_tuned: [] })
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [abMode, setAbMode] = useState(false)
  const [modelA, setModelA] = useState<string>('')
  const [modelB, setModelB] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [instructions, setInstructions] = useState('')
  const [output, setOutput] = useState('')
  const [outputA, setOutputA] = useState('')
  const [outputB, setOutputB] = useState('')
  const [abRunId, setAbRunId] = useState<string | null>(null)
  const [winner, setWinner] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDraftForm, setShowDraftForm] = useState(false)
  const [idealAnswer, setIdealAnswer] = useState('')

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      const res = await fetch('/api/models')
      const data = await res.json()
      setModels(data)
      if (data.base.length > 0 && !selectedModel) {
        setSelectedModel(data.base[0])
        setModelA(data.base[0])
      }
      if (data.base.length > 0 && !modelB) {
        setModelB(data.base[0])
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }

  const handleTest = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt')
      return
    }

    if (abMode) {
      if (!modelA || !modelB) {
        alert('Please select both models for A/B comparison')
        return
      }
    } else {
      if (!selectedModel) {
        alert('Please select a model')
        return
      }
    }

    setLoading(true)

    try {
      if (abMode) {
        const res = await fetch('/api/test/ab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelA,
            modelB,
            prompt,
            instructions: instructions || undefined,
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'A/B test failed')
        }

        const data = await res.json()
        setOutputA(data.outputA)
        setOutputB(data.outputB)
        setAbRunId(data.id)
      } else {
        const res = await fetch('/api/test/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            input: prompt,
            instructions: instructions || undefined,
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Test failed')
        }

        const data = await res.json()
        setOutput(data.output)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveWinner = async () => {
    if (!abRunId || !winner) {
      alert('Please select a winner')
      return
    }

    try {
      const res = await fetch(`/api/test/ab/${abRunId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner, notes }),
      })

      if (!res.ok) {
        throw new Error('Failed to save winner')
      }

      alert('Winner saved!')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleFlagBad = () => {
    if (!output && !outputA && !outputB) {
      alert('No output to flag')
      return
    }
    setShowDraftForm(true)
    setIdealAnswer('')
  }

  const handleCreateDraft = async () => {
    if (!idealAnswer.trim()) {
      alert('Please enter an ideal answer')
      return
    }

    try {
      const res = await fetch('/api/training-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          ideal_answer: idealAnswer,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create draft')
      }

      alert('Training draft created!')
      setShowDraftForm(false)
      setIdealAnswer('')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const allModels = [
    ...models.base.map(m => ({ id: m, label: m, type: 'base' })),
    ...models.fine_tuned.map(m => ({ id: m.id, label: `${m.id} (${m.base_model})`, type: 'fine-tuned' })),
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test Models</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={abMode}
              onChange={(e) => setAbMode(e.target.checked)}
              className="w-4 h-4"
            />
            <span>A/B Compare Mode</span>
          </label>
        </div>

        {abMode ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Model A</label>
              <select
                value={modelA}
                onChange={(e) => setModelA(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {allModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Model B</label>
              <select
                value={modelB}
                onChange={(e) => setModelB(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {allModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {allModels.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Instructions (optional)</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="System instructions..."
            className="w-full p-2 border rounded"
            rows={2}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
            className="w-full p-2 border rounded"
            rows={4}
          />
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Send'}
        </button>
      </div>

      {/* Output */}
      {abMode ? (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Model A: {modelA}</h2>
            <div className="bg-gray-50 p-4 rounded min-h-[200px] whitespace-pre-wrap">
              {outputA || 'No output yet'}
            </div>
            {outputA && (
              <button
                onClick={handleFlagBad}
                className="mt-4 text-red-600 text-sm hover:underline"
              >
                Flag as Bad
              </button>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Model B: {modelB}</h2>
            <div className="bg-gray-50 p-4 rounded min-h-[200px] whitespace-pre-wrap">
              {outputB || 'No output yet'}
            </div>
            {outputB && (
              <button
                onClick={handleFlagBad}
                className="mt-4 text-red-600 text-sm hover:underline"
              >
                Flag as Bad
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Output</h2>
          <div className="bg-gray-50 p-4 rounded min-h-[200px] whitespace-pre-wrap">
            {output || 'No output yet'}
          </div>
          {output && (
            <button
              onClick={handleFlagBad}
              className="mt-4 text-red-600 text-sm hover:underline"
            >
              Flag as Bad
            </button>
          )}
        </div>
      )}

      {/* A/B Winner Selection */}
      {abMode && outputA && outputB && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Winner</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Winner</label>
              <select
                value={winner}
                onChange={(e) => setWinner(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select...</option>
                <option value="A">Model A</option>
                <option value="B">Model B</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why did you choose this winner?"
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
            <button
              onClick={handleSaveWinner}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Save Winner
            </button>
          </div>
        </div>
      )}

      {/* Training Draft Form */}
      {showDraftForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create Training Draft</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Original Prompt</label>
              <div className="bg-gray-50 p-3 rounded">{prompt}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ideal Answer</label>
              <textarea
                value={idealAnswer}
                onChange={(e) => setIdealAnswer(e.target.value)}
                placeholder="Enter the ideal answer for this prompt..."
                className="w-full p-2 border rounded"
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateDraft}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Create Draft
              </button>
              <button
                onClick={() => {
                  setShowDraftForm(false)
                  setIdealAnswer('')
                }}
                className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
