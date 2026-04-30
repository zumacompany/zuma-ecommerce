INSERT INTO public.categories (name, slug, color, icon)
VALUES ('Sem Categoria', 'sem-categoria', 'bg-gray-200', '📁')
ON CONFLICT (slug) DO NOTHING;
