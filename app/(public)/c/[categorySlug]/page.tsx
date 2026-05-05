import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getPublicCategoryBySlug,
  listActivePublicBrandsByCategoryId,
} from "@/src/server/modules/catalog/catalog-public.service";

export const revalidate = 60;

type Props = {
  params: { categorySlug: string };
};

export default async function CategoryPage({ params }: Props) {
  const category = await getPublicCategoryBySlug(params.categorySlug);
  if (!category) notFound();

  const brands = await listActivePublicBrandsByCategoryId(category.id);

  return (
    <main className="py-10">
      <div className="container max-w-[1100px] px-4">
        <Link
          href="/browse"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-foreground mb-4"
        >
          ← Todas as categorias
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
          <p className="mt-2 text-sm text-muted">
            Marcas disponíveis nesta categoria.
          </p>
        </header>

        {brands.length === 0 ? (
          <div className="rounded-2xl border border-borderc bg-card p-10 text-center shadow-sm">
            <div className="text-5xl mb-3">🛍️</div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Sem marcas nesta categoria
            </h2>
            <p className="text-sm text-muted">
              Volte mais tarde para ver novas marcas.
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </main>
  );
}
