import Link from "next/link";
import Image from "next/image";
import {
  listActivePublicBrands,
  listPublicCategories,
} from "@/src/server/modules/catalog/catalog-public.service";

export const revalidate = 60;

export default async function BrowsePage() {
  const [brands, categories] = await Promise.all([
    listActivePublicBrands(),
    listPublicCategories(),
  ]);

  if (brands.length === 0) {
    return (
      <main className="py-12">
        <div className="container max-w-[1100px] px-4">
          <div className="rounded-2xl border border-borderc bg-card p-10 text-center shadow-sm">
            <div className="text-5xl mb-3">🛍️</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Sem marcas disponíveis
            </h1>
            <p className="text-sm text-muted">
              Volte mais tarde para ver as nossas marcas.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const brandsByCategory = new Map<string, typeof brands>();
  const uncategorized: typeof brands = [];

  for (const brand of brands) {
    if (brand.category_id && categoryMap.has(brand.category_id)) {
      const list = brandsByCategory.get(brand.category_id) ?? [];
      list.push(brand);
      brandsByCategory.set(brand.category_id, list);
    } else {
      uncategorized.push(brand);
    }
  }

  const sectionsWithBrands = categories
    .map((cat) => ({
      category: cat,
      brands: brandsByCategory.get(cat.id) ?? [],
    }))
    .filter((section) => section.brands.length > 0);

  return (
    <main className="py-10">
      <div className="container max-w-[1200px] px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Marcas</h1>
          <p className="mt-2 text-sm text-muted">
            Escolha uma marca para ver as ofertas disponíveis.
          </p>
        </header>

        <div className="space-y-10">
          {sectionsWithBrands.map(({ category, brands: catBrands }) => (
            <section key={category.id}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">{category.name}</h2>
                <Link
                  href={`/c/${category.slug}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Ver categoria →
                </Link>
              </div>
              <BrandGrid brands={catBrands} />
            </section>
          ))}

          {uncategorized.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">Outras marcas</h2>
              <BrandGrid brands={uncategorized} />
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function BrandGrid({
  brands,
}: {
  brands: { id: string; name: string; slug: string; logo_path: string | null }[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {brands.map((b) => (
        <Link
          key={b.id}
          href={`/b/${b.slug}`}
          className="group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-borderc bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 min-h-[140px]"
        >
          <div className="h-14 w-full flex items-center justify-center relative">
            {b.logo_path ? (
              <Image
                src={b.logo_path}
                alt={`${b.name} logo`}
                fill
                sizes="(max-width: 768px) 160px, 200px"
                className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {b.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="text-sm font-semibold text-center text-foreground/80 group-hover:text-primary transition-colors truncate w-full">
            {b.name}
          </div>
        </Link>
      ))}
    </div>
  );
}
