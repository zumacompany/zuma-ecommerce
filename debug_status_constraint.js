const { createClient } = require('@supabase/supabase-js')

const url = 'https://kkenwhzmdwzcycoakrhg.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZW53aHptZHd6Y3ljb2FrcmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwNzg4MCwiZXhwIjoyMDgyMzgzODgwfQ.RRfF7L-WQq0RestXi6V5qQldjxaiK3uOMq7XifTXvmw'

const supabase = createClient(url, key)

async function run() {
    console.log('--- Checking Constraints on Customers Table ---')

    // We can query pg_constraint if we have access, but often we don't.
    // Let's rely on testing values if we can't see the definition.
    // But first, let's try to infer from existing data.

    const { data: customers, error } = await supabase
        .from('customers')
        .select('status')
        .limit(10)

    if (error) {
        console.error('Error fetching customers:', error)
    } else {
        const statuses = new Set(customers.map(c => c.status))
        console.log('Existing statuses in DB:', Array.from(statuses))
    }

    // Let's try to force an update with 'ACTIVE' vs 'active' to see what works
    console.log('\n--- Testing Status Update ---')
    // Get a customer to test on
    const { data: customer } = await supabase.from('customers').select('id, status').limit(1).single()

    if (customer) {
        const testStatus = 'ACTIVE' // Uppercase guess
        console.log(`Trying to update customer ${customer.id} to status '${testStatus}'`)

        const { error: uErr } = await supabase
            .from('customers')
            .update({ status: testStatus })
            .eq('id', customer.id)

        if (uErr) {
            console.log(`Failed with '${testStatus}':`, uErr.message)

            // Try lowercase?
            const testStatus2 = 'active'
            console.log(`Trying to update customer ${customer.id} to status '${testStatus2}'`)
            const { error: uErr2 } = await supabase
                .from('customers')
                .update({ status: testStatus2 })
                .eq('id', customer.id)

            if (uErr2) console.log(`Failed with '${testStatus2}':`, uErr2.message)
            else console.log(`Success with '${testStatus2}'`)

        } else {
            console.log(`Success with '${testStatus}'`)
            // Revert
            await supabase.from('customers').update({ status: customer.status }).eq('id', customer.id)
        }
    }
}

run()
