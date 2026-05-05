"use client";
import React from "react";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
type ThemeToggleProps = {
  compact?: boolean;
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  theme === "dark" ? root.classList.add("dark") : root.classList.remove("dark");
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const systemPrefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    const initial: Theme = saved ?? (systemPrefersDark ? "dark" : "light");
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center justify-center rounded-md text-muted transition-colors hover:bg-muted/10 ${
        compact ? "min-h-9 min-w-9 h-9 w-9" : "min-h-[44px] min-w-[44px] h-11 w-11"
      }`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className={compact ? "h-4 w-4" : "h-5 w-5"} />
      ) : (
        <Moon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      )}
    </button>
  );
}
