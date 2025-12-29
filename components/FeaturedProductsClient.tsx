"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Brand = {
    id: string;
    name: string;
    slug: string;
    logo_path?: string | null;
}

type Offer = {
    id: string;
    price: number;
    denomination_value: number;
    denomination_currency: string;
    brands: Brand;
}

export default function FeaturedProductsClient() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/featured-products')
            .then((r) => r.json())
            .then((json) => {
                if (json.data) setOffers(json.data);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <section className="mt-8 mb-12">
            <div className="container max-w-[1200px] px-4">
                <div className="h-8 w-48 bg-muted/10 rounded mb-4 animate-pulse" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-muted/10 rounded-lg animate-pulse" />)}
                </div>
            </div>
        </section>
    );

    if (offers.length === 0) return null;

    return (
        <section className="mt-8 mb-12">
            <div className="container max-w-[1200px] px-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold tracking-tight">Featured Products</h2>
                    <Link href="/browse" className="text-sm font-medium text-primary hover:underline">View all</Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {offers.map((offer) => (
                        <Link
                            key={offer.id}
                            href={`/b/${offer.brands.slug}`} // Linking to brand page for now, or could link to specific checkout if we had an offer page
                            className="group flex flex-col bg-card border border-borderc rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            <div className="aspect-square p-4 flex items-center justify-center bg-muted/5 group-hover:bg-primary/5 transition-colors relative">
                                {/* Card Value Badge */}
                                <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {offer.denomination_currency} {offer.denomination_value}
                                </div>

                                {offer.brands.logo_path ? (
                                    <img src={offer.brands.logo_path} alt={offer.brands.name} className="max-w-full max-h-full object-contain drop-shadow-sm" />
                                ) : (
                                    <span className="text-2xl font-bold text-muted/30">{offer.brands.name.charAt(0)}</span>
                                )}
                            </div>

                            <div className="p-3 flex flex-col gap-1">
                                <h3 className="text-xs font-medium text-muted-foreground truncate">{offer.brands.name}</h3>
                                <div className="text-sm font-bold text-foreground">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MZN' }).format(offer.price)}
                                </div>
                                <button className="mt-2 w-full py-1.5 bg-primary text-primary-fg text-xs font-bold rounded hover:bg-primary/90 transition-colors">
                                    Buy
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
