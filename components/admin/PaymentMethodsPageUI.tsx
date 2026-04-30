"use client";

import { useI18n } from "../../lib/i18n";
import PaymentMethodsAdmin from "./PaymentMethodsAdmin";

export default function PaymentMethodsPageUI() {
    const { t } = useI18n();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">
                    {t("payments.title")}
                </h1>
                <p className="mt-2 text-sm text-muted">
                    {t("payments.subtitle")}
                </p>
            </div>

            <PaymentMethodsAdmin />
        </div>
    );
}
