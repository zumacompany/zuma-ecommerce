"use client";

import { useI18n } from "../../lib/i18n";
import BrandsManager from "./BrandsManager";
import CatalogFlowBar from "./CatalogFlowBar";

type Brand = {
    id: string;
    name: string;
    slug: string;
    category_id: string;
    logo_path: string | null;
    description_md: string | null;
    status: "active" | "inactive";
    created_at: string;
    category: { id: string; name: string } | null;
};

type Category = {
    id: string;
    name: string;
    slug: string;
};

interface BrandsPageUIProps {
    initialBrands: Brand[];
    categories: Category[];
}

export default function BrandsPageUI({
    initialBrands,
    categories,
}: BrandsPageUIProps) {
    const { t } = useI18n();

    return (
        <div className="space-y-6">
            <CatalogFlowBar current="brands" />
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {t("nav.brands")}
                </p>
                <h1 className="text-2xl font-semibold text-foreground">
                    {t("brands.title")}
                </h1>
                <p className="mt-1 text-sm text-muted">
                    {t("brands.subtitle")}
                </p>
            </div>

            <BrandsManager initialBrands={initialBrands} categories={categories} />
        </div>
    );
}
