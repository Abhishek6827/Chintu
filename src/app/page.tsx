"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Zap, Shield, Target, Cpu, MessageSquare } from 'lucide-react';

import GlobalFooter from '@/components/GlobalFooter';
import ContactForm from '@/components/ContactForm';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { MarqueeReviews } from '@/components/MarqueeReviews';

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [userCredits, setUserCredits] = React.useState<number | null>(null);
  const [userPlan, setUserPlan] = React.useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user data for badge/credits
  useEffect(() => {
    if (isSignedIn) {
      const fetchProfile = async () => {
        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const { profile } = await res.json();
            if (profile) {
              setUserCredits(profile.credits);
              setUserPlan(profile.plan || "free");
            }
          }
        } catch (err) {
          console.error("LandingPage: Error fetching profile:", err);
        }
      };
      fetchProfile();
    }
  }, [isSignedIn]);

  const isElectron = typeof window !== "undefined" && (!!(window as any).electronAPI || navigator.userAgent.toLowerCase().includes('electron'));

  useEffect(() => {
    if (isLoaded && isElectron) {
      if (isSignedIn) {
        // If we already have a JD in this session, jump straight to the room
        const jd = sessionStorage.getItem("jobDescription");
        if (jd) {
          router.push("/room");
        } else {
          router.push("/setup");
        }
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
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-md overflow-hidden p-1.5 hover:scale-110 transition-transform">
              <Image 
                src="https://www.getchintu.com/icon.png" 
                alt="Chintu" 
                className="w-full h-full object-contain" 
                width={32} 
                height={32} 
                unoptimized 
              />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-gray-900">Chintu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI</span></span>
          </div>
          
          <div className="flex items-center gap-4 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
            {!isSignedIn ? (
              <>
                <Link href="/sign-in" className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 transition-colors px-4">
                  Portal Login
                </Link>
                <Link href="/sign-up" className="relative group overflow-hidden bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  Get Started <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {userPlan !== 'free' && userPlan !== '' && (
                  <>
                    {/* User Info & Badge */}
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-indigo-50/50 border border-indigo-100 backdrop-blur-sm">
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Energy Sync</span>
                        <span className="text-[11px] font-black text-indigo-600 tracking-tight flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-indigo-600" /> {userCredits ?? '--'}
                        </span>
                      </div>
                      <div className="h-6 w-[1px] bg-indigo-200/50 mx-0.5" />
                      <div className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest shadow-md">
                        {userPlan}
                      </div>
                    </div>

                    <Link 
                      href="/setup"
                      className="relative group overflow-hidden bg-white border-2 border-indigo-100 text-indigo-600 text-[9px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      Enter The App <Sparkles className="w-3 h-3 fill-indigo-600" />
                    </Link>
                  </>
                )}

                {userPlan === 'free' && (
                  <Link 
                    href="/pricing"
                    className="relative group overflow-hidden bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    Upgrade Plan <Zap className="w-3 h-3 fill-current" />
                  </Link>
                )}

                <div className="scale-105 hover:scale-110 transition-transform">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            ) }
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-24 pb-32 max-w-6xl mx-auto w-full">
          <div className="reveal inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-10 transition-all duration-1000 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">v2.5 Hyper-Intelligence Active</span>
          </div>
          
          <h1 className="reveal text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-gray-900 mb-8 leading-[0.85] transition-all duration-1000 delay-200 uppercase">
            Destroy Every <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">Assessment.</span>
          </h1>
          
          <p className="reveal text-sm sm:text-xl text-gray-400 mb-14 max-w-3xl leading-relaxed font-bold uppercase tracking-widest transition-all duration-1000 delay-400">
            Interviews, Global Exams, MCQs, or Technical Tests. <br className="hidden sm:block" />
            Capture any problem. Get the perfect solution. Instantly.
          </p>

          <div className="reveal flex flex-col sm:flex-row gap-6 transition-all duration-1000 delay-500">
            {isSignedIn ? (
              <Link href="/setup" className="relative group overflow-hidden px-16 py-7 bg-indigo-600 text-white font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4">
                Access Dashboard <Zap className="w-5 h-5 fill-current" />
              </Link>
            ) : (
              <Link href="/sign-up" className="relative group overflow-hidden px-16 py-7 bg-indigo-600 text-white font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4">
                Join the Revolution <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            <Link href="/pricing" className="px-16 py-7 bg-white border-2 border-gray-100 text-gray-400 font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl hover:border-indigo-500/50 hover:text-indigo-600 hover:bg-indigo-50/10 transition-all flex items-center justify-center">
              View Access Tiers
            </Link>
          </div>
        </section>

        {/* Total Coverage Section */}
        <section className="py-32 px-6 bg-[#0f0f12] text-white overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="reveal text-center mb-24 transition-all duration-1000">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.5em] mb-6">Omniscient Intelligence</h2>
              <p className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-none">
                Zero Gaps. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Total Dominance.</span>
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
              {[
                { title: "Technical Interviews", desc: "Live coding, architecture & system design." },
                { title: "Global Exams", desc: "Certifications, University & Competitive tests." },
                { title: "MCQ Blitz", desc: "Snapshot logic for instant accurate answers." },
                { title: "Aptitude & Logic", desc: "Complex reasoning & mathematical proofs." },
                { title: "Long Form", desc: "Essays, descriptive answers & case studies." },
                { title: "Behavioral", desc: "Psychometric & soft-skills optimization." },
                { title: "Live Tests", desc: "Time-critical assessments & hackathons." },
                { title: "Data Science", desc: "Statistical modeling & data interpretation." }
              ].map((item, i) => (
                <div key={i} className="reveal bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-500 group">
                  <h4 className="font-black text-[12px] uppercase tracking-widest text-indigo-400 mb-3 group-hover:text-white transition-colors">{item.title}</h4>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight leading-relaxed group-hover:text-gray-300 transition-colors">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Snapshot Section */}
        <section className="py-40 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="reveal transition-all duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-100 rounded-full mb-8">
                <Zap className="w-4 h-4 text-purple-600 fill-current" />
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Snapshot Intelligence</span>
              </div>
              <h2 className="text-5xl sm:text-7xl font-black tracking-tighter text-gray-900 mb-8 uppercase leading-[0.9]">
                See it. <br />
                <span className="text-purple-600">Solve it.</span>
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-md text-sm sm:text-base">
                Stuck on a complex MCQ or a difficult equation? Just take a screenshot. Our vision engine processes the context, identifies the core problem, and generates the exact answer in milliseconds.
              </p>
              <ul className="space-y-5">
                {['Instant OCR Processing', 'Multi-Step Logical Proofs', 'Source Verification', 'Context-Aware Hints'].map((li, i) => (
                  <li key={i} className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-gray-600">
                    <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px]">✓</div>
                    {li}
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal relative transition-all duration-1000 delay-300">
               <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[4rem] blur-3xl opacity-20 animate-pulse" />
               <div className="relative bg-white border border-gray-100 p-4 rounded-[4rem] shadow-2xl">
                 <div className="bg-[#0a0a0c] rounded-[3rem] aspect-video flex items-center justify-center overflow-hidden border border-white/5">
                    {/* Placeholder for an image or animation showing the capture flow */}
                    <div className="text-center px-10">
                       <div className="w-20 h-20 bg-indigo-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                          <Target className="w-10 h-10 text-indigo-400" />
                       </div>
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Vision Engine Processing...</p>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        <TestimonialsSection />

        {/* Features Grid */}
        <section className="py-32 px-6 bg-indigo-50/30 border-y border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="reveal text-center mb-24 transition-all duration-1000">
              <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.5em] mb-4">Tactical Superiority</h2>
              <p className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 uppercase">Engineered for Success</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="reveal bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 group">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg shadow-emerald-500/5">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="font-black uppercase tracking-[0.2em] text-[13px] mb-6 text-gray-900">Ghost Protocol</h3>
                <p className="text-[13px] text-gray-400 font-bold uppercase tracking-wide leading-relaxed">Advanced hardware-level abstraction that keeps your AI companion invisible to all proctoring and monitoring systems.</p>
              </div>

              <div className="reveal bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 delay-200 group">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-500/5">
                  <Cpu className="w-8 h-8" />
                </div>
                <h3 className="font-black uppercase tracking-[0.2em] text-[13px] mb-6 text-gray-900">Quantum Synthesis</h3>
                <p className="text-[13px] text-gray-400 font-bold uppercase tracking-wide leading-relaxed">Proprietary LLM orchestration that combines multiple specialized models for zero-error technical and logical accuracy.</p>
              </div>

              <div className="reveal bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 delay-400 group">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center text-3xl mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg shadow-purple-500/5">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-black uppercase tracking-[0.2em] text-[13px] mb-6 text-gray-900">Stealth Overlay</h3>
                <p className="text-[13px] text-gray-400 font-bold uppercase tracking-wide leading-relaxed">Ultra-minimalist floating interface that stays exactly where you need it, hidden from screenshots and screen recordings.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-40 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="reveal transition-all duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-8">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Support Command</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-black tracking-tighter text-gray-900 mb-8 uppercase leading-[0.9]">
                Deploy <br /><span className="text-indigo-600">Intelligence.</span>
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-12 max-w-md text-sm sm:text-base">
                Have questions about deployment or strategy? Our elite support team is active 24/7 to ensure your total success.
              </p>
              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-xl shadow-indigo-500/5 text-xl">📧</div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Secure Comms</span>
                    <span className="text-[13px] font-black uppercase tracking-[0.1em] text-gray-700">contact@getchintu.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-xl shadow-indigo-500/5 text-xl">🌐</div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Status</span>
                    <span className="text-[13px] font-black uppercase tracking-[0.1em] text-emerald-500">Global Infrastructure Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="reveal transition-all duration-1000 delay-300">
              <div className="bg-white p-10 sm:p-16 rounded-[4.5rem] border border-gray-100 shadow-[0_50px_100px_-20px_rgba(79,70,229,0.12)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4.5rem] -mr-10 -mt-10" />
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarqueeReviews />
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
