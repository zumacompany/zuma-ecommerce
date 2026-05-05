"use client";
import { useI18n } from "../../lib/i18n";

export default function OutOfStockBadge({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 ${className}`}
    >
      {t("offers.stock.outOfStockBadge")}
    </span>
  );
}
