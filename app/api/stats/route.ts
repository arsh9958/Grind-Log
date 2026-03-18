import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const { data: progress, error } = await supabase
    .from('user_progress')
    .select(`
      *,
      problems (pattern, difficulty)
    `)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!progress || progress.length === 0) {
    return NextResponse.json({
      totalSolved: 0,
      byPattern: {},
      byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }
    })
  }

  const stats = {
    totalSolved: progress.length,
    byPattern: {} as Record<string, number>,
    byDifficulty: { Easy: 0, Medium: 0, Hard: 0 }
  }

  progress.forEach((p: any) => {
    const pattern = p.problems.pattern
    const difficulty = p.problems.difficulty

    stats.byPattern[pattern] = (stats.byPattern[pattern] || 0) + 1
    stats.byDifficulty[difficulty]++
  })

  return NextResponse.json(stats)
}