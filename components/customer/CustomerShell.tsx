"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/shared/ThemeToggle";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import CustomerNav, {
  type CustomerNavItem,
} from "@/components/customer/CustomerNav";

const SHIPPED_CUSTOMER_ROUTES = new Set<string>([
  "/cliente/dashboard",
  "/cliente/pedidos",
  "/cliente/pontos",
  "/cliente/perfil",
]);

export default function CustomerShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const navItems: CustomerNavItem[] = [
    { href: "/cliente/dashboard", label: t("customer.dashboard"), icon: "🏠" },
    { href: "/cliente/pedidos", label: t("customer.orders"), icon: "📦" },
    { href: "/cliente/pontos", label: t("customer.points"), icon: "🎁" },
    { href: "/cliente/perfil", label: t("customer.profile"), icon: "👤" },
  ].filter((item) => SHIPPED_CUSTOMER_ROUTES.has(item.href));

  async function handleSignOut() {
    await signOut();
    router.push("/cliente/login");
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b border-borderc bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary">
              ZUMA
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <aside className="md:col-span-1">
            <CustomerNav
              accountLabel={t("customer.account")}
              items={navItems}
              logoutLabel={t("customer.logout")}
              onSignOut={handleSignOut}
              userEmail={user?.email}
            />
          </aside>

          <main className="md:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
