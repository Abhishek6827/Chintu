"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadProfileFromDisk, saveProfileToDisk } from "@/components/ProfileModal";
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
  
  const router = useRouter();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
    const draftAbout = localStorage.getItem("chintu_draft_about_me");
    if (draftAbout) setAboutMe(draftAbout);
    
    const draftJd = localStorage.getItem("chintu_draft_jd");
    if (draftJd) setJd(draftJd);

    const checkProfile = async () => {
      if (!user?.id) return;
      
      // 1. Try Supabase first (Cloud)
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('profile_data, raw_profile')
        .eq('id', user.id)
        .single();

      if (profileRow?.profile_data && Object.keys(profileRow.profile_data).length > 0) {
        setHasProfile(true);
        // Save to local disk as cache
        await saveProfileToDisk(profileRow.profile_data);
        if (profileRow.raw_profile) setAboutMe(profileRow.raw_profile);
      } else {
        // 2. Fallback to Local Disk
        const stored = await loadProfileFromDisk();
        setHasProfile(!!stored);
      }
    };
    if (isLoaded && isSignedIn) checkProfile();
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    if (aboutMe.trim()) localStorage.setItem("chintu_draft_about_me", aboutMe);
    else localStorage.removeItem("chintu_draft_about_me");
  }, [aboutMe]);

  useEffect(() => {
    if (jd.trim()) localStorage.setItem("chintu_draft_jd", jd);
    else localStorage.removeItem("chintu_draft_jd");
  }, [jd]);

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
            await saveProfileToDisk(data.profile);
            localStorage.removeItem("chintu_draft_about_me");
            profileSaved = true;
          }
        }
      } catch (err) {
        console.error("Profile refinement failed", err);
      }

      if (!profileSaved) {
        const fallback = {
          name: user?.fullName || "",
          title: "",
          summary: aboutMe.trim(),
          experience: [],
          projects: [],
          skills: { languages: [], frameworks: [], tools: [], other: [] },
          education: [],
          certifications: [],
          achievements: [],
        };
        await saveProfileToDisk(fallback);
        
        // ─── Sync fallback to Supabase ──────────────────────
        await supabase.from('profiles').upsert({
          id: user?.id,
          email: user?.primaryEmailAddress?.emailAddress,
          profile_data: fallback,
          raw_profile: aboutMe.trim(),
          updated_at: new Date().toISOString()
        });
      } else {
        // ─── Sync structured profile to Supabase ────────────
        const stored = await loadProfileFromDisk();
        if (stored) {
          await supabase.from('profiles').upsert({
            id: user?.id,
            email: user?.primaryEmailAddress?.emailAddress,
            profile_data: stored,
            raw_profile: aboutMe.trim(),
            updated_at: new Date().toISOString()
          });
        }
      }
      setIsRefining(false);
    }
    router.push("/room");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0c] text-white overflow-hidden">
      {/* Header / Drag Region */}
      <div className="drag-region h-10 w-full shrink-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">System Online</span>
        </div>
        <div className="no-drag">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-[1px] mx-auto mb-4 shadow-2xl shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0f0f12] rounded-[23px] flex items-center justify-center">
                <span className="text-3xl text-indigo-400">✦</span>
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Chintu</h1>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mt-1 text-center">AI Interview Assistant</p>
          </div>

          <div className="space-y-5">
            {/* Profile Section */}
            {!hasProfile ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Candidate Profile</label>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="Paste your resume or tell about your experience..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none placeholder:text-white/20"
                />
              </div>
            ) : (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-500 text-lg">✓</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Profile Status</p>
                  <p className="text-sm font-bold text-emerald-500">Identity Successfully Loaded</p>
                </div>
              </div>
            )}

            {/* Job Description Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Job Description</label>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description you are interviewing for..."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none placeholder:text-white/20"
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
                  : "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                }
              `}
            >
              <span className="relative z-10">{isRefining ? statusText : "Initiate Session →"}</span>
              {jd.trim() && (hasProfile || aboutMe.trim()) && !isRefining && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-6 text-center opacity-30">
        <p className="text-[9px] font-bold uppercase tracking-[0.4em]">Secure Mode • Ghost Overlay Active</p>
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
