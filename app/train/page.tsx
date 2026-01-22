'use client'

import { useState, useEffect } from 'react'
import { validateJSONL } from '@/lib/jsonl-validator.client'

interface FileUpload {
  id: string
  filename: string
  openai_file_id: string
  bytes: number
}

interface Job {
  id: string
  openai_job_id: string
  status: string
  base_model: string
  fine_tuned_model: string | null
  training_file: { id: string; filename: string }
  validation_file: { id: string; filename: string } | null
  createdAt: string
  updatedAt: string
}

interface Event {
  id: string
  object: string
  created_at: number
  level: string
  message: string
}

export default function TrainPage() {
  const [baseModel, setBaseModel] = useState('gpt-3.5-turbo')
  const [trainingFile, setTrainingFile] = useState<File | null>(null)
  const [validationFile, setValidationFile] = useState<File | null>(null)
  const [trainingFileId, setTrainingFileId] = useState<string | null>(null)
  const [validationFileId, setValidationFileId] = useState<string | null>(null)
  const [trainingValidation, setTrainingValidation] = useState<any>(null)
  const [validationValidation, setValidationValidation] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [systemInstructions, setSystemInstructions] = useState('You are a helpful assistant.')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    if (currentJob && (currentJob.status === 'validating_files' || currentJob.status === 'queued' || currentJob.status === 'running')) {
      const interval = setInterval(() => {
        refreshJob()
        loadEvents()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [currentJob])

  const loadJobs = async () => {
    try {
      const res = await fetch('/api/fine-tune/jobs')
      const data = await res.json()
      setJobs(data)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    }
  }

  const refreshJob = async () => {
    if (!currentJob) return
    try {
      const res = await fetch(`/api/fine-tune/${currentJob.id}`)
      const data = await res.json()
      setCurrentJob(data)
    } catch (error) {
      console.error('Failed to refresh job:', error)
    }
  }

  const loadEvents = async () => {
    if (!currentJob) return
    try {
      const res = await fetch(`/api/fine-tune/${currentJob.id}/events`)
      const data = await res.json()
      setEvents(data.data || [])
    } catch (error) {
      console.error('Failed to load events:', error)
    }
  }

  const handleFileChange = async (file: File, type: 'training' | 'validation') => {
    if (type === 'training') {
      setTrainingFile(file)
    } else {
      setValidationFile(file)
    }

    // Client-side validation
    const content = await file.text()
    const validation = validateJSONL(content, 10)

    if (type === 'training') {
      setTrainingValidation(validation)
    } else {
      setValidationValidation(validation)
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Upload failed')
    }

    const data = await res.json()
    return data.id
  }

  const startTraining = async () => {
    if (!trainingFile || !trainingValidation?.valid) {
      alert('Please upload a valid training file')
      return
    }

    setLoading(true)
    setUploading(true)

    try {
      // Upload training file
      const trainingId = await uploadFile(trainingFile)
      setTrainingFileId(trainingId)

      // Upload validation file if provided
      let validationId: string | null = null
      if (validationFile && validationValidation?.valid) {
        validationId = await uploadFile(validationFile)
        setValidationFileId(validationId)
      }

      // Create fine-tuning job
      const res = await fetch('/api/fine-tune/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_file_id: trainingId,
          validation_file_id: validationId,
          model: baseModel,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create job')
      }

      const job = await res.json()
      setCurrentJob(job)
      await loadEvents()
      await loadJobs()

      // Reset form
      setTrainingFile(null)
      setValidationFile(null)
      setTrainingFileId(null)
      setValidationFileId(null)
      setTrainingValidation(null)
      setValidationValidation(null)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setUploading(false)
      setLoading(false)
    }
  }

  const exportDrafts = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/training-drafts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instructions: systemInstructions || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Export failed')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `training-drafts-${Date.now()}.jsonl`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Train Models</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Training Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Create Fine-Tuning Job</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Base Model</label>
                <select
                  value={baseModel}
                  onChange={(e) => setBaseModel(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  <option value="gpt-3.5-turbo-1106">gpt-3.5-turbo-1106</option>
                  <option value="gpt-3.5-turbo-0613">gpt-3.5-turbo-0613</option>
                  <option value="gpt-4-0613">gpt-4-0613 (if available)</option>
                  <option value="babbage-002">babbage-002</option>
                  <option value="davinci-002">davinci-002</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Note: Not all models support fine-tuning. gpt-3.5-turbo is recommended.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Training File (JSONL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".jsonl"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileChange(file, 'training')
                  }}
                  className="w-full p-2 border rounded"
                />
                {trainingValidation && (
                  <div className="mt-2">
                    {trainingValidation.valid ? (
                      <p className="text-green-600 text-sm">
                        ✓ Valid JSONL ({trainingValidation.lineCount} lines)
                      </p>
                    ) : (
                      <div className="text-red-600 text-sm">
                        <p className="font-semibold">Validation errors:</p>
                        <ul className="list-disc list-inside">
                          {trainingValidation.errors.slice(0, 5).map((err: any, i: number) => (
                            <li key={i}>Line {err.line}: {err.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Validation File (JSONL) <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="file"
                  accept=".jsonl"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileChange(file, 'validation')
                  }}
                  className="w-full p-2 border rounded"
                />
                {validationValidation && (
                  <div className="mt-2">
                    {validationValidation.valid ? (
                      <p className="text-green-600 text-sm">
                        ✓ Valid JSONL ({validationValidation.lineCount} lines)
                      </p>
                    ) : (
                      <div className="text-red-600 text-sm">
                        <p className="font-semibold">Validation errors:</p>
                        <ul className="list-disc list-inside">
                          {validationValidation.errors.slice(0, 5).map((err: any, i: number) => (
                            <li key={i}>Line {err.line}: {err.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={startTraining}
                disabled={loading || !trainingFile || !trainingValidation?.valid}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Starting...' : 'Start Training'}
              </button>
            </div>
          </div>

          {/* Current Job Status */}
          {currentJob && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Current Job</h2>
              <div className="space-y-2">
                <p><strong>Job ID:</strong> {currentJob.openai_job_id}</p>
                <p><strong>Status:</strong> <span className={`font-semibold ${
                  currentJob.status === 'succeeded' ? 'text-green-600' :
                  currentJob.status === 'failed' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>{currentJob.status}</span></p>
                <p><strong>Base Model:</strong> {currentJob.base_model}</p>
                {currentJob.fine_tuned_model && (
                  <p><strong>Fine-Tuned Model:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{currentJob.fine_tuned_model}</code></p>
                )}
                <p><strong>Created:</strong> {new Date(currentJob.createdAt).toLocaleString()}</p>
              </div>

              {events.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Events</h3>
                  <div className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto">
                    {events.map((event) => (
                      <div key={event.id} className="text-sm mb-2">
                        <span className="text-gray-500">{new Date(event.created_at * 1000).toLocaleTimeString()}</span>
                        <span className={`ml-2 ${
                          event.level === 'error' ? 'text-red-600' :
                          event.level === 'info' ? 'text-blue-600' :
                          'text-gray-700'
                        }`}>
                          [{event.level}] {event.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Jobs History and Export */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Export Training Drafts</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">System Instructions (optional)</label>
                <textarea
                  value={systemInstructions}
                  onChange={(e) => setSystemInstructions(e.target.value)}
                  placeholder="You are a helpful assistant."
                  className="w-full p-2 border rounded"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  These instructions will be added as a system message to each training example.
                </p>
              </div>
              <button
                onClick={exportDrafts}
                disabled={exporting}
                className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {exporting ? 'Exporting...' : 'Export Drafts to JSONL'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Jobs History</h2>
          <div className="space-y-4">
            {jobs.length === 0 ? (
              <p className="text-gray-500">No jobs yet</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono text-sm text-gray-600">{job.openai_job_id}</p>
                      <p className="text-sm text-gray-500">{new Date(job.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      job.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                      job.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm"><strong>Model:</strong> {job.base_model}</p>
                  {job.fine_tuned_model && (
                    <p className="text-sm mt-1">
                      <strong>Fine-Tuned:</strong> <code className="bg-gray-100 px-1 rounded">{job.fine_tuned_model}</code>
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setCurrentJob(job)
                      loadEvents()
                    }}
                    className="mt-2 text-blue-600 text-sm hover:underline"
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
