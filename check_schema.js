
const { createClient } = require('@supabase/supabase-js')

const url = 'https://kkenwhzmdwzcycoakrhg.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZW53aHptZHd6Y3ljb2FrcmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwNzg4MCwiZXhwIjoyMDgyMzgzODgwfQ.RRfF7L-WQq0RestXi6V5qQldjxaiK3uOMq7XifTXvmw'

const supabase = createClient(url, key)

async function run() {
    console.log('--- Checking Orders ---')
    const { data: orders, error: oErr } = await supabase.from('orders').select('*').limit(1)
    if (oErr) console.error(oErr)
    else console.log('Orders columns:', Object.keys(orders[0] || {}))

    console.log('\n--- Checking Order Items ---')
    const { data: items, error: iErr } = await supabase.from('order_items').select('*').limit(1)
    if (iErr) console.error(iErr)
    else console.log('Order Items columns:', Object.keys(items[0] || {}))

    console.log('\n--- Checking RPCs ---')
    const { data: rpcs, error: rErr } = await supabase.rpc('create_order', {
        p_customer_name: 'Test',
        p_items: []
    })
    console.log('RPC result:', rpcs)
    console.log('RPC error:', rErr)
}

run()
