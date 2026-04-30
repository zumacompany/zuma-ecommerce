"use client";

import { useI18n } from "../../lib/i18n";
import SiteAdmin from "./SiteAdmin";

export default function SiteSettingsPageUI() {
    const { t } = useI18n();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">
                    {t("site.title")}
                </h1>
                <p className="mt-2 text-sm text-muted">
                    {t("site.subtitle")}
                </p>
            </div>

            <SiteAdmin />
        </div>
    );
}
