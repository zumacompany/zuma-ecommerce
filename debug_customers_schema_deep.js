const { createClient } = require('@supabase/supabase-js')

const url = 'https://kkenwhzmdwzcycoakrhg.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZW53aHptZHd6Y3ljb2FrcmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwNzg4MCwiZXhwIjoyMDgyMzgzODgwfQ.RRfF7L-WQq0RestXi6V5qQldjxaiK3uOMq7XifTXvmw'

const supabase = createClient(url, key)

async function run() {
    console.log('--- Checking Customers Table Definition ---')
    // Get one row to see columns
    const { data: customer, error } = await supabase.from('customers').select('*').limit(1)
    if (error) {
        console.error('Error fetching customer:', error)
        return
    }
    console.log('Columns:', Object.keys(customer[0] || {}))

    // Check for unique constraints using RPC if possible, or just inference
    // We'll test unique constraint violation via update
    console.log('\n--- Testing Unique Constraint (Email) ---')
    // Determine a duplicate email
    // First, get two different customers
    const { data: customers } = await supabase.from('customers').select('id, email').limit(2)
    if (customers && customers.length >= 2) {
        const c1 = customers[0]
        const c2 = customers[1]
        console.log(`Trying to update Customer 1 (${c1.id}) with Customer 2's email (${c2.email})`)

        const { error: uErr } = await supabase
            .from('customers')
            .update({ email: c2.email })
            .eq('id', c1.id)

        if (uErr) {
            console.log('Caught expected error (or not?):', uErr.message, uErr.code)
        } else {
            console.log('WARNING: Update succeeded - No unique constraint on email?')
            // Revert
            await supabase.from('customers').update({ email: c1.email }).eq('id', c1.id)
        }
    } else {
        console.log('Not enough customers to test unique constraint')
    }
}

run()
