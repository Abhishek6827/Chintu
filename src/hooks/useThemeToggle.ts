import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export function useThemeToggle() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light"); // Default to Light
  const [plan, setPlan] = useState<string>("free");
  const isFetching = useRef(false);

  // Helper to apply theme to body
  const applyTheme = (theme: "light" | "dark") => {
    if (typeof document === "undefined") return;
    console.log(`[ThemeHook] Applying theme to body: ${theme}`);
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail?.theme) {
        console.log(`[ThemeHook] Sync received: ${e.detail.theme}`);
        setCurrentTheme(e.detail.theme);
        applyTheme(e.detail.theme);
      }
    };
    window.addEventListener("chintu-theme-sync", handleSync);
    
    // Safety: Always start LIGHT on mount as per user request for visitors/free users
    console.log("[ThemeHook] Mounted. Initializing as LIGHT.");
    applyTheme("light");
    
    return () => window.removeEventListener("chintu-theme-sync", handleSync);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      console.log("[ThemeHook] Visitor detected. Keeping LIGHT.");
      setCurrentTheme("light");
      applyTheme("light");
      return;
    }

    const fetchProfile = async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      try {
        console.log("[ThemeHook] Fetching profile for user:", user?.id);
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile } = await res.json();
          console.log("[ThemeHook] Profile API response:", profile);
          
          if (profile) {
            const rawPlan = profile.plan ? String(profile.plan).toLowerCase() : "free";
            setPlan(rawPlan);

            let targetTheme: "light" | "dark" = "light"; // Default to light
            
            // LOGIC:
            // 1. If pro/elite -> default to DARK unless they saved 'light'
            // 2. If free -> force LIGHT
            if (rawPlan === "pro" || rawPlan === "elite") {
              targetTheme = profile.theme === "light" ? "light" : "dark";
              console.log(`[ThemeHook] Premium user (${rawPlan}). Chosen Theme: ${targetTheme}`);
            } else {
              targetTheme = "light";
              console.log(`[ThemeHook] Free user (${rawPlan}). Forcing LIGHT.`);
            }

            setCurrentTheme(targetTheme);
            applyTheme(targetTheme);
          } else {
            console.log("[ThemeHook] No profile found. Keeping LIGHT.");
            applyTheme("light");
          }
        } else {
          console.error("[ThemeHook] API Error:", res.status);
          applyTheme("light");
        }
      } catch (err) {
        console.error("[ThemeHook] Fetch Error:", err);
        applyTheme("light");
      } finally {
        isFetching.current = false;
      }
    };

    fetchProfile();
  }, [isLoaded, isSignedIn, user?.id]);

  const toggleTheme = async () => {
    if (plan !== "pro" && plan !== "elite") {
      console.log("[ThemeHook] Toggle blocked: Free plan.");
      return;
    }

    const newTheme = currentTheme === "light" ? "dark" : "light";
    console.log(`[ThemeHook] Manual toggle to: ${newTheme}`);
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
      console.error("[ThemeHook] Save Error:", err);
    }
  };

  return { currentTheme, toggleTheme, plan };
}
