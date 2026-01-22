import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get base models
    const baseModels = ['gpt-4o-mini', 'gpt-4o']

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
