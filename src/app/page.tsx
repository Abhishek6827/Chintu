"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { createClient } from "@/utils/supabase/client";

export default function SetupPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const supabase = createClient();
  const [jd, setJd] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  // Handle hydration / Initial load
  useEffect(() => {
    setMounted(true);
    
    // Clear any previous session context on landing page mount
    sessionStorage.removeItem("jobDescription");
    sessionStorage.removeItem("chintu_pending_raw_profile");

    const checkProfile = async () => {
      if (!user?.id) return;
      
      // Try Supabase first (Cloud)
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('profile_data, raw_profile')
        .eq('id', user.id)
        .single();

      if (profileRow?.profile_data && typeof profileRow.profile_data === 'object' && Object.keys(profileRow.profile_data).length > 0) {
        setHasProfile(true);
        if (profileRow.raw_profile) setAboutMe(profileRow.raw_profile);
      } else {
        setHasProfile(false);
      }
    };
    if (isLoaded && isSignedIn) checkProfile();
  }, [isLoaded, isSignedIn, user?.id, supabase]);

  // If not mounted or Clerk not loaded yet, show empty shell
  if (!mounted || !isLoaded) {
    return <div className="min-h-screen bg-[#0a0a0c]" />;
  }

  // Double check auth (Middleware should handle this, but for safety)
  if (!isSignedIn) {
    router.push("/sign-in");
    return null;
  }

  const handleStart = async () => {
    if (!jd.trim()) return;
    sessionStorage.setItem("jobDescription", jd.trim());

    if (aboutMe.trim() && !hasProfile) {
      setIsRefining(true);
      setStatusText("✨ AI is structuring your profile...");
      let profileSaved = false;

      try {
        const res = await fetch("/api/refine-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText: aboutMe.trim() }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            // Save to Supabase Cloud ONLY
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                profile_data: data.profile,
                raw_profile: aboutMe.trim(),
                updated_at: new Date().toISOString()
              });

            if (upsertError) {
              console.error("Failed to sync profile to Cloud:", upsertError);
            }
            profileSaved = true;
          }
        }
      } catch (err) {
        console.error("Profile refinement failed", err);
      }

      if (!profileSaved) {
        setIsRefining(false);
        setError("Could not structure your profile. Please try again with more detail.");
        return;
      }
      setIsRefining(false);
      setHasProfile(true);
    }
    router.push("/room");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa] text-gray-900 overflow-x-hidden overflow-y-auto">
      {/* Header / Drag Region */}
      <div className="drag-region h-10 w-full shrink-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">System Online</span>
        </div>
        <div className="no-drag">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 drop-shadow-2xl">
              <img src="/icon.png" alt="Chintu" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-gray-900">Chintu</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 text-center">AI Interview Assistant</p>
          </div>

          <div className="space-y-5">
            {/* Profile Section */}
            {!hasProfile ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Candidate Profile</label>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Paste your resume or tell about your experience..."
                  className="w-full h-32 bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-gray-300 shadow-sm"
                />
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 text-lg">✓</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">Profile Status</p>
                  <p className="text-sm font-bold text-emerald-700">Identity Successfully Loaded</p>
                </div>
              </div>
            )}

            {/* Job Description Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Job Description</label>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description you are interviewing for..."
                className="w-full h-40 bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-gray-300 shadow-sm"
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handleStart}
              disabled={!jd.trim() || (!hasProfile && !aboutMe.trim()) || isRefining}
              className={`
                w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden group
                ${jd.trim() && (hasProfile || aboutMe.trim()) && !isRefining
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95"
                  : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                }
              `}
            >
              <span className="relative z-10">{isRefining ? statusText : "Initiate Session →"}</span>
              {jd.trim() && (hasProfile || aboutMe.trim()) && !isRefining && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-6 text-center opacity-40">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500">Secure Mode • Ghost Overlay Active</p>
      </div>

      {/* Full Page Loading Animation — RESTORED */}
      {isRefining && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0c] backdrop-blur-2xl">
          <div className="relative flex items-center justify-center w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/30 animate-[spin_3s_linear_infinite]"></div>
            <div className="absolute inset-2 rounded-full border-[3px] border-t-purple-500 border-purple-500/20 animate-[spin_1.5s_ease-in-out_infinite_reverse]"></div>
            <div className="absolute inset-4 rounded-full border-[3px] border-b-cyan-400 border-cyan-400/20 animate-[spin_2s_linear_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse">
              ✨
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 animate-pulse tracking-wide mb-3 text-center px-4">
            {statusText || "AI is structuring your profile..."}
          </h2>
          <div className="flex gap-1.5 items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
          <p className="mt-8 text-xs text-white/30 font-medium tracking-[0.2em] uppercase text-center max-w-xs leading-relaxed">
            Please wait...<br />
            <span className="text-white/20 opacity-70 text-[0.65rem] normal-case tracking-normal">Structuring your background for personalized answers</span>
          </p>
        </div>
      )}
    </div>
  );
}
