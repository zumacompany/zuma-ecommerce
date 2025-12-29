const { createClient } = require('@supabase/supabase-js')

const url = 'https://kkenwhzmdwzcycoakrhg.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZW53aHptZHd6Y3ljb2FrcmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwNzg4MCwiZXhwIjoyMDgyMzgzODgwfQ.RRfF7L-WQq0RestXi6V5qQldjxaiK3uOMq7XifTXvmw'

const supabase = createClient(url, key)

async function run() {
    console.log('--- Checking Triggers on Customers Table ---')

    // We can't query information_schema directly with supabase-js easily unless we have a function for it.
    // I'll assume we don't have a helper function ready.
    // I'll try to invoke a raw SQL query if possible via RPC or just infer from behavior.

    // Actually, I can use the 'get_function_def' RPC if checking functions, but for triggers...
    // Let's rely on the error message details.

    console.log('Trying to update status to "active" again on a known customer.')
    const { data: c } = await supabase.from('customers').select('id, status').limit(1).single()
    if (!c) {
        console.log('No customer found')
        return
    }
    console.log('Current status:', c.status)

    const { error } = await supabase.from('customers').update({ status: 'active' }).eq('id', c.id)
    if (error) {
        console.log('Update "active" failed:', error.message)
    } else {
        console.log('Update "active" succeeded.')
    }

    console.log('Trying "inactive"...')
    const { error: errInactive } = await supabase.from('customers').update({ status: 'inactive' }).eq('id', c.id)
    if (errInactive) {
        console.log('Update "inactive" failed:', errInactive.message)
    } else {
        console.log('Update "inactive" succeeded.')
    }

    console.log('Trying "Active" (Mixed case)...')
    const { error: errActive } = await supabase.from('customers').update({ status: 'Active' }).eq('id', c.id)
    if (errActive) {
        console.log('Update "Active" failed (EXPECTED):', errActive.message)
    } else {
        console.log('Update "Active" succeeded (UNEXPECTED).')
    }

}

run()
