import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    const { winner, notes } = body

    const abRun = await prisma.aBRun.update({
      where: { id },
      data: {
        winner: winner || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({
      id: abRun.id,
      winner: abRun.winner,
      notes: abRun.notes,
    })
  } catch (error: any) {
    console.error('Update A/B run error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update A/B run' },
      { status: 500 }
    )
  }
}
