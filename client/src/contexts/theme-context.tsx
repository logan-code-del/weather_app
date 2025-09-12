import { createContext, useContext, useEffect, useState } from "react";
import { Theme } from "@shared/schema";
import { useSettings } from "./settings-context";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings, updateSettings } = useSettings();
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const setTheme = (theme: Theme) => {
    updateSettings({ theme });
  };

  // Resolve "system" theme preference to actual theme
  useEffect(() => {
    const resolveTheme = () => {
      if (settings.theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return settings.theme;
    };

    const newResolvedTheme = resolveTheme();
    setResolvedTheme(newResolvedTheme);

    // Apply theme to document
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(newResolvedTheme);

    // Listen for system theme changes if using "system"
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const systemTheme = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(systemTheme);
        root.classList.remove("light", "dark");
        root.classList.add(systemTheme);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [settings.theme]);

  const value: ThemeContextType = {
    theme: settings.theme,
    resolvedTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}