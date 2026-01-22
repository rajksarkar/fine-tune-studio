import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const jobs = await prisma.fineTuneJob.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        trainingFile: true,
        validationFile: true,
      },
    })

    return NextResponse.json(jobs.map(job => ({
      id: job.id,
      openai_job_id: job.openai_job_id,
      status: job.status,
      base_model: job.base_model,
      fine_tuned_model: job.fine_tuned_model,
      training_file: {
        id: job.trainingFile.id,
        filename: job.trainingFile.filename,
      },
      validation_file: job.validationFile ? {
        id: job.validationFile.id,
        filename: job.validationFile.filename,
      } : null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    })))
  } catch (error: any) {
    console.error('Get jobs error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get jobs' },
      { status: 500 }
    )
  }
}
