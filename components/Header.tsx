"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const pathname = usePathname();

  // Hide header on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm border-b border-borderc bg-card">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-lg">
            Zuma
          </Link>
        </div>

        <nav className="hidden md:flex gap-6">
          <Link href="/c/gift-cards" className="text-sm font-medium hover:text-zuma-500 transition-colors">
            Gift Cards
          </Link>
          <Link href="/c/streaming" className="text-sm font-medium hover:text-zuma-500 transition-colors">
            Streaming
          </Link>
          <Link href="/c/crypto" className="text-sm font-medium hover:text-zuma-500 transition-colors">
            Cripto
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
