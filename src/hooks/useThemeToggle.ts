import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export function useThemeToggle() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");
  const [plan, setPlan] = useState<string>("free");
  const isFetching = useRef(false);

  // Helper to apply theme to document element
  const applyTheme = (theme: "light" | "dark") => {
    if (typeof document === "undefined") return;
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  };

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail?.theme) {
        setCurrentTheme(e.detail.theme);
        applyTheme(e.detail.theme);
      }
    };
    window.addEventListener("chintu-theme-sync", handleSync);
    
    // On mount, we don't need to apply any default because the server
    // has already applied the correct class to the HTML tag.
    // We just sync the local state to match the existing class.
    if (typeof document !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark-mode");
      setCurrentTheme(isDark ? "dark" : "light");
    }
    
    return () => window.removeEventListener("chintu-theme-sync", handleSync);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setCurrentTheme("light");
      applyTheme("light");
      return;
    }

    const fetchProfile = async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile } = await res.json();
          if (profile) {
            const rawPlan = profile.plan ? String(profile.plan).toLowerCase() : "free";
            setPlan(rawPlan);

            let targetTheme: "light" | "dark" = "light";
            if (rawPlan === "pro" || rawPlan === "elite") {
              targetTheme = profile.theme === "light" ? "light" : "dark";
            } else {
              targetTheme = "light";
            }

            setCurrentTheme(targetTheme);
            applyTheme(targetTheme);
          }
        }
      } catch (err) {
        console.error("Theme Hook Error:", err);
      } finally {
        isFetching.current = false;
      }
    };

    fetchProfile();
  }, [isLoaded, isSignedIn, user?.id]);

  const toggleTheme = async () => {
    if (plan !== "pro" && plan !== "elite") return;

    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    applyTheme(newTheme);

    window.dispatchEvent(new CustomEvent("chintu-theme-sync", { detail: { theme: newTheme } }));
    
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme })
      });
    } catch (err) {
      console.error("Theme Save Error:", err);
    }
  };

  return { currentTheme, toggleTheme, plan };
}
