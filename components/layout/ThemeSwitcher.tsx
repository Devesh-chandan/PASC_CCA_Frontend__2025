"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-9 w-9" /> // placeholder to keep layout stable
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="cursor-pointer p-2.5 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border-light)] transition-all duration-300 flex items-center justify-center group shadow-sm hover:shadow-md"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5 text-[#FDB811] group-hover:rotate-45 transition-transform duration-500" />
      ) : (
        <Moon className="h-5 w-5 text-[var(--color-primary)] group-hover:-rotate-12 transition-transform duration-500" />
      )}
    </button>
  );
}
