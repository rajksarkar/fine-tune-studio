import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const drafts = await prisma.trainingDraft.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(drafts)
  } catch (error: any) {
    console.error('Get drafts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get drafts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, ideal_answer } = body

    if (!prompt || !ideal_answer) {
      return NextResponse.json(
        { error: 'prompt and ideal_answer are required' },
        { status: 400 }
      )
    }

    const draft = await prisma.trainingDraft.create({
      data: {
        prompt,
        ideal_answer,
      },
    })

    return NextResponse.json(draft)
  } catch (error: any) {
    console.error('Create draft error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create draft' },
      { status: 500 }
    )
  }
}
