export const card = "rounded-xl bg-card border border-borderc shadow-card";
export const cardHeader = "flex items-center justify-between px-5 py-4 border-b border-borderc";
export const cardBody = "px-5 py-4";

export const btnBase =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
export const btnPrimary = `${btnBase} bg-zuma-500 text-white hover:bg-zuma-600`;
export const btnSecondary = `${btnBase} bg-card text-text border border-borderc hover:bg-zuma-50/40 dark:hover:bg-white/5`;
export const btnGhost = `${btnBase} bg-transparent text-text hover:bg-zuma-50/40 dark:hover:bg-white/5`;
export const btnDanger = `${btnBase} bg-danger-500 text-white hover:bg-danger-700`;

export const input =
  "w-full rounded-lg border border-borderc bg-card px-3 py-2 text-sm text-text outline-none transition focus:border-zuma-500 focus:ring-2 focus:ring-ring";
export const label = "text-sm font-medium text-text";
export const helper = "text-xs text-muted";

export const badgeBase = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border";
export const badgeNew = `${badgeBase} bg-white/60 dark:bg-white/5 border-borderc text-muted`;
export const badgeHold = `${badgeBase} bg-warning-50 dark:bg-warning-50/10 border-warning-500/20 text-warning-700 dark:text-warning-500`;
export const badgeDelivered = `${badgeBase} bg-success-50 dark:bg-success-50/10 border-success-500/20 text-success-700 dark:text-success-500`;
export const badgeCanceled = `${badgeBase} bg-danger-50 dark:bg-danger-50/10 border-danger-500/20 text-danger-700 dark:text-danger-500`;

export const tableWrap = "overflow-hidden rounded-xl border border-borderc bg-card shadow-card";
export const table = "w-full text-left text-sm";
export const th = "bg-black/[0.02] dark:bg-white/[0.03] px-4 py-3 font-semibold text-text";
export const td = "px-4 py-3 border-t border-borderc text-text";
export const trHover = "hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition";
