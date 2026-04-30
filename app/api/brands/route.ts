import { NextResponse } from 'next/server'
import { supabasePublic } from '../../../lib/supabase/public-server'
import { apiError } from '../../../lib/api/response'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabasePublic
      .from('brands')
      .select('id, name, slug, logo_path, category_id')
      .eq('status', 'active')
      .order('name')

    if (error) return apiError(error.message)

    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return apiError(err?.message ?? 'unknown')
  }
}
