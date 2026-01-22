import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { modelA, modelB, prompt, instructions } = body

    if (!modelA || !modelB || !prompt) {
      return NextResponse.json(
        { error: 'modelA, modelB, and prompt are required' },
        { status: 400 }
      )
    }

    // Run both models in parallel
    const messagesA: any[] = []
    const messagesB: any[] = []
    
    if (instructions) {
      messagesA.push({ role: 'system', content: instructions })
      messagesB.push({ role: 'system', content: instructions })
    }
    
    messagesA.push({ role: 'user', content: prompt })
    messagesB.push({ role: 'user', content: prompt })

    const [responseA, responseB] = await Promise.all([
      openai.chat.completions.create({
        model: modelA,
        messages: messagesA,
      }),
      openai.chat.completions.create({
        model: modelB,
        messages: messagesB,
      }),
    ])

    const outputA = responseA.choices[0]?.message?.content || ''
    const outputB = responseB.choices[0]?.message?.content || ''

    // Store A/B run in database
    const abRun = await prisma.aBRun.create({
      data: {
        prompt: prompt,
        modelA: modelA,
        outputA: outputA,
        modelB: modelB,
        outputB: outputB,
      },
    })

    return NextResponse.json({
      id: abRun.id,
      outputA: outputA,
      outputB: outputB,
    })
  } catch (error: any) {
    console.error('A/B test error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run A/B test' },
      { status: 500 }
    )
  }
}
