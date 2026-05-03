import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function useThemeToggle() {
  const { isSignedIn, isLoaded } = useUser();
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");
  const [plan, setPlan] = useState<string>("free");

  // Helper to apply theme to body
  const applyTheme = (theme: "light" | "dark") => {
    if (typeof document === "undefined") return;
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  };

  useEffect(() => {
    // 1. Initial check of body class to avoid flash
    if (typeof document !== "undefined") {
      const isLight = document.body.classList.contains("light-mode");
      setCurrentTheme(isLight ? "light" : "dark");
    }

    // 2. Listen for cross-component sync
    const handleSync = (e: any) => {
      if (e.detail?.theme) {
        setCurrentTheme(e.detail.theme);
        applyTheme(e.detail.theme);
      }
    };
    window.addEventListener("chintu-theme-sync", handleSync);
    return () => window.removeEventListener("chintu-theme-sync", handleSync);
  }, []);

  // Fetch theme and plan from profile
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      // Default for visitors (Landing Page premium look)
      if (!isSignedIn && isLoaded) applyTheme("dark"); 
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile } = await res.json();
          if (profile) {
            const userPlan = (profile.plan || "free").toLowerCase();
            setPlan(userPlan);

            // Logic: Free users ALWAYS light, Pro/Elite use saved theme (default dark)
            let theme: "light" | "dark" = "dark";
            if (userPlan === "free") {
              theme = "light";
            } else {
              theme = (profile.theme as "light" | "dark") || "dark";
            }

            setCurrentTheme(theme);
            applyTheme(theme);
          }
        }
      } catch (err) {
        console.error("useThemeToggle: Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [isLoaded, isSignedIn]);

  const toggleTheme = async () => {
    if (plan === "free") return; // Gated

    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    applyTheme(newTheme);

    // Notify other components
    window.dispatchEvent(new CustomEvent("chintu-theme-sync", { detail: { theme: newTheme } }));
    
    // Persist to Supabase
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme })
      });
    } catch (err) {
      console.error("useThemeToggle: Failed to persist theme:", err);
    }
  };

  return { currentTheme, toggleTheme, plan };
}
