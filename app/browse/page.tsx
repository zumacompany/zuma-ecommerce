"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Brand = { id: string; name: string; slug: string; logo_path?: string | null };

export default function BrowsePage() {
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch('/api/brands')
            .then((res) => res.json())
            .then((json) => {
                if (json.data) {
                    setBrands(json.data);
                    setFilteredBrands(json.data);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!search) {
            setFilteredBrands(brands);
        } else {
            const lower = search.toLowerCase();
            setFilteredBrands(brands.filter(b => b.name.toLowerCase().includes(lower)));
        }
    }, [search, brands]);

    return (
        <main className="min-h-screen py-8">
            <div className="container max-w-[1200px] px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">Browse Products</h1>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-md bg-muted/10 border border-transparent focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all outline-none placeholder:text-muted"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-32 rounded-md bg-muted/10 animate-pulse" />
                        ))}
                    </div>
                ) : filteredBrands.length === 0 ? (
                    <div className="text-center py-12 text-muted">
                        No products found matching "{search}"
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {filteredBrands.map((b) => (
                            <Link
                                key={b.id}
                                href={`/b/${b.slug}`}
                                className="flex flex-col items-center justify-center gap-3 p-6 rounded-md border border-borderc bg-card hover:border-primary/50 hover:shadow-sm transition-all active:scale-[0.98]"
                            >
                                <div className="h-12 w-full flex items-center justify-center">
                                    {b.logo_path ? (
                                        <img src={b.logo_path} alt={b.name} className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <span className="text-xl font-bold text-muted/30">{b.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="text-sm font-semibold text-center truncate w-full">{b.name}</div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
