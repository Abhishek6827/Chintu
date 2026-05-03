"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { Minus, Zap, Sparkles, CreditCard } from "lucide-react";



import OnboardingModal from "@/components/OnboardingModal";
import ProfileModal from "@/components/ProfileModal";

export default function GlobalHeader() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

  useEffect(() => {
    setMounted(true);
  }, []);

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
            setUserPlan((profile.plan || "free").toLowerCase());
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
  
  // Close modals when signed out
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setShowProfileModal(false);
      setShowOnboarding(false);
      // Clear session storage on logout to ensure JD is requested again next time
      sessionStorage.removeItem("jobDescription");
    }
  }, [isLoaded, isSignedIn]);

  const [showUnhidePrompt, setShowUnhidePrompt] = useState(false);
  const [isStealthMode, setIsStealthMode] = useState(true); // Default to true based on main.js

  const handleGhostToggle = async () => {
    if (isElectron) {
      // ONLY show warning if we are CURRENTLY in Stealth Mode and want to exit
      if (isStealthMode) {
        setShowUnhidePrompt(true);
        return;
      }
      
      // If we are NOT in stealth mode, go into it silently
      await (window as any).electronAPI.ghostToggle();
    }
  };

  const confirmUnhide = async () => {
    if (isElectron) {
      await (window as any).electronAPI.ghostToggle();
      setShowUnhidePrompt(false);
    }
  };

  useEffect(() => {
    if (isElectron && (window as any).electronAPI?.onStealthChange) {
      const cleanup = (window as any).electronAPI.onStealthChange((stealth: boolean) => {
        setIsStealthMode(stealth);
      });
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, [isElectron]);

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

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/manage-subscription");
      const data = await res.json();
      
      if (data.url) {
        if (data.provider === "razorpay") {
          // Internal page — navigate within app
          router.push("/subscription");
        } else if (isElectron) {
          // Stripe portal — open externally in Electron
          (window as any).electronAPI.openExternal(data.url);
        } else {
          window.location.href = data.url;
        }
      } else {
        alert(data.error || "Failed to load subscription portal.");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading subscription portal.");
    }
  };

  // Hide GlobalHeader on web platform - it's specifically for the EXE app frame
  // Use 'mounted' to prevent hydration errors
  if (!mounted || !isElectron) {
    return null;
  }

  // Use publicPages and pathname for a breadcrumb or title

  return (
    <>
      <div className="drag-region flex items-center justify-between px-3 h-12 shrink-0 relative z-[100] w-full bg-[var(--bg-app)] border-b border-[var(--glass-border)] shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 no-drag">

          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              if (isSignedIn) {
                const jd = sessionStorage.getItem("jobDescription");
                if (jd) router.push("/room");
                else router.push("/setup");
              } else {
                router.push("/");
              }
            }}
          >
            <div className="flex items-center justify-center w-7 h-7 bg-indigo-500/10 rounded-lg border border-indigo-500/20 shadow-sm overflow-hidden p-1">
              <Image 
                src="https://www.getchintu.com/icon.png" 
                alt="Chintu" 
                className="w-full h-full object-contain" 
                width={28} 
                height={28} 
                unoptimized 
              />
            </div>
            <span className="text-[var(--text-main)] text-sm font-black tracking-tight uppercase">Chintu</span>
          </div>
          
          {isSignedIn && userCredits !== null && (
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-sm ${
                userCredits > 5 
                  ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' 
                  : 'bg-amber-500/5 text-amber-500 border-amber-500/10'
              }`}>
                <span className="text-[10px] font-black tracking-tight">{userCredits}</span>
                <div className="w-[1px] h-3 bg-current opacity-20 mx-0.5" />
                <span className="text-[8px] font-black uppercase tracking-[0.1em] opacity-60">{userPlan}</span>
              </div>
              {userPlan === 'free' && (
                <button 
                  onClick={handleUpgrade}
                  className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/10 active:scale-95"
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
          {mounted && isElectron && (
            <>
              <button
                onClick={handleGhostToggle}
                className={`
                  w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90
                  ${isStealthMode
                    ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                    : "bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-dim)] hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)]"
                  }
                `}
                title={isStealthMode ? "Exit Ghost Mode" : "Enter Ghost Mode"}
              >
                {isStealthMode ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
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
            <div className="flex items-center gap-1.5 ml-1">
              <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-white/10 hover:scale-105 transition-transform">
                <UserButton afterSignOutUrl="/">
                  <UserButton.MenuItems>
                    {userPlan !== "free" && (
                      <UserButton.Action 
                        label="Manage Subscription" 
                        labelIcon={<CreditCard className="w-4 h-4" />} 
                        onClick={handleManageSubscription} 
                      />
                    )}
                    <UserButton.Action 
                      label="My AI Profile" 
                      labelIcon={<Sparkles className="w-4 h-4" />} 
                      onClick={() => setShowProfileModal(true)} 
                    />
                    <UserButton.Action 
                      label="Support" 
                      labelIcon={<Zap className="w-4 h-4" />} 
                      onClick={handleUpgrade} 
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            </div>
          )}
        </div>
      </div>
      {showOnboarding && <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}

      {/* Unhide Prompt (Shocking/Animated) */}
      {showUnhidePrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60 animate-in fade-in duration-300">
          <div className="unhide-prompt-card w-full max-w-xs bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 p-[2px] rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.4)] animate-in zoom-in-95 duration-300">
            <div className="bg-gray-900 rounded-[22px] p-6 text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tight uppercase">Exit Ghost Mode?</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                App will become <span className="text-orange-400 font-bold uppercase underline">visible</span> to screen recording tools. Proceed with caution!
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmUnhide}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
                >
                  YES, UNHIDE IT
                </button>
                <button
                  onClick={() => setShowUnhidePrompt(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
