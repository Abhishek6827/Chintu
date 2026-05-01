"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { Minus, Zap, Crown, Check, Sparkles } from "lucide-react";

import OnboardingModal from "@/components/OnboardingModal";

export default function GlobalHeader() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isWindowHidden, setIsWindowHidden] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [hasProfile, setHasProfile] = useState(false);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

  // Sync state with Electron and Supabase
  useEffect(() => {
    // Listen for recording status changes from other components
    const handleRecordingStatus = (e: any) => {
      setIsScreenRecording(!!e.detail?.active);
    };

    const handleOpenGuide = () => {
      setShowOnboarding(true);
    };

    window.addEventListener('chintu-recording-status', handleRecordingStatus);
    window.addEventListener('chintu-open-guide', handleOpenGuide);
    
    return () => {
      window.removeEventListener('chintu-recording-status', handleRecordingStatus);
      window.removeEventListener('chintu-open-guide', handleOpenGuide);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile } = await res.json();
          if (profile) {
            setUserCredits(profile.credits);
            setUserPlan(profile.plan || "free");
            setHasProfile(!!(profile.profile_data && Object.keys(profile.profile_data).length > 0));
          }
        }
      } catch (err) {
        console.error("GlobalHeader: Error fetching profile:", err);
      }
    };

    fetchProfile();
    
    // Polling for credits/profile updates if needed
    const interval = setInterval(fetchProfile, 10000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    if (isElectron) {
      (window as any).electronAPI?.onProtectionChange((protected_state: boolean) => {
        setIsWindowHidden(protected_state);
      });
    }
  }, [isElectron]);

  const handleHide = () => {
    if (isElectron) {
      const newState = !isWindowHidden;
      setIsWindowHidden(newState);
      (window as any).electronAPI.setProtection(newState);
    }
  };

  const handleMinimize = () => {
    if (isElectron) {
      (window as any).electronAPI.minimize();
    }
  };

  const handleUpgrade = () => {
    const pricingUrl = "https://www.getchintu.com/pricing";
    if (isElectron) {
      (window as any).electronAPI.openExternal(pricingUrl);
    } else {
      window.open(pricingUrl, "_blank");
    }
  };

  // Determine if we should show the full header or just controls
  // On login/signup pages, maybe we want a simpler view? 
  // But the user said "every page".

  return (
    <>
      <div className="drag-region flex items-center justify-between px-4 h-12 shrink-0 relative z-[100] w-full">
        <div className="flex items-center gap-3 no-drag">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push(isSignedIn ? "/room" : "/")}
          >
            <Image src="https://www.getchintu.com/icon.png" alt="Chintu" className="w-5 h-5 object-contain" width={40} height={40} unoptimized />
            <span className="text-[var(--text-main)] text-sm font-black tracking-tight uppercase">Chintu</span>
          </div>
          
          {isSignedIn && userCredits !== null && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-sm ${
                userCredits > 5 
                  ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' 
                  : 'bg-amber-500/5 text-amber-500 border-amber-500/10'
              }`}>
                <Zap className="w-3 h-3 fill-current" />
                <span className="text-[10px] font-black tracking-tight">{userCredits}</span>
                <div className="w-[1px] h-3 bg-current opacity-20 mx-0.5" />
                <span className="text-[8px] font-black uppercase tracking-[0.1em] opacity-60">{userPlan}</span>
              </div>
              {userPlan === 'free' && (
                <button 
                  onClick={handleUpgrade}
                  className="px-3 py-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all text-[8px] font-black uppercase tracking-[0.15em] shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  Upgrade
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 no-drag">
          {isScreenRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 mr-1 animate-pulse">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span className="text-[8px] text-red-500 font-black uppercase tracking-[0.2em]">REC</span>
            </div>
          )}
          {isElectron && (
            <>
              <button
                onClick={handleHide}
                className={`
                  w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90
                  ${isWindowHidden
                    ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    : "bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-dim)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)]"
                  }
                `}
                title={isWindowHidden ? "Ghost Mode Active" : "Ghost Mode Inactive"}
              >
                {isWindowHidden ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                )}
              </button>
              <button 
                onClick={handleMinimize} 
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--input-bg)] text-[var(--text-dim)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)] transition-all active:scale-90"
                title="Minimize"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          
          {isSignedIn && (
            <div className={`rounded-lg overflow-hidden flex items-center justify-center transition-all ${hasProfile ? "ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20" : "ring-1 ring-[var(--glass-border)]"}`}>
              <UserButton 
                appearance={{ elements: { userButtonAvatarBox: "w-7 h-7 rounded-lg" } }}
                afterSignOutUrl="/"
              >
                <UserButton.MenuItems>
                  <UserButton.Action 
                    label="Support" 
                    labelIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>} 
                    onClick={() => {
                      const supportUrl = "https://www.getchintu.com/support";
                      if (isElectron) (window as any).electronAPI.openExternal(supportUrl);
                      else window.open(supportUrl, "_blank");
                    }} 
                  />
                  <UserButton.Action 
                    label="Operation Guide" 
                    labelIcon={<Sparkles className="w-4 h-4" />} 
                    onClick={() => setShowOnboarding(true)} 
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          )}
        </div>
      </div>
      {showOnboarding && <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />}
    </>
  );
}
