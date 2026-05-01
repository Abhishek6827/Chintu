"use client";

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Zap, Shield, Target, Cpu, MessageSquare } from 'lucide-react';

import GlobalFooter from '@/components/GlobalFooter';
import ContactForm from '@/components/ContactForm';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isElectron = typeof window !== "undefined" && (!!(window as any).electronAPI || navigator.userAgent.toLowerCase().includes('electron'));

  useEffect(() => {
    if (isLoaded && isElectron) {
      if (isSignedIn) {
        // App always starts at setup/dashboard
        router.push("/setup");
      } else {
        router.push("/sign-in");
      }
    }
  }, [isLoaded, isElectron, isSignedIn, router]);

  // Scroll Reveal Logic
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  if (mounted && isElectron) return <div className="h-screen bg-[#f8f9fa] flex items-center justify-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 selection:bg-indigo-100 flex flex-col relative overflow-x-hidden" style={{ WebkitAppRegion: 'drag' } as any}>
      
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/20 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="w-8 h-8 drop-shadow-xl transition-transform hover:scale-110">
              <Image src="https://www.getchintu.com/icon.png" alt="Chintu" className="w-full h-full object-contain" width={40} height={40} unoptimized />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-gray-900">Chintu <span className="text-indigo-600">AI</span></span>
          </div>
          
          <div className="flex items-center gap-4 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
            {!isSignedIn ? (
              <>
                <Link href="/sign-in" className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors px-4">
                  Portal Login
                </Link>
                <Link href="/sign-up" className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  Get Started <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <button 
                onClick={() => router.push("/setup")}
                className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Go to Dashboard <Zap className="w-3 h-3 fill-current" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6 pt-20 pb-32 max-w-5xl mx-auto w-full">
          <div className="reveal inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-10 transition-all duration-1000">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">v2.0 Stealth Intelligence Active</span>
          </div>
          
          <h1 className="reveal text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-gray-900 mb-8 leading-[0.9] transition-all duration-1000 delay-200 uppercase">
            Master the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500">Interview.</span>
          </h1>
          
          <p className="reveal text-sm sm:text-lg text-gray-400 mb-14 max-w-2xl leading-relaxed font-bold uppercase tracking-wide transition-all duration-1000 delay-400">
            The ultimate strategic environment for technical interviews. Real-time guidance, neural-network-backed responses, and seamless stealth intelligence. 
          </p>

          <div className="reveal flex flex-col sm:flex-row gap-5 transition-all duration-1000 delay-500">
            {isSignedIn ? (
              <Link href="/setup" className="px-12 py-6 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                Go to Dashboard <Zap className="w-4 h-4 fill-current" />
              </Link>
            ) : (
              <Link href="/sign-up" className="px-12 py-6 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                Join the Revolution <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link href="/pricing" className="px-12 py-6 bg-white border border-gray-100 text-gray-400 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl hover:border-indigo-500/30 hover:text-indigo-600 transition-all flex items-center justify-center">
              View Strategy Plans
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 px-6 bg-white/40 backdrop-blur-3xl border-y border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="reveal text-center mb-24 transition-all duration-1000">
              <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">Core Architecture</h2>
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 uppercase">Built for Total Dominance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="reveal bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-700 group">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="font-black uppercase tracking-widest text-[12px] mb-4 text-gray-900">Ghost Mode</h3>
                <p className="text-[13px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">Low-level hardware abstraction ensures your overlay remains undetectable by monitoring software.</p>
              </div>

              <div className="reveal bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-700 delay-200 group">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="font-black uppercase tracking-widest text-[12px] mb-4 text-gray-900">Neural Sync</h3>
                <p className="text-[13px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">Context-aware responses mapped directly to your unique profile, resume, and job description.</p>
              </div>

              <div className="reveal bg-white p-10 rounded-[3rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-700 delay-400 group">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <Cpu className="w-7 h-7" />
                </div>
                <h3 className="font-black uppercase tracking-widest text-[12px] mb-4 text-gray-900">Ultra Engine</h3>
                <p className="text-[13px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">Zero-lag visual processing using proprietary screen intelligence for instant interview support.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-32 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="reveal transition-all duration-1000">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
                <MessageSquare className="w-3 h-3 text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Support Command</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-8 uppercase leading-tight">Need Support or <br /><span className="text-indigo-600">Intelligence?</span></h2>
              <p className="text-gray-400 font-bold uppercase tracking-wide leading-relaxed mb-10 max-w-md">
                Our team is standing by 24/7 to assist with your interview strategy, subscription inquiries, or technical deployment.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">📧</div>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-600">contact@getchintu.com</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">🌐</div>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-600">Global Coverage Active</span>
                </div>
              </div>
            </div>

            <div className="reveal transition-all duration-1000 delay-300">
              <div className="bg-white p-8 sm:p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl shadow-indigo-500/5">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <GlobalFooter />

      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 1s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
