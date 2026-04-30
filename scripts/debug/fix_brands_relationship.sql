-- Ensure category_id is correct type
ALTER TABLE public.brands 
ALTER COLUMN category_id TYPE uuid USING category_id::uuid;

-- Updates invalid or missing category_ids to NULL to avoid constraint errors
UPDATE public.brands
SET category_id = NULL
WHERE category_id IS NOT NULL 
  AND category_id NOT IN (SELECT id FROM public.categories);

-- Add the Foreign Key constraint
ALTER TABLE public.brands 
DROP CONSTRAINT IF EXISTS brands_category_id_fkey;

ALTER TABLE public.brands
ADD CONSTRAINT brands_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES public.categories(id)
ON DELETE SET NULL;
