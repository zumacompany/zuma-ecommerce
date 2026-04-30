"use client";

import { useI18n } from "../../lib/i18n";
import CategoriesManager from "./CategoriesManager";
import CatalogFlowBar from "./CatalogFlowBar";

type Category = {
    id: string;
    name: string;
    slug: string;
    color?: string;
    icon?: string;
    created_at: string;
};

interface CategoriesPageUIProps {
    categories: Category[];
}

export default function CategoriesPageUI({ categories }: CategoriesPageUIProps) {
    const { t } = useI18n();

    return (
        <div className="space-y-6">
            <CatalogFlowBar current="categories" />
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {t("nav.categories")}
                </p>
                <h1 className="text-2xl font-semibold text-foreground">
                    {t("categories.title")}
                </h1>
                <p className="mt-1 text-sm text-muted">
                    {t("categories.subtitle")}
                </p>
            </div>

            <CategoriesManager initialCategories={categories || []} />
        </div>
    );
}
