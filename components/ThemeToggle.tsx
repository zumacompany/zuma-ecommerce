"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  theme === "dark" ? root.classList.add("dark") : root.classList.remove("dark");
}

export default function ThemeToggle() {
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
      className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-md hover:bg-muted/10 text-muted transition-colors"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
