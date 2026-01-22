import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get base models (for inference/testing)
    const baseModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']
    
    // Get fine-tunable models (for training)
    const fineTunableModels = [
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-1106',
      'gpt-3.5-turbo-0613',
      'gpt-4-0613',
      'babbage-002',
      'davinci-002'
    ]

    // Get all fine-tuned models from completed jobs
    const jobs = await prisma.fineTuneJob.findMany({
      where: {
        fine_tuned_model: { not: null },
      },
      select: {
        fine_tuned_model: true,
        base_model: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const fineTunedModels = jobs
      .filter(job => job.fine_tuned_model)
      .map(job => ({
        id: job.fine_tuned_model!,
        base_model: job.base_model,
        createdAt: job.createdAt,
      }))

    return NextResponse.json({
      base: baseModels,
      fine_tunable: fineTunableModels,
      fine_tuned: fineTunedModels,
    })
  } catch (error: any) {
    console.error('Get models error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get models' },
      { status: 500 }
    )
  }
}
