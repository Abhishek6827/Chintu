"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [waitingForAuth, setWaitingForAuth] = useState(false);

  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;
  const BASE_URL = "https://getchintu.com";

  const openInBrowser = (path: string) => {
    if (isElectron) {
      (window as any).electronAPI.openExternal(`${BASE_URL}${path}`);
      setWaitingForAuth(true);
    }
  };

  // Poll for auth state changes (user completes login in browser, Clerk syncs)
  useEffect(() => {
    if (!waitingForAuth) return;
    if (isLoaded && isSignedIn) {
      // User is authenticated — redirect to setup
      window.location.href = "/setup";
    }
  }, [waitingForAuth, isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 selection:bg-indigo-100 flex flex-col overflow-y-auto" style={{ WebkitAppRegion: 'drag' } as any}>
      
      {/* ─── Waiting For Auth Overlay ─── */}
      {waitingForAuth && (
        <div className="fixed inset-0 z-[200] bg-[#f8f9fa] flex flex-col items-center justify-center" style={{ WebkitAppRegion: 'drag' } as any}>
          {/* Animated Rings */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center opacity-20">
            <div className="w-[500px] h-[500px] border border-indigo-200 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute w-[350px] h-[350px] border border-indigo-300 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
            <div className="absolute w-[200px] h-[200px] border border-indigo-400 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
          </div>

          <div className="relative z-10 flex flex-col items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
            {/* Animated Logo */}
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse rounded-full" />
              <Image src="/icon.png" alt="Chintu" className="w-full h-full object-contain relative z-10" width={96} height={96} unoptimized />
            </div>

            {/* Spinner */}
            <div className="relative w-16 h-16 mb-8">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-white py-2 px-4 rounded-full border border-gray-200 shadow-lg mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                Waiting for Authentication
              </p>
            </div>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 text-center max-w-xs leading-relaxed">
              Complete sign-in in your browser.<br />
              This screen will update automatically.
            </p>

            {/* Back Button */}
            <button
              onClick={() => setWaitingForAuth(false)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:border-gray-400 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full relative z-[60]">
        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="w-10 h-10 drop-shadow-xl transition-transform hover:scale-110">
            <Image src="/icon.png" alt="Chintu" className="w-full h-full object-contain" width={40} height={40} unoptimized />
          </div>
          <span className="text-xl font-black tracking-tight uppercase text-gray-900">Chintu</span>
        </div>
        <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {!isSignedIn ? (
            <>
              {isElectron ? (
                <>
                  <button onClick={() => openInBrowser("/sign-in")} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                    Login
                  </button>
                  <button onClick={() => openInBrowser("/sign-up")} className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95">
                    Get Started
                  </button>
                </>
              ) : (
                <>
                  <Link href="/sign-in" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                    Login
                  </Link>
                  <Link href="/sign-up" className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95">
                    Get Started
                  </Link>
                </>
              )}
            </>
          ) : (
            <Link href="/setup" className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95">
              Go to Dashboard
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto w-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Next-Gen Interview Assistant</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-gray-900 mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          Crack any Interview <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">with Chintu Intelligence</span>
        </h1>
        
        <p className="text-lg text-gray-500 mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          The ultimate ghost overlay for your coding interviews. Real-time guidance, neural-network-backed responses, and seamless screen intelligence. 
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
          {isElectron ? (
            <>
              <button onClick={() => openInBrowser("/sign-up")} className="px-10 py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.25em] text-xs rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all">
                Join the Revolution →
              </button>
              <button onClick={() => openInBrowser("/pricing")} className="px-10 py-5 bg-white border border-gray-200 text-gray-400 font-black uppercase tracking-[0.25em] text-xs rounded-2xl hover:border-gray-900 hover:text-gray-900 transition-all">
                View Plans
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-up" className="px-10 py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.25em] text-xs rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all">
                Join the Revolution →
              </Link>
              <Link href="/pricing" className="px-10 py-5 bg-white border border-gray-200 text-gray-400 font-black uppercase tracking-[0.25em] text-xs rounded-2xl hover:border-gray-900 hover:text-gray-900 transition-all">
                View Plans
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 w-full animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-500">
           <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 text-left">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mb-4 font-bold">🧠</div>
              <h3 className="font-black uppercase tracking-widest text-[11px] mb-2">Ghost Intelligence</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Real-time answers that flow naturally during your interviews.</p>
           </div>
           <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 text-left">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl mb-4 font-bold">🎯</div>
              <h3 className="font-black uppercase tracking-widest text-[11px] mb-2">Neural Mapping</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Tailors responses based on your unique profile and resume.</p>
           </div>
           <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 text-left">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl mb-4 font-bold">⚡</div>
              <h3 className="font-black uppercase tracking-widest text-[11px] mb-2">Instant Sync</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Zero-lag visual processing with our proprietary screen capture.</p>
           </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-100 bg-white" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
            <Image src="/icon.png" alt="Chintu" className="w-6 h-6 object-contain" width={40} height={40} unoptimized />
            <span className="text-sm font-black tracking-tight uppercase">Chintu Intelligence</span>
          </div>
          
          <div className="flex items-center gap-8">
            <Link href="/about" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">About Us</Link>
            <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Terms of Service</Link>
            <a href="mailto:welcome@getchintu.com" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors">Contact</a>
          </div>

          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            © 2026 CHINTU.AI • ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>
    </div>
  );
}
