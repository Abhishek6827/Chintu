"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredProfile } from "@/components/ProfileModal";

const STORAGE_KEY = "chintu_user_profile";

export default function SetupPage() {
  const [jd, setJd] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [statusText, setStatusText] = useState("");
  const router = useRouter();

  // Check profile on mount AND on window focus (in case user comes back)
  useEffect(() => {
    const draft = localStorage.getItem("chintu_draft_about_me");
    if (draft) setAboutMe(draft);

    const draftJd = localStorage.getItem("chintu_draft_jd");
    if (draftJd) setJd(draftJd);

    const checkProfile = () => {
      const stored = getStoredProfile();
      setHasProfile(!!stored);
    };
    checkProfile();
    window.addEventListener("focus", checkProfile);
    return () => window.removeEventListener("focus", checkProfile);
  }, []);

  useEffect(() => {
    if (aboutMe.trim()) {
      localStorage.setItem("chintu_draft_about_me", aboutMe);
    } else {
      localStorage.removeItem("chintu_draft_about_me");
    }
  }, [aboutMe]);

  useEffect(() => {
    if (jd.trim()) {
      localStorage.setItem("chintu_draft_jd", jd);
    } else {
      localStorage.removeItem("chintu_draft_jd");
    }
  }, [jd]);

  const handleStart = async () => {
    if (!jd.trim()) return;
    sessionStorage.setItem("jobDescription", jd.trim());

    // If user typed aboutMe and no profile exists, refine & save it
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
          if (data.profile && typeof data.profile === "object") {
            // Save the structured profile
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.profile));
            localStorage.removeItem("chintu_draft_about_me");
            profileSaved = true;
            setStatusText("✅ Profile saved! Starting session...");
          }
        }
      } catch {
        // Network/API error — handled below
      }

      // If API failed or returned bad data, save raw text as fallback profile
      if (!profileSaved) {
        const fallbackProfile = {
          name: "",
          title: "",
          summary: aboutMe.trim(),
          experience: [],
          projects: [],
          skills: { languages: [], frameworks: [], tools: [], other: [] },
          education: [],
          certifications: [],
          achievements: [],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackProfile));
        // Also flag for background re-refine on room page
        sessionStorage.setItem("chintu_pending_raw_profile", aboutMe.trim());
        setStatusText("Profile saved (will refine in background)...");
      }

      setIsRefining(false);
      // Small delay so user sees the success message
      await new Promise((r) => setTimeout(r, 400));
    }

    router.push("/room");
  };

  return (
    <div className="app-container">
      {/* Draggable header */}
      <div className="drag-region h-10 shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 overflow-y-auto">
        {/* Logo */}
        <div className="mb-5 text-center shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            <span className="text-2xl">✦</span>
          </div>
          <h1 className="text-xl font-bold text-white">Chintu</h1>
          <b className="text-xs text-white/60 mt-1 block">Dalaali shuru Karein??</b>
        </div>

        <div className="w-full max-w-sm shrink-0 flex flex-col min-h-0 gap-3">
          {/* About Me — only if no profile stored */}
          {!hasProfile && (
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
                About Me
              </label>
              <textarea
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                placeholder="Paste your resume, LinkedIn summary, or tell about yourself..."
                className="w-full h-24 md:h-32 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
              />
              <p className="text-[0.5625rem] text-white/30 mt-1">AI will structure this into your profile. You can edit it later in Settings → Profile.</p>
            </div>
          )}

          {/* Profile exists indicator */}
          {hasProfile && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <span className="text-emerald-400 text-sm">✓</span>
              <span className="text-emerald-300 text-xs font-medium">Profile loaded — AI will personalize answers for you</span>
            </div>
          )}

          {/* Job Description */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
              Job Description
            </label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-28 md:h-40 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!jd.trim() || isRefining}
            className={`
              w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 shrink-0
              ${jd.trim() && !isRefining
                ? "bg-white text-indigo-600 shadow-lg shadow-white/20 hover:shadow-white/40 hover:scale-[1.02]"
                : "bg-white/10 text-white/30 cursor-not-allowed"
              }
            `}
          >
            {isRefining ? statusText : "Start Session →"}
          </button>
        </div>

        <p className="text-[0.625rem] text-white/30 mt-5">🔒 Invisible to screen sharing</p>
      </div>

      {/* Full Page Loading Animation */}
      {isRefining && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-2xl">
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
          <p className="mt-8 text-xs text-white/40 font-medium tracking-[0.2em] uppercase text-center max-w-xs leading-relaxed">
            Please wait...<br />
            <span className="text-white/30 text-[0.65rem] normal-case tracking-normal">This may take 5-10 minutes for the first time</span>
          </p>
        </div>
      )}
    </div>
  );
}
