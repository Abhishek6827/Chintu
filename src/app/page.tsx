"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';

import GlobalFooter from '@/components/GlobalFooter';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

  useEffect(() => {
    if (isLoaded && isElectron) {
      if (isSignedIn) {
        const jd = sessionStorage.getItem("jobDescription");
        router.push(jd ? "/room" : "/setup");
      } else {
        router.push("/sign-in");
      }
    }
  }, [isLoaded, isElectron, isSignedIn, router]);

  if (isElectron && isLoaded) return <div className="h-screen bg-[#f8f9fa] flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;


  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 selection:bg-indigo-100 flex flex-col overflow-y-auto" style={{ WebkitAppRegion: 'drag' } as any}>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full relative z-[60]">
        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="w-8 h-8 drop-shadow-xl transition-transform hover:scale-110">
            <Image src="https://www.getchintu.com/icon.png" alt="Chintu" className="w-full h-full object-contain" width={40} height={40} unoptimized />
          </div>
          <span className="text-lg font-black tracking-tighter uppercase text-gray-900">Chintu <span className="text-indigo-600">SaaS</span></span>
        </div>
        <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {!isSignedIn ? (
            <>
              <Link href="/sign-in" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                Login
              </Link>
              <Link href="/sign-up" className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95">
                Get Started
              </Link>
            </>
          ) : (
            <button 
              onClick={() => {
                const jd = sessionStorage.getItem("jobDescription");
                router.push(jd ? "/room" : "/setup");
              }}
              className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 sm:py-24 max-w-4xl mx-auto w-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Next-Gen Interview Intelligence</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-gray-900 mb-8 leading-[1] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 uppercase">
          Crack any <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient">Interview.</span>
        </h1>
        
        <p className="text-sm sm:text-base text-gray-400 mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200 font-bold uppercase tracking-wide">
          The ultimate strategic environment for technical interviews. Real-time guidance, neural-network-backed responses, and seamless stealth intelligence. 
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
          <Link href="/sign-up" className="px-10 py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all">
            Join the Revolution →
          </Link>
          {isElectron ? (
            <button onClick={() => (window as any).electronAPI.openExternal("https://www.getchintu.com/pricing")} className="px-10 py-5 bg-white border border-gray-200 text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:border-gray-900 hover:text-gray-900 transition-all">
              View Pricing
            </button>
          ) : (
            <Link href="/pricing" className="px-10 py-5 bg-white border border-gray-200 text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl hover:border-gray-900 hover:text-gray-900 transition-all">
              View Pricing
            </Link>
          )}
        </div>

        {/* Feature Cards Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 w-full animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-500">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left group hover:border-indigo-500/30 transition-all">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mb-4 font-bold group-hover:scale-110 transition-transform">🧠</div>
              <h3 className="font-black uppercase tracking-widest text-[10px] mb-2 text-gray-900">Ghost Intelligence</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">Real-time answers that flow naturally during your interviews.</p>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left group hover:border-indigo-500/30 transition-all">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl mb-4 font-bold group-hover:scale-110 transition-transform">🎯</div>
              <h3 className="font-black uppercase tracking-widest text-[10px] mb-2 text-gray-900">Neural Mapping</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">Tailors responses based on your unique profile and resume.</p>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left group hover:border-indigo-500/30 transition-all">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-xl mb-4 font-bold group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="font-black uppercase tracking-widest text-[10px] mb-2 text-gray-900">Instant Sync</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">Zero-lag visual processing with our proprietary screen capture.</p>
           </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
