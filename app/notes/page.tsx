import { createClient } from '../../lib/supabase/server';

export default async function Notes() {
  if (!process.env.SUPABASE_URL) return <pre>Supabase not configured</pre>

  const supabase = await createClient();
  const { data: notes } = await supabase.from("notes").select();

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}