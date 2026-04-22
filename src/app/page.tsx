"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [jd, setJd] = useState("");
  const router = useRouter();

  const handleStart = () => {
    if (!jd.trim()) return;
    sessionStorage.setItem("jobDescription", jd.trim());
    router.push("/room");
  };

  return (
    <div className="app-container">
      {/* Draggable header */}
      <div className="drag-region h-10 shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-6 sm:pb-8 overflow-y-auto">
        {/* Logo */}
        <div className="mb-4 sm:mb-6 text-center shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg">
            <span className="text-2xl sm:text-3xl">✦</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Chintu</h1>
          <b className="text-xs sm:text-sm text-white/60 mt-1 block">Dalaali shuru Karein??</b>
        </div>

        {/* Job Description */}
        <div className="w-full max-w-sm shrink-0 flex flex-col min-h-0">
          <label className="block text-[0.625rem] sm:text-xs font-semibold text-white/70 mb-1 sm:mb-2 uppercase tracking-wider">
            Job Description
          </label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full h-24 sm:h-32 md:h-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-xs sm:text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none shrink-0"
          />

          <button
            onClick={handleStart}
            disabled={!jd.trim()}
            className={`
              w-full mt-3 sm:mt-4 py-2.5 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 shrink-0
              ${jd.trim()
                ? "bg-white text-indigo-600 shadow-lg shadow-white/20 hover:shadow-white/40 hover:scale-[1.02]"
                : "bg-white/10 text-white/30 cursor-not-allowed"
              }
            `}
          >
            Start Session →
          </button>
        </div>

        <p className="text-[0.625rem] text-white/30 mt-6">🔒 Invisible to screen sharing</p>
      </div>
    </div>
  );
}
