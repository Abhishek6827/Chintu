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
    const checkProfile = () => {
      const stored = getStoredProfile();
      setHasProfile(!!stored);
    };
    checkProfile();
    window.addEventListener("focus", checkProfile);
    return () => window.removeEventListener("focus", checkProfile);
  }, []);

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
    </div>
  );
}
