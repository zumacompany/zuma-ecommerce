-- Create categories table if it doesn't exist (just in case)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT 'bg-gray-200',
    icon TEXT DEFAULT '📦'
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies (if they don't exist, you might need to drop them first or just run this part)
-- Allow public read access
CREATE POLICY "Public read access" ON public.categories
    FOR SELECT TO public USING (true);

-- Allow authenticated users (admin) to insert/update/delete
-- Note: In a real app you'd want to check for admin role
CREATE POLICY "Authenticated users can insert" ON public.categories
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update" ON public.categories
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete" ON public.categories
    FOR DELETE TO authenticated USING (true);

-- Insert sample data
INSERT INTO public.categories (name, slug, color, icon)
VALUES 
    ('Entretenimento', 'entretenimento', 'bg-[#FF5252]', '🎬'),
    ('Gaming', 'gaming', 'bg-gray-200', '🎮'),
    ('Crypto', 'crypto', 'bg-orange-300', '📦'),
    ('Gift Cards', 'gift-cards', 'bg-blue-200', '💳'),
    ('Streaming', 'streaming', 'bg-purple-300', '📺')
ON CONFLICT (slug) DO NOTHING;
