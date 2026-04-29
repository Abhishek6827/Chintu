"use client";
import { SignUp } from "@clerk/nextjs";


export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 relative" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Minimize Button */}
      <button 
        onClick={() => (window as any).electronAPI?.minimize()}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all border border-slate-800"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        ─
      </button>

      <div className="p-4 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <SignUp />
      </div>
    </div>
  );
}
