import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get('pattern')
    const difficulty = searchParams.get('difficulty')

    let query = supabase.from('problems').select('*')
    
    if (pattern) {
        query = query.eq('pattern', pattern)
    }
    if (difficulty) {
        query = query.eq('difficulty', difficulty)
    }
 
    query = query.order('frequency', { ascending: false })
 
    const { data, error } = await query
   
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}