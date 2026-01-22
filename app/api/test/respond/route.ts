import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, instructions, input } = body

    if (!model || !input) {
      return NextResponse.json(
        { error: 'model and input are required' },
        { status: 400 }
      )
    }

    // Use Chat Completions API for inference
    const messages: any[] = []
    if (instructions) {
      messages.push({ role: 'system', content: instructions })
    }
    messages.push({ role: 'user', content: input })

    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
    })

    const outputText = response.choices[0]?.message?.content || ''

    // Store test run in database
    await prisma.testRun.create({
      data: {
        prompt: input,
        model: model,
        output: outputText,
      },
    })

    return NextResponse.json({
      output: outputText,
    })
  } catch (error: any) {
    console.error('Test respond error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get response' },
      { status: 500 }
    )
  }
}
