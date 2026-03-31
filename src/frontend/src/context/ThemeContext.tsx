import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (hue: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return "dark";
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem("accent-hue") || "265";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const hue = accentColor;
    const value = `0.58 0.22 ${hue}`;
    document.documentElement.style.setProperty("--primary", value);
    document.documentElement.style.setProperty("--ring", value);
    document.documentElement.style.setProperty("--sidebar-primary", value);
    document.documentElement.style.setProperty("--chart-1", value);
    localStorage.setItem("accent-hue", hue);
  }, [accentColor]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setAccentColor = (hue: string) => {
    setAccentColorState(hue);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, accentColor, setAccentColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
