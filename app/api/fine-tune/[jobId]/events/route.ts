import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId
    const searchParams = request.nextUrl.searchParams
    const after = searchParams.get('after')

    // Get job from database
    const dbJob = await prisma.fineTuneJob.findUnique({
      where: { id: jobId },
    })

    if (!dbJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get events from OpenAI
    const options: any = {}
    if (after) {
      options.after = after
    }

    const events = await openai.fineTuning.jobs.listEvents(dbJob.openai_job_id, options)

    return NextResponse.json({
      data: events.data,
      has_more: events.has_more,
    })
  } catch (error: any) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get events' },
      { status: 500 }
    )
  }
}
