const { createClient } = require('@supabase/supabase-js')

const url = 'https://kkenwhzmdwzcycoakrhg.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZW53aHptZHd6Y3ljb2FrcmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwNzg4MCwiZXhwIjoyMDgyMzgzODgwfQ.RRfF7L-WQq0RestXi6V5qQldjxaiK3uOMq7XifTXvmw'

const supabase = createClient(url, key)

async function run() {
    console.log('--- Checking triggers ---')
    // We can't easily query triggers via supabase-js unless we have an RPC that does it.
    // But we can check for common function names.

    // Let's try to query pg_trigger if we have access
    const { data: triggers, error: tErr } = await supabase
        .from('pg_trigger')
        .select('tgname')
        .limit(10)

    if (tErr) {
        console.log('Cannot query pg_trigger directly:', tErr.message)
    } else {
        console.log('Triggers:', triggers)
    }

    // Instead, let's look for a function that sounds like 'update_customer_stats'
    const { data: procs, error: pErr } = await supabase
        .from('pg_proc')
        .select('proname')
        .ilike('proname', '%customer%')

    if (pErr) {
        console.log('Cannot query pg_proc directly:', pErr.message)
    } else {
        console.log('Customer functions:', procs)
    }
}

run()
