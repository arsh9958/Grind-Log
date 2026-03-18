import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Existing POST handler
export async function POST(request: Request) {
  const body = await request.json()
  const { userId, problemId, confidence, notes } = body

  const getNextReviewDate = (confidence: number): string => {
    const daysMap: { [key: number]: number } = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 }
    const days = daysMap[confidence] || 7
    
    const date = new Date()
    date.setDate(date.getDate() + days)
    
    return date.toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      problem_id: problemId,
      confidence: confidence || 3,
      notes: notes || '',
      next_review_date: getNextReviewDate(confidence || 3),
      solved_date: new Date().toISOString().split('T')[0]
    })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// ✅ ADD THIS: GET handler to fetch user's progress
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .order('solved_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}