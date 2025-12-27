"use client";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm border-b border-borderc bg-card">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-lg">
            Zuma
          </Link>
        </div>

        <nav className="hidden md:flex gap-6">
          <Link href="/c/gift-cards" className="text-sm font-medium">
            Gift Cards
          </Link>
          <Link href="/c/streaming" className="text-sm font-medium">
            Streaming
          </Link>
          <Link href="/c/crypto" className="text-sm font-medium">
            Crypto
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
