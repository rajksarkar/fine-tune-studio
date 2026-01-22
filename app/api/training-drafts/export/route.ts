import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { system_instructions } = body

    // Get all training drafts
    const drafts = await prisma.trainingDraft.findMany({
      orderBy: { createdAt: 'asc' },
    })

    if (drafts.length === 0) {
      return NextResponse.json(
        { error: 'No training drafts to export' },
        { status: 400 }
      )
    }

    // Convert to JSONL format
    const jsonlLines = drafts.map(draft => {
      const messages: any[] = []
      
      if (system_instructions) {
        messages.push({
          role: 'system',
          content: system_instructions,
        })
      }
      
      messages.push({
        role: 'user',
        content: draft.prompt,
      })
      
      messages.push({
        role: 'assistant',
        content: draft.ideal_answer,
      })

      return JSON.stringify({ messages })
    })

    const jsonlContent = jsonlLines.join('\n')

    // Return as downloadable file
    return new NextResponse(jsonlContent, {
      headers: {
        'Content-Type': 'application/jsonl',
        'Content-Disposition': `attachment; filename="training-drafts-${Date.now()}.jsonl"`,
      },
    })
  } catch (error: any) {
    console.error('Export drafts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export drafts' },
      { status: 500 }
    )
  }
}
