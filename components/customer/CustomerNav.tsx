"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type CustomerNavItem = {
  href: string;
  label: string;
  icon: string;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type CustomerNavProps = {
  accountLabel: string;
  items: CustomerNavItem[];
  logoutLabel: string;
  onSignOut: () => void;
  userEmail?: string | null;
};

export default function CustomerNav({
  accountLabel,
  items,
  logoutLabel,
  onSignOut,
  userEmail,
}: CustomerNavProps) {
  const pathname = usePathname() ?? "";

  return (
    <div className="rounded-xl border border-borderc bg-card p-4 shadow-sm md:sticky md:top-6">
      {userEmail ? (
        <div className="mb-6 border-b border-borderc pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
              {userEmail[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{userEmail}</p>
              <p className="text-xs text-muted">{accountLabel}</p>
            </div>
          </div>
        </div>
      ) : null}

      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                isActive
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-foreground hover:bg-muted/20"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-foreground transition-all hover:bg-danger-50 hover:text-danger-600"
        >
          <span className="text-xl">🚪</span>
          <span>{logoutLabel}</span>
        </button>
      </nav>
    </div>
  );
}
