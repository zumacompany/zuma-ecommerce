const { createClient } = require('@supabase/supabase-js')

const url = 'https://kkenwhzmdwzcycoakrhg.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZW53aHptZHd6Y3ljb2FrcmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwNzg4MCwiZXhwIjoyMDgyMzgzODgwfQ.RRfF7L-WQq0RestXi6V5qQldjxaiK3uOMq7XifTXvmw'

const supabase = createClient(url, key)

async function run() {
    console.log('--- Checking foreign keys for customers ---')
    // We can query information_schema if we had a direct connection, 
    // but with supabase-js we can try to delete a test offer if it exists or just check structure

    const { data: customers, error: err } = await supabase.from('customers').select('*').limit(1)
    if (err) {
        console.error('Error fetching customers:', err)
    } else {
        console.log('Offer sample:', customers[0])
    }

    // Check if order_items has an offer_id
    const { data: orderItems, error: oiErr } = await supabase.from('order_items').select('*').limit(1)
    if (oiErr) {
        console.error('Error fetching order_items:', oiErr)
    } else {
        console.log('Order Item sample:', orderItems[0])
    }
}

run()
