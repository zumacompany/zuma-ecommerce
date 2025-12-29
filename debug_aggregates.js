const { createClient } = require('@supabase/supabase-js')

const url = 'https://kkenwhzmdwzcycoakrhg.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZW53aHptZHd6Y3ljb2FrcmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwNzg4MCwiZXhwIjoyMDgyMzgzODgwfQ.RRfF7L-WQq0RestXi6V5qQldjxaiK3uOMq7XifTXvmw'

const supabase = createClient(url, key)

async function run() {
    console.log('--- Checking customer_aggregates ---')
    const { data, error } = await supabase
        .from('customer_aggregates')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching from customer_aggregates:', error.message)
    } else {
        console.log('Sample from customer_aggregates:', data[0])
    }

    // Also check orders table structure
    const { data: order, error: oErr } = await supabase
        .from('orders')
        .select('*')
        .limit(1)

    if (oErr) console.error('Error fetching from orders:', oErr.message)
    else console.log('Sample from orders:', order[0])
}

run()
