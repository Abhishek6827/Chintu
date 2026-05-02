import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function useThemeToggle() {
  const { isSignedIn, isLoaded } = useUser();
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Check initial theme from document class
    if (typeof document !== "undefined") {
      const isLight = document.body.classList.contains("light-mode");
      setCurrentTheme(isLight ? "light" : "dark");
    }
  }, []);

  // Fetch theme from profile if signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const fetchTheme = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile } = await res.json();
          if (profile?.theme) {
            const theme = profile.theme as "light" | "dark";
            setCurrentTheme(theme);
            if (theme === "light") {
              document.body.classList.add("light-mode");
            } else {
              document.body.classList.remove("light-mode");
            }
          }
        }
      } catch (err) {
        console.error("useThemeToggle: Error fetching profile:", err);
      }
    };

    fetchTheme();
  }, [isLoaded, isSignedIn]);

  // Apply theme to body whenever currentTheme changes
  useEffect(() => {
    if (currentTheme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [currentTheme]);

  const toggleTheme = async () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    
    // Persist to Supabase
    if (isSignedIn) {
      try {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: newTheme })
        });
      } catch (err) {
        console.error("useThemeToggle: Failed to persist theme:", err);
      }
    }
  };

  return { currentTheme, toggleTheme };
}
