"use client";

import { useI18n } from "../../lib/i18n";
import DigitalCodesManager from "./DigitalCodesManager";
import CatalogFlowBar from "./CatalogFlowBar";

export default function InventoryPageUI() {
    const { t } = useI18n();

    return (
        <div className="space-y-6">
            <CatalogFlowBar current="inventory" />
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    {t("nav.inventory")}
                </p>
                <h1 className="text-2xl font-semibold text-foreground">
                    {t("inventory.title")}
                </h1>
                <p className="mt-2 text-sm text-muted">
                    {t("inventory.subtitle")}
                </p>
            </div>

            <DigitalCodesManager />
        </div>
    );
}
