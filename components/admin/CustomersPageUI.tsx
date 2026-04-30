"use client";
import PaginationControls from "./PaginationControls";
import EmptyState from "./EmptyState";
import CustomersTable from "./CustomersTable";
import { useI18n } from "../../lib/i18n";

type Customer = {
    id: string;
    name: string;
    email: string;
    whatsapp_e164: string;
    country: string;
    province: string;
    orders_count: number;
    delivered_total: number;
    status: string;
    created_at: string;
};

type CustomersPageUIProps = {
    customers: Customer[];
    count: number;
    limit: number;
    query: string;
    error?: string;
};

export default function CustomersPageUI({
    customers,
    count,
    limit,
    query,
    error,
}: CustomersPageUIProps) {
    const { t } = useI18n();

    if (error) {
        return (
            <div className="rounded-2xl bg-card p-8 border border-borderc shadow-sm flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                    {t("customers.errorLoading")}
                </h3>
                <p className="mt-2 text-sm text-muted max-w-xs">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-4 py-2 bg-zuma-500 text-white rounded-xl text-sm font-semibold hover:bg-zuma-600 transition-colors"
                >
                    {t("customers.tryAgain")}
                </button>
            </div>
        );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        {t("nav.customers")}
                    </p>
                    <h1 className="text-2xl font-semibold text-foreground">
                        {t("customers.title")}
                    </h1>
                    <p className="mt-1 text-sm text-muted">{t("customers.subtitle")}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="rounded-full border border-borderc bg-muted/10 px-3 py-1 text-xs font-semibold text-muted">
                        {t("customers.totalCount", { count: count || 0 })}
                    </span>
                </div>
            </div>

            {!customers || customers.length === 0 ? (
                <EmptyState
                    title={
                        query
                            ? t("customers.noResultsFound")
                            : t("customers.noCustomers")
                    }
                    description={
                        query
                            ? t("customers.noResultsDescription", { query })
                            : t("customers.noCustomersDescription")
                    }
                    ctaLabel={query ? t("customers.clearSearch") : undefined}
                    ctaHref={query ? "/admin/customers" : undefined}
                />
            ) : (
                <>
                    <CustomersTable customers={customers} />
                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-center">
                            <PaginationControls count={count ?? 0} limit={limit} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
