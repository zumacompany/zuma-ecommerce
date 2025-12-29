
const { createClient } = require('@supabase/supabase-js')

const url = 'https://kkenwhzmdwzcycoakrhg.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZW53aHptZHd6Y3ljb2FrcmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwNzg4MCwiZXhwIjoyMDgyMzgzODgwfQ.RRfF7L-WQq0RestXi6V5qQldjxaiK3uOMq7XifTXvmw'

const supabase = createClient(url, key)

async function run() {
    const { data, error } = await supabase.rpc('get_function_def', { name: 'create_order' })
    // If get_function_def doesn't exist, we'll try a raw query via rpc to a custom helper if we have one.
    // Actually, I'll try to use the 'pg_get_functiondef' via a custom RPC if I can find one.

    if (error) {
        console.log('get_function_def failed, trying manual query...')
        // Many supabase setups have a 'exec_sql' or similar, but let's try something legitimate.
        // I can query pg_proc via a select if I have permissions.
        const { data: proc, error: pErr } = await supabase
            .from('pg_proc')
            .select('proname, prosrc')
            .eq('proname', 'create_order')

        if (pErr) console.error('pg_proc error:', pErr)
        else {
            proc.forEach(p => {
                console.log('Function:', p.proname)
                console.log('Source:', p.prosrc)
            })
        }
    } else {
        console.log('Function Def:', data)
    }
}

run()
