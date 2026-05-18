"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import dynamic from 'next/dynamic';

const Meteors = dynamic(() => import('@/components/magicui/meteors').then(mod => mod.Meteors), { ssr: false });
const PremiumWelcome = dynamic(() => import('@/components/PremiumWelcome').then(mod => mod.PremiumWelcome), { ssr: false });
const InteractiveHoverButton = dynamic(() => import('@/components/magicui/interactive-hover-button').then(mod => mod.InteractiveHoverButton), { ssr: false });
const NeuralLoading = dynamic(() => import('@/components/NeuralLoading'), { ssr: false });





export default function SetupPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [jd, setJd] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);
  const [userPlan, setUserPlan] = useState("free");
  const [isJdLocked, setIsJdLocked] = useState(false);
  const [saveJd, setSaveJd] = useState(false);
  const [showJdOnly, setShowJdOnly] = useState(false);
  const [hasSavedJd, setHasSavedJd] = useState(false);
  const [showAppPrompt, setShowAppPrompt] = useState(false);

  const router = useRouter();
  const isElectron = typeof window !== "undefined" && (!!(window as any).electronAPI || navigator.userAgent.toLowerCase().includes('electron'));

  // Handle hydration / Initial load
  useEffect(() => {
    setMounted(true);

    // Note: web (non-Electron) users are redirected to /download at the edge
    // by middleware.ts, so we never reach this page in the browser.

    const checkProfile = async () => {
      // Fetch profile via secure backend API
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile: profileRow } = await res.json();
          if (profileRow) {
            setUserPlan((profileRow.plan || "free").toLowerCase());
            // Logic based on new requirements:
            // If Profile + JD exist -> go to room
            // Robust check for actual candidate profile data (ignoring virtual fields like saved_jd)
            const hasStructuredProfile = profileRow.profile_data &&
              (profileRow.profile_data.name ||
                profileRow.profile_data.experience ||
                profileRow.profile_data.skills ||
                profileRow.profile_data.summary);
            const hasRawProfile = !!(profileRow.raw_profile && String(profileRow.raw_profile).trim());
            const profileExists = hasStructuredProfile || hasRawProfile;

            if (profileExists) {
              setHasProfile(true);
              if (profileRow.raw_profile) setAboutMe(profileRow.raw_profile);
            } else {
              setHasProfile(false);
            }

            // Always load JD if it exists, regardless of profile status
            if (profileRow.current_jd) {
              setJd(profileRow.current_jd);
              setHasSavedJd(true);
              sessionStorage.setItem("jobDescription", profileRow.current_jd);
              if ((profileRow.plan || "free") === "free") {
                setIsJdLocked(true);
              }
            } else {
              setHasSavedJd(false);
              setShowJdOnly(false); // Reset if missing
            }

            // Auto-redirect when raw_profile + JD exist (or structured profile + JD)
            if (profileExists && profileRow.current_jd) {
              router.push("/room");
              return;
            }

            // If profile exists but no JD, show JD-only welcome
            if (profileExists && !profileRow.current_jd) {
              setShowJdOnly(true);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching profile via API:", err);
      }
    };


    if (isLoaded && isSignedIn && user) {
      checkProfile().then(async () => {
        // Sync name if missing in profile_data
        try {
          const res = await fetch("/api/profile");
          const { profile: p } = await res.json();
          if (!p?.full_name && user.fullName) {
            await fetch("/api/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                full_name: user.fullName
              }),
            });
          }
        } catch { }
        setIsLoadingProfile(false);
      });
    } else if (isLoaded && !isSignedIn) {
      setIsLoadingProfile(false);
    }
  }, [isLoaded, isSignedIn, user, isElectron, router]);



  // If not mounted or Clerk not loaded yet or profile still loading, show premium loading
  if (!mounted || !isLoaded || isLoadingProfile) {
    return <NeuralLoading text="Establishing Neural Link" subtext="Chintu Ji Interface" />;
  }

  // Double check auth (Middleware should handle this, but for safety)
  if (!isSignedIn) {
    router.push("/sign-in");
    return null;
  }

  const handleStart = async () => {
    if (!jd.trim()) {
      setError("Please provide a Job Description to proceed.");
      return;
    }

    if (!hasProfile && !aboutMe.trim()) {
      setError("Please provide your profile or experience to personalize your session.");
      return;
    }

    // Since we are in Electron (guarded by the check above), we proceed directly with setup.

    setIsInitiating(true);
    setStatusText("🚀 Preparing your interview workspace...");

    if (aboutMe.trim() && !hasProfile) {
      setIsRefining(true);
      setStatusText("✨ Chintu Ji is structuring your profile...");

      // Save JD to Supabase:
      // Free users: always auto-save (one-time, API enforces limit)
      // Pro/Elite: save only if toggle is ON
      const shouldSaveJd = userPlan === "free" ? !isJdLocked : saveJd;
      if (shouldSaveJd) {
        try {
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_jd: jd.trim() }),
          });
        } catch (err) {
          console.error("Failed to save JD:", err);
        }
      }

      try {
        await fetch("/api/refine-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText: aboutMe.trim() }),
        });

        setStatusText("🎯 Finalizing workspace...");
        sessionStorage.setItem("jobDescription", jd.trim());
        router.push("/room?jd=" + encodeURIComponent(jd.trim()));
      } catch (err) {
        console.error("Failed to start refinement:", err);
        sessionStorage.setItem("jobDescription", jd.trim());
        router.push("/room?jd=" + encodeURIComponent(jd.trim()));
      }
    } else {
      setStatusText("🎯 Synchronizing with neural network...");

      // Save JD to Supabase (same logic as above)
      const shouldSaveJd2 = userPlan === "free" ? !isJdLocked : saveJd;
      if (shouldSaveJd2) {
        try {
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_jd: jd.trim() }),
          });
        } catch (err) {
          console.error("Failed to save JD:", err);
        }
      }

      sessionStorage.setItem("jobDescription", jd.trim());
      router.push("/room?jd=" + encodeURIComponent(jd.trim()));
    }
  };

  const handleSkipAndStart = () => {
    // Since we are in Electron (guarded by the check above), we proceed directly with setup.

    // Save JD to Supabase (same plan-aware logic)
    const shouldSaveJdSkip = userPlan === "free" ? !isJdLocked : saveJd;
    if (shouldSaveJdSkip) {
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_jd: jd.trim() }),
      }).catch(err => console.error("Failed to save JD on skip:", err));
    }

    sessionStorage.setItem("jobDescription", jd.trim());
    router.push("/room?jd=" + encodeURIComponent(jd.trim()));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-x-hidden overflow-y-auto relative">
      {userPlan !== "free" && <Meteors number={30} />}

      {/* Floating profile bar in top right */}
      {isSignedIn && user && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-sm">
            <span className={`text-[8px] font-black uppercase tracking-widest ${
              userPlan === "elite" ? "text-amber-500" : userPlan === "pro" ? "text-indigo-500" : "text-[var(--text-dim)]"
            }`}>
              {userPlan === "free" ? "Starter" : userPlan}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center overflow-hidden active:scale-95 transition-transform">
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-[var(--text-dim)]">
                {user.firstName?.[0]?.toUpperCase() || "?"}
              </span>
            )}
          </div>
        </div>
      )}



      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-[var(--panel-bg)] rounded-[2rem] border border-[var(--glass-border)] shadow-xl flex items-center justify-center p-3 relative overflow-hidden group hover:scale-105 transition-transform">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image
                src="/icon-sm.png"
                alt="Chintu"
                className="w-full h-full object-contain relative z-10 rounded-full"
                width={80}
                height={80}
              />
            </div>
            <h1 className="text-3xl font-black tracking-tight uppercase text-[var(--text-main)] leading-none">Chintu</h1>
            <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.4em] mt-2 text-center">AI Interview Assistant</p>
            {showJdOnly && (
              <div className="mt-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-bold text-indigo-400">Welcome back!</p>
                <p className="text-[10px] text-indigo-400/70 font-bold uppercase tracking-wider mt-1">Enter your Job Description to continue.</p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 font-bold animate-in fade-in slide-in-from-top-2">
                ⚠️ {error}
                <button onClick={() => setError(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
              </div>
            )}

            {isLoadingProfile ? (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite]" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-2 w-16 bg-gray-200 rounded" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
              </div>
            ) : !hasProfile ? (
              <div className="space-y-2 animate-in fade-in duration-500">
                <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest ml-1">Candidate Profile</label>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Paste your resume or tell about your experience..."
                  className="w-full h-32 bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-[var(--text-dim)] shadow-sm text-[var(--text-main)]"
                />
              </div>
            ) : (
              userPlan === "free" ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-3 shadow-sm animate-in zoom-in-95 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-emerald-400 text-lg">✓</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">Profile Status</p>
                        <p className="text-sm font-bold text-emerald-400">Identity Loaded</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-emerald-500/10">
                    <p className="text-[8px] font-bold text-emerald-400/60 uppercase tracking-widest leading-relaxed">
                      Starter plan limited to one-time profile. <button onClick={() => router.push("/pricing")} className="text-indigo-400 underline">Upgrade</button> to edit.
                    </p>
                  </div>
                </div>
              ) : (
                <PremiumWelcome plan={userPlan} />
              )
            )}

            {/* Job Description Status Indicator */}
            {hasSavedJd && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-3 shadow-sm animate-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-400 text-lg">✓</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">JD Status</p>
                      <p className="text-sm font-bold text-emerald-400">Position Synced</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Job Description Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">Job Description</label>
                {userPlan !== "free" && jd && (
                  <button
                    onClick={() => setJd("")}
                    className="text-[9px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest"
                  >
                    Clear
                  </button>
                )}
                {isJdLocked && (
                  <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                    🔒 STARTER LIMIT
                  </span>
                )}
              </div>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                readOnly={isJdLocked}
                placeholder={isJdLocked ? "Upgrade to Pro to change Job Description" : "Paste the job description you are interviewing for..."}
                className={`w-full h-40 bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-[var(--text-dim)] shadow-sm text-[var(--text-main)] ${isJdLocked ? "opacity-60 cursor-not-allowed bg-[var(--glass-bg)]" : ""}`}
              />

              <div className="flex items-center gap-2 mt-3 px-1">
                {!isJdLocked && userPlan !== "free" && (
                  <>
                    <button
                      onClick={() => setSaveJd(!saveJd)}
                      className={`w-9 h-5 rounded-full transition-all relative ${saveJd ? 'bg-indigo-600' : 'bg-[var(--glass-border)]'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${saveJd ? 'left-5' : 'left-1'}`} />
                    </button>
                    <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">Save JD for future sessions?</span>
                  </>
                )}
              </div>

              {isJdLocked && (
                <button
                  onClick={() => router.push("/pricing")}
                  className="w-full py-2 text-[8px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  ✨ Unlock Unlimited JDs with Pro
                </button>
              )}
            </div>

            {/* Action Button */}
            <div className="flex flex-col gap-2">
              <InteractiveHoverButton
                onClick={handleStart}
                disabled={!jd.trim() || (!hasProfile && !aboutMe.trim()) || isRefining}
                className={`
                  w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden group
                  ${jd.trim() && (hasProfile || aboutMe.trim()) && !isRefining
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30"
                    : "bg-[var(--panel-bg)] text-[var(--text-dim)] border border-[var(--glass-border)] cursor-not-allowed"
                  }
                `}
              >
                {isRefining ? statusText : "Initiate Session"}
              </InteractiveHoverButton>


              {isRefining && (
                <button
                  onClick={handleSkipAndStart}
                  className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 border border-indigo-500/20 shadow-sm"
                >
                  Skip & Start Interview
                  <p className="text-[8px] font-medium text-indigo-400 mt-0.5 tracking-normal normal-case">Profile will refine in background</p>
                </button>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Footer info */}
      <div className="p-6 text-center opacity-40">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--text-dim)]">Secure Mode • Ghost Overlay Active</p>
      </div>

      {/* Full Page Loading Animation (Refining or Initiating) */}
      {(isRefining || isInitiating) && (
        <NeuralLoading text={statusText} />
      )}

      {/* App Prompt Overlay */}
      {showAppPrompt && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-[var(--bg-app)] animate-in fade-in zoom-in duration-500">
          <div className="max-w-sm w-full px-8 text-center">
            <div className="relative w-32 h-32 mx-auto mb-10">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-[2.5rem] animate-pulse" />
              <div className="absolute inset-4 bg-[var(--panel-bg)] rounded-[2rem] shadow-xl flex items-center justify-center border border-[var(--glass-border)] overflow-hidden">
                <Image
                  src="/icon-sm.png"
                  alt="Chintu"
                  width={60}
                  height={60}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white w-8 h-8 rounded-full border-4 border-white flex items-center justify-center animate-bounce">
                <span className="text-sm font-bold">✓</span>
              </div>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)] uppercase mb-2 leading-none">Sync Complete!</h2>
            <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest leading-relaxed mb-10">
              Your interview workspace is ready. Launch the desktop app to begin.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.location.href = "chintu://open"}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Launch Desktop App
              </button>

              <a
                href="https://www.getchintu.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 bg-white text-gray-400 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-gray-900 hover:bg-gray-50 transition-all text-center"
              >
                Download Chintu App
              </a>
            </div>

            <button
              onClick={() => setShowAppPrompt(false)}
              className="mt-12 text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest hover:text-indigo-400 transition-colors"
            >
              Return to Setup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
