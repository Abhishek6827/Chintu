"use client";
import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col relative overflow-x-hidden" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
          onClick={() => (window as any).electronAPI?.minimize()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-200 shadow-sm"
          title="Minimize"
        >
          ─
        </button>
      </div>

      <div className="absolute top-4 left-4 z-50 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
          onClick={() => window.location.href = "/"}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-200 shadow-sm"
          title="Back to Home"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start py-12 px-6 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="w-full max-w-[440px] flex flex-col items-center">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 drop-shadow-2xl">
              <Image src="/icon.png" alt="Chintu" width={80} height={80} className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-gray-900">Chintu</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1 text-center">Join the AI Revolution</p>
          </div>

          <div className="w-full bg-white rounded-[32px] border border-gray-200 shadow-2xl overflow-hidden mb-8">
            <SignUp 
              appearance={{
                elements: {
                  card: "shadow-none border-none bg-transparent w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold h-11",
                  formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-sm font-bold uppercase tracking-widest h-11",
                  footerActionLink: "text-indigo-600 hover:text-indigo-500 font-bold",
                  formFieldInput: "h-11 rounded-xl border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500",
                  dividerText: "text-[10px] font-bold text-gray-400 uppercase tracking-widest",
                  dividerRow: "before:bg-gray-100 after:bg-gray-100",
                }
              }}
            />
          </div>

          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em] opacity-40">Secure Connection Established</p>
        </div>
      </div>
    </div>
  );
}
