"use client";
import { SignIn, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setRedirecting(true);
      router.push("/setup");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col relative overflow-x-hidden overflow-y-auto" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Background Pulse Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none no-drag flex items-center justify-center opacity-30">
        <div className="w-[600px] h-[600px] border-[1px] border-indigo-200 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute w-[400px] h-[400px] border-[1px] border-indigo-300 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
      </div>

      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 no-drag">
        <button 
          onClick={() => (window as any).electronAPI?.minimize()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-200 shadow-sm"
          title="Minimize"
        >
          ─
        </button>
      </div>

      <div className="absolute top-4 left-4 z-50 no-drag">
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

      <div className="flex-1 flex flex-col items-center justify-start py-8 sm:py-12 pb-20 px-4 sm:px-6 no-drag relative z-10">
        <div className="w-full max-w-[440px] flex flex-col items-center">
          {/* Logo Section */}
          <div className="text-center mb-8 relative">
            <div className="w-20 h-20 mx-auto mb-4 drop-shadow-2xl relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full" />
              <Image src="/icon.png" alt="Chintu" className="w-full h-full object-contain relative z-10" width={40} height={40} unoptimized />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-gray-900">Chintu</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">AI Interview Assistant</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-indigo-50 py-1.5 px-3 rounded-full border border-indigo-100">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                {redirecting ? "Redirecting..." : "Secure Login Portal"}
              </p>
            </div>
          </div>

          <div className="w-full bg-white rounded-[32px] border border-gray-200 shadow-2xl shadow-indigo-500/5 mb-8 relative overflow-hidden group transition-all duration-500 hover:shadow-indigo-500/10">
            {/* Shimmer effect */}
            <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 animate-[shimmer_2s_infinite] pointer-events-none z-10" />
            
            <div className="relative z-0">
              <SignIn 
                fallbackRedirectUrl="/setup"
                forceRedirectUrl="/setup"
                appearance={{
                  elements: {
                    card: "shadow-none border-none bg-transparent w-full",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border-gray-200 hover:bg-indigo-50 text-gray-700 font-bold h-12 transition-all relative overflow-hidden",
                    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-sm font-bold uppercase tracking-widest h-12 transition-all",
                    footerActionLink: "text-indigo-600 hover:text-indigo-500 font-black",
                    formFieldInput: "h-12 rounded-xl border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium",
                    dividerText: "text-[10px] font-black text-gray-400 uppercase tracking-widest",
                    dividerRow: "before:bg-gray-100 after:bg-gray-100",
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-emerald-500 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
            </svg>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-50">
              Secure Connection Active
            </p>
          </div>
        </div>
      </div>

      {/* Loading Overlay when redirecting */}
      {redirecting && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Authentication Confirmed</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Redirecting to Dashboard...</p>
        </div>
      )}
    </div>
  );
}
