"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "../lib/i18n";

type Category = {
    id: string;
    name: string;
    slug: string;
}

type Brand = {
    id: string;
    name: string;
    slug: string;
    logo_path: string | null;
    category_id: string;
}

type Props = {
    data: {
        categories: Category[];
        brands: Brand[];
    } | null;
}

export default function CategoryRowsClient({ data }: Props) {
    const { t } = useI18n();
    const categories = data?.categories ?? [];
    const brands = data?.brands ?? [];

    const visibleCategories = categories.filter(cat =>
        brands.some(b => b.category_id === cat.id) && cat.slug !== 'sem-categoria'
    );

    if (visibleCategories.length === 0) {
        return null;
    }

    return (
        <div className="bg-muted/10 py-12">
            <div className="container max-w-[1300px] px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {visibleCategories.map((cat) => {
                        // Filter brands for this category
                        const catBrands = brands.filter(b => b.category_id === cat.id);

                        return (
                            <div key={cat.id} className="bg-card rounded-3xl p-6 md:p-8 border border-borderc shadow-sm flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">{cat.name}</h2>
                                    <Link
                                        href={`/c/${cat.slug}`}
                                        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
                                    >
                                        {t('website.viewAll')}
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {catBrands.slice(0, 6).map((brand) => (
                                        <Link
                                            key={brand.id}
                                            href={`/b/${brand.slug}`}
                                            className="group relative flex flex-col bg-muted/20 hover:bg-card/50 border border-transparent hover:border-borderc rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                        >
                                            {/* Card Image Area */}
                                            <div className="aspect-[4/3] flex items-center justify-center p-4 relative z-10">
                                                {brand.logo_path ? (
                                                    <img
                                                        src={brand.logo_path}
                                                        alt={brand.name}
                                                        className="max-w-full max-h-full object-contain drop-shadow-sm filter grayscale group-hover:grayscale-0 transition-all duration-300"
                                                    />
                                                ) : (
                                                    <span className="text-2xl font-bold text-muted/30 group-hover:text-primary/50 transition-colors">
                                                        {brand.name.charAt(0)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Brand Name (Overlay like) or Bottom */}
                                            <div className="px-3 pb-3 pt-0 text-center relative z-10">
                                                <span className="text-xs font-semibold text-foreground/70 group-hover:text-foreground transition-colors line-clamp-1">
                                                    {brand.name}
                                                </span>
                                            </div>

                                            {/* Gradient Background on Hover */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
