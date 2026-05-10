"use client";

import { useThemeToggle } from "@/hooks/useThemeToggle";

export default function ThemeProvider() {
  useThemeToggle();
  return null;
}
