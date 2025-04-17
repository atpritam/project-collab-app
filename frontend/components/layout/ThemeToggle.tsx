"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useUserSettings } from "@/components/context/UserSettingsContext";
import { useEffect } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting, isLoading } = useUserSettings();

  useEffect(() => {
    if (!isLoading && settings) {
      setTheme(settings.darkMode ? "dark" : "light");
    }
  }, [isLoading, settings, setTheme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);

    // Only update settings if we're authenticated and have settings
    if (settings) {
      updateSetting("darkMode", newTheme === "dark");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
