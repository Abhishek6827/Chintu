"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [jd, setJd] = useState("");
  const [aboutYou, setAboutYou] = useState("");
  const router = useRouter();

  const handleStart = () => {
    if (!jd.trim()) return;
    sessionStorage.setItem("jobDescription", jd.trim());
    sessionStorage.setItem("aboutYou", aboutYou.trim());
    router.push("/room");
  };

  return (
    <div className="app-container">
      {/* Draggable header */}
      <div className="drag-region h-10 shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 overflow-y-auto">
        {/* Logo */}
        <div className="mb-4 text-center shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            <span className="text-2xl">✦</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Chintu</h1>
          <b className="text-sm text-white/60 mt-1 block">Dalaali shuru Karein??</b>
        </div>

        {/* Form Fields */}
        <div className="w-full max-w-sm shrink-0 flex flex-col min-h-0 gap-3">
          {/* Job Description */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
              Job Description
            </label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-24 md:h-32 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none shrink-0"
            />
          </div>

          {/* About You */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
              About You <span className="text-white/40 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={aboutYou}
              onChange={(e) => setAboutYou(e.target.value)}
              placeholder="Your experience, projects, skills, tech stack... AI will use this to personalize answers"
              className="w-full h-20 md:h-28 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none shrink-0"
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!jd.trim()}
            className={`
              w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 shrink-0
              ${jd.trim()
                ? "bg-white text-indigo-600 shadow-lg shadow-white/20 hover:shadow-white/40 hover:scale-[1.02]"
                : "bg-white/10 text-white/30 cursor-not-allowed"
              }
            `}
          >
            Start Session →
          </button>
        </div>

        <p className="text-[0.625rem] text-white/30 mt-4">🔒 Invisible to screen sharing</p>
      </div>
    </div>
  );
}
