import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { training_file_id, validation_file_id, model } = body

    if (!training_file_id || !model) {
      return NextResponse.json(
        { error: 'training_file_id and model are required' },
        { status: 400 }
      )
    }

    // Get file IDs from database
    const trainingFile = await prisma.fineTuneFile.findUnique({
      where: { id: training_file_id },
    })

    if (!trainingFile) {
      return NextResponse.json(
        { error: 'Training file not found' },
        { status: 404 }
      )
    }

    let validationFileId: string | undefined
    if (validation_file_id) {
      const validationFile = await prisma.fineTuneFile.findUnique({
        where: { id: validation_file_id },
      })
      if (!validationFile) {
        return NextResponse.json(
          { error: 'Validation file not found' },
          { status: 404 }
        )
      }
      validationFileId = validationFile.openai_file_id
    }

    // Create fine-tuning job with OpenAI
    const jobParams: any = {
      model: model,
      training_file: trainingFile.openai_file_id,
    }
    if (validationFileId) {
      jobParams.validation_file = validationFileId
    }

    // Validate that the model supports fine-tuning
    // Allow base models that support fine-tuning, or fine-tuned models (starting with "ft:")
    const fineTunableModels = [
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-1106',
      'gpt-3.5-turbo-0613',
      'gpt-4-0613',
      'babbage-002',
      'davinci-002'
    ]
    
    const isFineTunedModel = model.startsWith('ft:')
    const isBaseModel = fineTunableModels.includes(model)
    
    if (!isBaseModel && !isFineTunedModel) {
      return NextResponse.json(
        { 
          error: `Model ${model} is not available for fine-tuning. Use a base model (${fineTunableModels.join(', ')}) or a fine-tuned model (starting with "ft:")` 
        },
        { status: 400 }
      )
    }

    const openaiJob = await openai.fineTuning.jobs.create(jobParams)

    // Store job in database
    const dbJob = await prisma.fineTuneJob.create({
      data: {
        openai_job_id: openaiJob.id,
        base_model: model,
        training_file_id: training_file_id,
        validation_file_id: validation_file_id || null,
        status: openaiJob.status,
        fine_tuned_model: openaiJob.fine_tuned_model || null,
      },
    })

    return NextResponse.json({
      id: dbJob.id,
      openai_job_id: dbJob.openai_job_id,
      status: dbJob.status,
      base_model: dbJob.base_model,
      fine_tuned_model: dbJob.fine_tuned_model,
      createdAt: dbJob.createdAt,
    })
  } catch (error: any) {
    console.error('Fine-tune job creation error:', error)
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to create fine-tuning job'
    
    if (error.message?.includes('not available for fine-tuning')) {
      errorMessage = `${error.message}. Supported models: gpt-3.5-turbo, gpt-3.5-turbo-1106, gpt-3.5-turbo-0613, gpt-4-0613, babbage-002, davinci-002`
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: error.status || 500 }
    )
  }
}
