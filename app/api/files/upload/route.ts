import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { validateJSONL } from '@/lib/jsonl-validator'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate JSONL format
    const content = await file.text()
    const validation = validateJSONL(content, 10)

    if (!validation.valid) {
      return NextResponse.json({
        error: 'Invalid JSONL file',
        details: validation.errors
      }, { status: 400 })
    }

    // Convert File to format expected by OpenAI SDK
    // The SDK accepts File objects, but in Node.js we need to create a File-like object
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Create a File object for OpenAI SDK
    const fileForUpload = new File([buffer], file.name, { type: 'application/jsonl' })

    // Upload to OpenAI
    const openaiFile = await openai.files.create({
      file: fileForUpload,
      purpose: 'fine-tune',
    })

    // Store in database
    const dbFile = await prisma.fineTuneFile.create({
      data: {
        filename: file.name,
        openai_file_id: openaiFile.id,
        bytes: file.size,
      },
    })

    return NextResponse.json({
      id: dbFile.id,
      filename: dbFile.filename,
      openai_file_id: dbFile.openai_file_id,
      bytes: dbFile.bytes,
    })
  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
