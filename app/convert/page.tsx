'use client'

import { useState } from 'react'

export default function ConvertPage() {
  const [files, setFiles] = useState<File[]>([])
  const [systemInstructions, setSystemInstructions] = useState('You are a helpful assistant.')
  const [chunkSize, setChunkSize] = useState(1000)
  const [chunkOverlap, setChunkOverlap] = useState(200)
  const [formatType, setFormatType] = useState<'knowledge' | 'qa' | 'content'>('knowledge')
  const [converting, setConverting] = useState(false)
  const [jsonlContent, setJsonlContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
    setError(null)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleConvert = async () => {
    if (files.length === 0) {
      setError('Please select at least one file')
      return
    }

    setConverting(true)
    setError(null)
    setJsonlContent(null)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      formData.append('system_instructions', systemInstructions)
      formData.append('chunk_size', chunkSize.toString())
      formData.append('chunk_overlap', chunkOverlap.toString())
      formData.append('format_type', formatType)

      const res = await fetch('/api/convert/to-jsonl', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Conversion failed')
      }

      const blob = await res.blob()
      const text = await blob.text()
      setJsonlContent(text)
      setPreview(text.split('\n').slice(0, 10).join('\n'))
    } catch (err: any) {
      setError(err.message || 'Failed to convert files')
    } finally {
      setConverting(false)
    }
  }

  const handleDownload = () => {
    if (!jsonlContent) return

    const blob = new Blob([jsonlContent], { type: 'application/jsonl' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted-training-${Date.now()}.jsonl`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['txt', 'text'].includes(ext || '')) return 'Text'
    if (ext === 'pdf') return 'PDF'
    if (['doc', 'docx'].includes(ext || '')) return 'Word'
    return 'Unknown'
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Convert Files to JSONL</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload and Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Files (Text, PDF, DOC, DOCX)
              </label>
              <input
                type="file"
                multiple
                accept=".txt,.text,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="w-full p-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: .txt, .pdf, .doc, .docx
              </p>
            </div>

            {files.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Selected Files ({files.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {getFileType(file.name)} • {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Conversion Format
                </label>
                <select
                  value={formatType}
                  onChange={(e) => setFormatType(e.target.value as 'knowledge' | 'qa' | 'content')}
                  className="w-full p-2 border rounded"
                >
                  <option value="knowledge">Knowledge Base (content as assistant response)</option>
                  <option value="qa">Q&A (content as context, generate Q&A pairs)</option>
                  <option value="content">Content Only (content as user message)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose how to structure the training examples
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  System Instructions (optional)
                </label>
                <textarea
                  value={systemInstructions}
                  onChange={(e) => setSystemInstructions(e.target.value)}
                  placeholder="You are a helpful assistant."
                  className="w-full p-2 border rounded"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  These will be added as system messages in the training data
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chunk Size (characters)
                  </label>
                  <input
                    type="number"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value) || 1000)}
                    min={100}
                    max={10000}
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Split large documents into chunks
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chunk Overlap (characters)
                  </label>
                  <input
                    type="number"
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(parseInt(e.target.value) || 200)}
                    min={0}
                    max={1000}
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Overlap between chunks for context
                  </p>
                </div>
              </div>

              <button
                onClick={handleConvert}
                disabled={converting || files.length === 0}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {converting ? 'Converting...' : 'Convert to JSONL'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Preview and Download */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {jsonlContent && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Converted JSONL</h2>
                <button
                  onClick={handleDownload}
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-sm"
                >
                  Download
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Preview (first 10 lines of {jsonlContent.split('\n').length} total):
                </p>
                <div className="bg-gray-50 p-4 rounded max-h-96 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {preview}
                  </pre>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p>✓ Conversion complete</p>
                <p>✓ {jsonlContent.split('\n').filter(l => l.trim()).length} training examples generated</p>
                <p>✓ Ready for fine-tuning</p>
              </div>
            </div>
          )}

          {!jsonlContent && !error && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Output</h2>
              <p className="text-gray-500 text-sm">
                Upload files and click &quot;Convert to JSONL&quot; to generate training data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
