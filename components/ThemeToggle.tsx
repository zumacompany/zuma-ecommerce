"use client";
import { useEffect, useState } from "react";
import { btnSecondary } from "./ui/classes";

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
    <button type="button" onClick={toggle} className={btnSecondary}>
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
