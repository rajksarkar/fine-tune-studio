import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId

    // Get job from database
    const dbJob = await prisma.fineTuneJob.findUnique({
      where: { id: jobId },
      include: {
        trainingFile: true,
        validationFile: true,
      },
    })

    if (!dbJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Refresh status from OpenAI
    try {
      const openaiJob = await openai.fineTuning.jobs.retrieve(dbJob.openai_job_id)

      // Update database with latest status
      const updatedJob = await prisma.fineTuneJob.update({
        where: { id: jobId },
        data: {
          status: openaiJob.status,
          fine_tuned_model: openaiJob.fine_tuned_model || null,
        },
        include: {
          trainingFile: true,
          validationFile: true,
        },
      })

      return NextResponse.json({
        id: updatedJob.id,
        openai_job_id: updatedJob.openai_job_id,
        status: updatedJob.status,
        base_model: updatedJob.base_model,
        fine_tuned_model: updatedJob.fine_tuned_model,
        training_file: {
          id: updatedJob.trainingFile.id,
          filename: updatedJob.trainingFile.filename,
        },
        validation_file: updatedJob.validationFile ? {
          id: updatedJob.validationFile.id,
          filename: updatedJob.validationFile.filename,
        } : null,
        createdAt: updatedJob.createdAt,
        updatedAt: updatedJob.updatedAt,
      })
    } catch (openaiError: any) {
      // If OpenAI API fails, return database state
      console.error('OpenAI API error:', openaiError)
      return NextResponse.json({
        id: dbJob.id,
        openai_job_id: dbJob.openai_job_id,
        status: dbJob.status,
        base_model: dbJob.base_model,
        fine_tuned_model: dbJob.fine_tuned_model,
        training_file: {
          id: dbJob.trainingFile.id,
          filename: dbJob.trainingFile.filename,
        },
        validation_file: dbJob.validationFile ? {
          id: dbJob.validationFile.id,
          filename: dbJob.validationFile.filename,
        } : null,
        createdAt: dbJob.createdAt,
        updatedAt: dbJob.updatedAt,
        error: 'Failed to refresh from OpenAI API',
      })
    }
  } catch (error: any) {
    console.error('Get job error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get job' },
      { status: 500 }
    )
  }
}
