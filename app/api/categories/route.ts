import { NextResponse } from 'next/server'
import { supabasePublic } from '../../../lib/supabase/public-server'
import { apiError } from '../../../lib/api/response'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabasePublic
      .from('categories')
      .select('id, name, slug, color, icon')
      .order('name')

    if (error) return apiError(error.message)

    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return apiError(err?.message ?? 'unknown')
  }
}
