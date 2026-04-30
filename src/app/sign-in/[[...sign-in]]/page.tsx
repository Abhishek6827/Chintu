"use client";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f9fa] relative overflow-y-auto py-10" style={{ WebkitAppRegion: 'drag' } as any}>
      <button 
        onClick={() => (window as any).electronAPI?.minimize()}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-200 shadow-sm"
        style={{ WebkitAppRegion: 'no-drag' } as any}
        title="Minimize"
      >
        ─
      </button>

      {/* Back to Home Button */}
      <button 
        onClick={() => window.location.href = "/"}
        className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-200 shadow-sm"
        style={{ WebkitAppRegion: 'no-drag' } as any}
        title="Back to Home"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </button>

      <div className="flex flex-col items-center w-full max-w-[480px] px-6" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 drop-shadow-2xl">
            <Image src="/icon.png" alt="Chintu" width={80} height={80} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase text-gray-900">Chintu</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 text-center">AI Interview Assistant</p>
          <p className="text-[9px] font-medium text-indigo-500/60 uppercase tracking-widest mt-4 bg-indigo-50 py-1 px-3 rounded-full inline-block">
            Auth will open in a new window
          </p>
        </div>

        <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-2xl p-2">
          <SignIn 
            appearance={{
              elements: {
                card: "shadow-none border-none bg-transparent",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold",
                formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-sm font-bold uppercase tracking-widest",
                footerActionLink: "text-indigo-600 hover:text-indigo-500 font-bold",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
