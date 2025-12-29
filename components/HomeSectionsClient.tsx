"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Brand = { id: string; name: string; slug: string; logo_path?: string | null };

// Mock data setup or fetching logic would technically go here. 
// For this visual refresh, we will fetch all brands and filter them client-side or assume mapping for demo.
// Since we don't have tags on brands yet, we will just display all filtered by name or random for now 
// to match the visual layout structure.

export default function HomeSectionsClient() {
    const [brands, setBrands] = useState<Brand[]>([]);

    useEffect(() => {
        fetch('/api/brands').then(r => r.json()).then(json => {
            if (json.data) setBrands(json.data);
        });
    }, []);

    const Section = ({ title, bgClass = "bg-primary" }: { title: string, bgClass?: string }) => (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-tight">{title}</h2>
                <Link href="/browse" className="text-xs font-bold text-muted uppercase hover:text-primary">
                    Ver Tudo &gt;
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Placeholder cards to simulate the specific brands shown in mockup */}
                <div className={`aspect-[2/1] rounded-xl ${bgClass} p-6 flex flex-col justify-center items-center text-white shadow-md relative overflow-hidden group cursor-pointer`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <span className="relative z-10 font-bold text-2xl">Brand 1</span>
                </div>
                <div className={`aspect-[2/1] rounded-xl ${bgClass === "bg-primary" ? "bg-green-600" : "bg-blue-900"} p-6 flex flex-col justify-center items-center text-white shadow-md relative overflow-hidden group cursor-pointer`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                    <span className="relative z-10 font-bold text-2xl">Brand 2</span>
                </div>
            </div>
        </div>
    );

    return (
        <section className="container max-w-[1000px] px-4">
            <Section title="GIFT CARDS" bgClass="bg-blue-500" />
            <Section title="SERVIÇOS DE STREAMING" bgClass="bg-black" />
            <Section title="MOEDAS DIGITAIS" bgClass="bg-blue-600" />
        </section>
    );
}
