"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ThemeToggle from "../shared/ThemeToggle";
import BackButton from "./BackButton";
import LanguageSwitcher from "../shared/LanguageSwitcher";
import { useI18n } from "../../lib/i18n";
import { useAuth } from "@/lib/auth-context";

function SearchIcon() {
  return (
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function SearchForm({
  placeholder,
  className,
  inputClassName,
}: {
  placeholder: string;
  className: string;
  inputClassName: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = search.trim();
    router.push(query ? `/browse?q=${encodeURIComponent(query)}` : "/browse");
  };

  return (
    <form className={className} onSubmit={handleSearchSubmit}>
      <input
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={placeholder}
        className={inputClassName}
      />
      <SearchIcon />
    </form>
  );
}

function SearchFormFallback({
  placeholder,
  className,
  inputClassName,
}: {
  placeholder: string;
  className: string;
  inputClassName: string;
}) {
  return (
    <div className={className}>
      <input type="text" disabled placeholder={placeholder} className={inputClassName} />
      <SearchIcon />
    </div>
  );
}

export default function Header() {
  const { t } = useI18n();
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();
  const accountHref = isAdmin ? "/admin" : user ? "/cliente/dashboard" : "/cliente/login";
  const accountLabel = isAdmin ? "Admin" : user ? t("customer.account") : t("common.login");

  // Hide header on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-borderc shadow-sm">
      {/* Top Row: Logo and Actions */}
      <div className="container max-w-[1200px] h-14 flex items-center justify-between gap-4 px-4">
        {/* Back Button - Show on non-home pages */}
        {pathname !== '/' && (
          <BackButton />
        )}

        {/* Logo */}
        <Link href="/" className="flex-shrink-0 font-bold text-xl tracking-tight text-primary">
          Zuma
        </Link>

        {/* Search Bar - Desktop Only */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <Suspense
            fallback={
              <SearchFormFallback
                placeholder={t("common.searchPlaceholder")}
                className="relative w-full"
                inputClassName="w-full h-9 pl-9 pr-4 rounded-md bg-muted/10 border border-transparent focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all outline-none placeholder:text-muted"
              />
            }
          >
            <SearchForm
              placeholder={t("common.searchPlaceholder")}
              className="relative w-full"
              inputClassName="w-full h-9 pl-9 pr-4 rounded-md bg-muted/10 border border-transparent focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all outline-none placeholder:text-muted"
            />
          </Suspense>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          <Link
            href={accountHref}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-md hover:bg-muted/10 text-muted transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="sr-only">{accountLabel}</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Row */}
      <div className="md:hidden border-t border-borderc">
        <div className="container max-w-[1200px] px-4 py-2">
          <Suspense
            fallback={
              <SearchFormFallback
                placeholder={t("common.searchPlaceholder")}
                className="relative"
                inputClassName="w-full h-10 pl-10 pr-4 rounded-md bg-muted/10 border border-transparent focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all outline-none placeholder:text-muted"
              />
            }
          >
            <SearchForm
              placeholder={t("common.searchPlaceholder")}
              className="relative"
              inputClassName="w-full h-10 pl-10 pr-4 rounded-md bg-muted/10 border border-transparent focus:bg-card focus:border-primary focus:ring-1 focus:ring-primary text-sm transition-all outline-none placeholder:text-muted"
            />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
