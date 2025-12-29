
const { createClient } = require('@supabase/supabase-js')
const url = 'https://kkenwhzmdwzcycoakrhg.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZW53aHptZHd6Y3ljb2FrcmhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwNzg4MCwiZXhwIjoyMDgyMzgzODgwfQ.RRfF7L-WQq0RestXi6V5qQldjxaiK3uOMq7XifTXvmw'
const supabase = createClient(url, key)

async function run() {
    const { data, error } = await supabase.from('offers').select('*').limit(1)
    if (error) console.error(error)
    else console.log('Offer sample:', data[0])
}
run()
