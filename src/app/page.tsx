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

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-3xl">✦</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Angel AI</h1>
          <p className="text-sm text-white/60 mt-1">Interview Copilot</p>
        </div>

        {/* Job Description */}
        <div className="w-full max-w-sm">
          <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">
            Job Description
          </label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description here..."
            rows={8}
            className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
          />

          <button
            onClick={handleStart}
            disabled={!jd.trim()}
            className={`
              w-full mt-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200
              ${jd.trim()
                ? "bg-white text-indigo-600 shadow-lg shadow-white/20 hover:shadow-white/40 hover:scale-[1.02]"
                : "bg-white/10 text-white/30 cursor-not-allowed"
              }
            `}
          >
            Start Session →
          </button>
        </div>

        <p className="text-[10px] text-white/30 mt-6">🔒 Invisible to screen sharing</p>
      </div>
    </div>
  );
}
