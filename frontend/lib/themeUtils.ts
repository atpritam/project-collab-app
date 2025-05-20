"use client";

/**
 * Utility functions for working with theme colors and modes in the app
 */
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

// Check if we're on the client (browser) side
const isClient = typeof window !== "undefined";

/**
 * Combines multiple class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the current theme from localStorage
 */
export function getStoredTheme(): string | null {
  if (!isClient) return null;
  return localStorage.getItem("nudge-theme");
}

/**
 * Set theme in localStorage
 */
export function setStoredTheme(theme: string): void {
  if (!isClient) return;
  localStorage.setItem("nudge-theme", theme);
}

/**
 * Detect and return preferred color scheme from system
 */
export function getSystemTheme(): "dark" | "light" {
  if (!isClient) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Apply theme to document element
 */
export function applyThemeMode(theme: string): void {
  if (!isClient) return;

  const root = document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = getSystemTheme();
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}

/**
 * Initialize theme on page load
 */
export function initializeTheme(): void {
  if (!isClient) return;

  const storedTheme = getStoredTheme();
  if (storedTheme) {
    applyThemeMode(storedTheme);
  } else {
    // Default to system preference if no stored theme
    applyThemeMode("system");
  }
}

/**
 * Fixed color mappings for common Tailwind colors to theme variables
 */
export const themeColors = {
  // Background colors
  bgWhite: "bg-background",
  bgGray50: "bg-muted",
  bgGray100: "bg-muted",
  bgGray200: "bg-muted",
  // Text colors
  textGray700: "text-foreground",
  textGray600: "text-foreground",
  textGray500: "text-muted-foreground",
  textGray400: "text-muted-foreground",
  // Border colors
  borderGray300: "border-border",
  borderGray200: "border-border",
  // Accent colors
  violetPrimary: "bg-violet-600 dark:bg-violet-700",
  violetSecondary: "bg-violet-100 dark:bg-violet-900/30",
  // Special combinations
  card: "bg-card text-card-foreground border-border",
  input: "bg-background border-input focus:ring-ring",
  muted: "bg-muted text-muted-foreground",
} as const;

/**
 * Maps common element types to theme-consistent classes
 */
export const themeMappings = {
  card: "bg-card text-card-foreground shadow-sm dark:shadow-none border border-border rounded-lg",
  input:
    "bg-background text-foreground border-input focus:ring-ring focus:border-transparent rounded-md",
  button: {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "bg-transparent hover:bg-muted text-foreground",
    outline:
      "border border-border bg-background hover:bg-muted text-foreground",
  },
  text: {
    primary: "text-foreground",
    secondary: "text-muted-foreground",
    accent: "text-primary",
  },
};

/**
 * Helper for creating theme-aware component variants
 */
export function createThemeVariant(
  baseStyle: string,
  variants: Record<string, string>
) {
  return (variant?: keyof typeof variants) => {
    return variant ? `${baseStyle} ${variants[variant]}` : baseStyle;
  };
}

/**
 * Apply theme colors to element based on common patterns
 */
export function applyTheme(
  element: "card" | "input" | "button" | "text",
  variant?: string
) {
  if (element === "button" || element === "text") {
    // @ts-ignore
    return themeMappings[element][variant || "primary"];
  }
  return themeMappings[element];
}
