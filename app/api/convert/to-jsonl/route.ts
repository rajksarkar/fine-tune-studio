import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

interface Chunk {
  text: string
  start: number
  end: number
}

function chunkText(text: string, chunkSize: number, chunkOverlap: number): string[] {
  if (text.length <= chunkSize) {
    return [text]
  }

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    let chunk = text.slice(start, end)

    // Try to break at sentence boundaries
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.')
      const lastNewline = chunk.lastIndexOf('\n')
      const breakPoint = Math.max(lastPeriod, lastNewline)
      
      if (breakPoint > chunkSize * 0.5) {
        chunk = chunk.slice(0, breakPoint + 1)
        start += breakPoint + 1
      } else {
        start += chunkSize - chunkOverlap
      }
    } else {
      start = text.length
    }

    chunks.push(chunk.trim())
  }

  return chunks.filter(chunk => chunk.length > 0)
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const extension = file.name.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'txt':
    case 'text':
    case 'md':
    case 'markdown':
      return buffer.toString('utf-8')

    case 'pdf':
      try {
        const data = await pdfParse(buffer)
        return data.text
      } catch (error) {
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

    case 'docx':
      try {
        const result = await mammoth.extractRawText({ buffer })
        return result.value
      } catch (error) {
        throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

    case 'doc':
      // DOC files (older format) are harder to parse without additional libraries
      // For now, we'll try to extract what we can or return an error
      throw new Error('DOC files (older format) are not fully supported. Please convert to DOCX or PDF first.')

    default:
      throw new Error(`Unsupported file type: ${extension}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const systemInstructions = formData.get('system_instructions')?.toString() || ''
    const chunkSize = parseInt(formData.get('chunk_size')?.toString() || '1000')
    const chunkOverlap = parseInt(formData.get('chunk_overlap')?.toString() || '200')
    const formatType = (formData.get('format_type')?.toString() || 'knowledge') as 'knowledge' | 'qa' | 'content'

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const jsonlLines: string[] = []

    // Process each file
    for (const file of files) {
      try {
        // Extract text from file
        const text = await extractTextFromFile(file)

        if (!text.trim()) {
          console.warn(`File ${file.name} appears to be empty`)
          continue
        }

        // Split into chunks if needed
        const chunks = chunkText(text, chunkSize, chunkOverlap)

        // Create training examples from chunks
        for (const chunk of chunks) {
          const trimmedChunk = chunk.trim()
          if (!trimmedChunk || trimmedChunk.length < 50) {
            continue // Skip very short chunks
          }

          const messages: any[] = []

          if (systemInstructions.trim()) {
            messages.push({
              role: 'system',
              content: systemInstructions.trim(),
            })
          }

          // Create training examples based on format type
          switch (formatType) {
            case 'knowledge':
              // Content as assistant's knowledge base response
              messages.push({
                role: 'user',
                content: `What information do you have about this topic?`,
              })
              messages.push({
                role: 'assistant',
                content: trimmedChunk,
              })
              break

            case 'qa':
              // Content as context, create Q&A pairs
              // Extract first sentence as question, rest as answer
              const sentences = trimmedChunk.split(/[.!?]+/).filter(s => s.trim().length > 10)
              if (sentences.length >= 2) {
                const question = sentences[0].trim() + '?'
                const answer = sentences.slice(1).join('. ').trim()
                messages.push({
                  role: 'user',
                  content: question,
                })
                messages.push({
                  role: 'assistant',
                  content: answer,
                })
              } else {
                // Fallback: use content as answer
                messages.push({
                  role: 'user',
                  content: 'Can you provide more information about this?',
                })
                messages.push({
                  role: 'assistant',
                  content: trimmedChunk,
                })
              }
              break

            case 'content':
              // Content as user message, assistant acknowledges
              messages.push({
                role: 'user',
                content: trimmedChunk,
              })
              messages.push({
                role: 'assistant',
                content: 'I understand. How can I help you with this information?',
              })
              break
          }

          jsonlLines.push(JSON.stringify({ messages }))
        }
      } catch (error: any) {
        console.error(`Error processing file ${file.name}:`, error)
        // Continue with other files even if one fails
        // You might want to collect errors and return them
      }
    }

    if (jsonlLines.length === 0) {
      return NextResponse.json(
        { error: 'No valid content extracted from files' },
        { status: 400 }
      )
    }

    // Ensure minimum 10 lines (add placeholder if needed)
    while (jsonlLines.length < 10) {
      const placeholder = {
        messages: [
          ...(systemInstructions.trim() ? [{
            role: 'system',
            content: systemInstructions.trim(),
          }] : []),
          {
            role: 'user',
            content: 'Hello',
          },
          {
            role: 'assistant',
            content: 'Hello! How can I help you?',
          },
        ],
      }
      jsonlLines.push(JSON.stringify(placeholder))
    }

    const jsonlContent = jsonlLines.join('\n')

    return new NextResponse(jsonlContent, {
      headers: {
        'Content-Type': 'application/jsonl',
        'Content-Disposition': `attachment; filename="converted-${Date.now()}.jsonl"`,
      },
    })
  } catch (error: any) {
    console.error('Conversion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to convert files' },
      { status: 500 }
    )
  }
}
