"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  // null hasta montar: evita mismatch de hidratación (el server no conoce
  // la preferencia guardada en localStorage del navegador).
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const actual: Theme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(actual);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage puede fallar en modo privado; el toggle sigue funcionando
      // en memoria para esta sesión.
    }
    setTheme(next);
  };

  const esDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={esDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={esDark ? "Tema claro" : "Tema oscuro"}
      className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-[color:var(--color-rule)] bg-[color:var(--color-surface)] text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] hover:border-[color:var(--color-rule-2)] transition-colors"
    >
      {/* Antes de montar (theme === null) mostramos Moon como placeholder
          estable; coincide con el primer render de cliente, sin parpadeo. */}
      {esDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
