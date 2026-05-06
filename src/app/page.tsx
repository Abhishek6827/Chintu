"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, Check, Star, Sparkles, Zap, Shield, PlayCircle, Globe, Search, Code, Target, BookOpen, Layers, MousePointer2, Cpu, MessageSquare 
} from "lucide-react";

import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import GlobalFooter from '@/components/GlobalFooter';
import ContactForm from '@/components/ContactForm';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { MarqueeReviews } from '@/components/MarqueeReviews';
import { TextReveal } from '@/components/magicui/text-reveal';
import { Meteors } from '@/components/magicui/meteors';
import CardSpread from '@/components/animata/card/card-spread';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [userCredits, setUserCredits] = React.useState<number | null>(null);
  const [userPlan, setUserPlan] = React.useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      const fetchProfile = async () => {
        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const { profile } = await res.json();
            if (profile) {
              setUserCredits(profile.credits);
              setUserPlan((profile.plan || "free").toLowerCase());
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

  const { currentTheme, toggleTheme } = useThemeToggle();



  useEffect(() => {
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('reveal-visible');
      });
    }, observerOptions);
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (mounted && isElectron) return (
    <div className="h-screen bg-[var(--bg-app)] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] selection:bg-indigo-500/20 flex flex-col relative overflow-x-hidden" style={{ WebkitAppRegion: 'drag' } as any}>

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {!isElectron && userPlan !== "free" && userPlan !== "" && <Meteors number={30} />}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/20 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-[100] bg-[var(--bg-app)]/70 backdrop-blur-2xl border-b border-[var(--glass-border)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-md overflow-hidden p-1.5 hover:scale-110 transition-transform">
              <Image src="https://www.getchintu.com/icon.png" alt="Chintu" className="w-full h-full object-contain" width={32} height={32} unoptimized />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-[var(--text-main)]">
              Chintu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hidden md:flex items-center gap-6"
            >
              <Link href="/blog" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group">
                Blog
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="/faq" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group">
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
              </Link>
            </motion.div>
            {!isSignedIn ? (
              <>
                <Link href="/sign-in" className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 transition-colors px-4">
                  Portal Login
                </Link>
                <Link href="/sign-up" className="relative group overflow-hidden bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                  Get Started <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {userPlan !== 'free' && userPlan !== '' && (
                  <>
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] backdrop-blur-md shadow-sm">
                      <AnimatedThemeToggler
                        theme={currentTheme}
                        onToggle={toggleTheme}
                        className="bg-[var(--bg-app)] border-[var(--glass-border)] text-[var(--text-dim)] hover:text-[var(--text-main)] shadow-sm"
                      />
                      <div className="h-6 w-[1px] bg-[var(--glass-border)] mx-0.5" />
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Energy Sync</span>
                        <span className="text-[11px] font-black text-indigo-400 tracking-tight flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-indigo-400" /> {userCredits ?? '--'}
                        </span>
                      </div>
                      <div className="h-6 w-[1px] bg-[var(--glass-border)] mx-0.5" />
                      <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                        {userPlan}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        let deepLink = "chintu://open";
                        try {
                          deepLink += `?source=web&u=${encodeURIComponent(user?.id || "")}`;
                        } catch {
                          // Ignore token errors and proceed with normal launch
                        }
                        window.location.href = deepLink;
                        setTimeout(() => {
                          router.push("/setup");
                        }, 500);
                      }}
                      className="relative group overflow-hidden bg-[var(--panel-bg)] border-2 border-[var(--glass-border)] text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      Enter The App <Sparkles className="w-3 h-3 fill-indigo-400" />
                    </button>
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
                  <UserButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1">

        {/* Hero Section */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-24 pb-32 max-w-6xl mx-auto w-full">
          <div className="reveal inline-flex items-center gap-2 px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-10 transition-all duration-1000 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">v2.5 Hyper-Intelligence Active</span>
          </div>
          <h1 className="reveal text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter text-[var(--text-main)] mb-8 leading-[0.85] transition-all duration-1000 delay-200 uppercase">
            Destroy Every <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">Assessment.</span>
          </h1>
          <p className="reveal text-sm sm:text-xl text-[var(--text-dim)] mb-14 max-w-3xl leading-relaxed font-bold uppercase tracking-widest transition-all duration-1000 delay-400">
            Interviews, Global Exams, MCQs, or Technical Tests. <br className="hidden sm:block" />
            Capture any problem. Get the perfect solution. Instantly.
          </p>
          <div className="reveal flex flex-col sm:flex-row gap-6 transition-all duration-1000 delay-500">
            {isSignedIn ? (
              <button 
                onClick={async () => {
                  let deepLink = "chintu://open";
                  try {
                    deepLink += `?source=web&u=${encodeURIComponent(user?.id || "")}`;
                  } catch {
                    // Ignore token errors and proceed with normal launch
                  }
                  window.location.href = deepLink;
                  setTimeout(() => {
                    router.push("/setup");
                  }, 500);
                }}
                className="relative group overflow-hidden px-16 py-7 bg-indigo-600 text-white font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                Access Dashboard <Zap className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <Link href="/sign-up" className="relative group overflow-hidden px-16 py-7 bg-indigo-600 text-white font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4">
                Join the Revolution <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            <Link href="/pricing" className="px-16 py-7 bg-[var(--panel-bg)] border-2 border-[var(--glass-border)] text-[var(--text-dim)] font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all flex items-center justify-center">
              View Access Tiers
            </Link>
          </div>
        </section>

        {/* Text Reveal */}
        <section className="bg-[var(--bg-app)] relative">
          <TextReveal text="Chintu Intelligence is not just a tool. It is a strategic evolution for your career. Master any challenge. Instantly." />
        </section>

        {/* Strategic Intelligence Hub */}
        <section className="py-24 px-6 bg-[var(--bg-app)] relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Layers className="w-3.5 h-3.5" /> System Architecture
                </div>
                <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">
                  Advanced <span className="text-indigo-600">Strategic</span> Modules
                </h2>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {[
                    { icon: Search, label: "Live Intel", desc: "Real-time web analysis" },
                    { icon: Code, label: "Logic Engine", desc: "Complex problem solving" },
                    { icon: BookOpen, label: "Memory Bank", desc: "Session persistence" },
                    { icon: MousePointer2, label: "Direct Action", desc: "Click-to-execute logic" }
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-[2rem] border border-[var(--glass-border)] bg-[var(--panel-bg)] hover:border-indigo-500/50 hover:bg-[var(--glass-bg)] transition-all group cursor-default">
                      <item.icon className="w-6 h-6 text-[var(--text-dim)] group-hover:text-indigo-400 mb-3 transition-colors" />
                      <p className="text-xs font-black uppercase tracking-tight text-[var(--text-main)]">{item.label}</p>
                      <p className="text-[10px] text-[var(--text-dim)] font-bold uppercase">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-[var(--panel-bg)] rounded-[3rem] p-8 border border-[var(--glass-border)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent)] animate-pulse" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-[var(--bg-app)] rounded-2xl shadow-sm border border-[var(--glass-border)] hover:border-indigo-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Global Sync</p>
                      <p className="text-xs font-bold text-[var(--text-dim)]">Connected to Tactical Grid</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-[var(--bg-app)] rounded-2xl shadow-sm border border-[var(--glass-border)] hover:border-emerald-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Verified Intel</p>
                      <p className="text-xs font-bold text-[var(--text-dim)]">99.9% Accuracy Rating</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-[var(--bg-app)] rounded-2xl shadow-sm border border-[var(--glass-border)] hover:border-amber-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Auto Pilot</p>
                      <p className="text-xs font-bold text-[var(--text-dim)]">Autonomous Reasoning</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Total Coverage Section — FIX: was missing opening <section> tag */}
        <section className="py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="reveal text-center mb-24 transition-all duration-1000">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.5em] mb-6">Omniscient Intelligence</h2>
              <p className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-none text-[var(--text-main)]">
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
                <div key={i} className="reveal bg-[var(--panel-bg)] border border-[var(--glass-border)] p-8 rounded-[2.5rem] hover:bg-[var(--glass-bg)] hover:border-indigo-500/50 transition-all duration-500 group">
                  <h4 className="font-black text-[12px] uppercase tracking-widest text-indigo-400 mb-3 group-hover:text-[var(--text-main)] transition-colors">{item.title}</h4>
                  <p className="text-[11px] text-[var(--text-dim)] font-bold uppercase tracking-tight leading-relaxed group-hover:text-[var(--text-main)] transition-colors">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Snapshot Section */}
        <section className="py-40 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="reveal transition-all duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8">
                <Zap className="w-4 h-4 text-purple-400 fill-current" />
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Snapshot Intelligence</span>
              </div>
              <h2 className="text-5xl sm:text-7xl font-black tracking-tighter text-[var(--text-main)] mb-8 uppercase leading-[0.9]">
                See it. <br /><span className="text-purple-400">Solve it.</span>
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-md text-sm sm:text-base">
                Stuck on a complex MCQ or a difficult equation? Just take a screenshot. Our vision engine processes the context, identifies the core problem, and generates the exact answer in milliseconds.
              </p>
              <ul className="space-y-5">
                {['Instant OCR Processing', 'Multi-Step Logical Proofs', 'Source Verification', 'Context-Aware Hints'].map((li, i) => (
                  <li key={i} className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-[var(--text-dim)]">
                    <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px]">✓</div>
                    {li}
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal relative transition-all duration-1000 delay-300">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[4rem] blur-3xl opacity-20 animate-pulse" />
              <div className="relative bg-[var(--panel-bg)] border border-[var(--glass-border)] p-4 rounded-[4rem] shadow-2xl">
                <div className="bg-[var(--bg-app)] rounded-[3rem] aspect-video flex items-center justify-center overflow-hidden border border-[var(--glass-border)]">
                  <div className="text-center px-10">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <Target className="w-10 h-10 text-indigo-400" />
                    </div>
                    <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.5em]">Vision Engine Processing...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TestimonialsSection />

        {/* Features Grid */}
        <section className="py-32 px-6 bg-[var(--bg-app)] border-y border-[var(--glass-border)]">
          <div className="max-w-7xl mx-auto">
            <div className="reveal text-center mb-24 transition-all duration-1000">
              <h2 className="text-xs font-black text-indigo-400 uppercase tracking-[0.5em] mb-4">Tactical Superiority</h2>
              <p className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-main)] uppercase">Engineered for Success</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <motion.div whileHover={{ scale: 1.03, y: -6 }} className="reveal bg-[var(--panel-bg)] p-12 rounded-[4rem] border border-[var(--glass-border)] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 group">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg shadow-emerald-500/5">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="font-black uppercase tracking-[0.2em] text-[13px] mb-6 text-[var(--text-main)]">Ghost Protocol</h3>
                <p className="text-[13px] text-[var(--text-dim)] font-bold uppercase tracking-wide leading-relaxed">Advanced hardware-level abstraction that keeps your AI companion invisible to all proctoring and monitoring systems.</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -6 }} className="reveal bg-[var(--panel-bg)] p-12 rounded-[4rem] border border-[var(--glass-border)] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 delay-200 group">
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-500/5">
                  <Cpu className="w-8 h-8" />
                </div>
                <h3 className="font-black uppercase tracking-[0.2em] text-[13px] mb-6 text-[var(--text-main)]">Quantum Synthesis</h3>
                <p className="text-[13px] text-[var(--text-dim)] font-bold uppercase tracking-wide leading-relaxed">Proprietary LLM orchestration that combines multiple specialized models for zero-error technical and logical accuracy.</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -6 }} className="reveal bg-[var(--panel-bg)] p-12 rounded-[4rem] border border-[var(--glass-border)] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 delay-400 group">
                <div className="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg shadow-purple-500/5">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-black uppercase tracking-[0.2em] text-[13px] mb-6 text-[var(--text-main)]">Stealth Overlay</h3>
                <p className="text-[13px] text-[var(--text-dim)] font-bold uppercase tracking-wide leading-relaxed">Ultra-minimalist floating interface that stays exactly where you need it, hidden from screenshots and screen recordings.</p>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Strategic Spread - Only show on Web landing, hide in EXE app */}
        {!isElectron && (
          <section className="py-24 px-6 bg-[var(--bg-app)] relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div className="reveal text-center mb-16 transition-all duration-1000">
                <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Protocol Resources</h2>
                <p className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tight">Master the Interview Logic</p>
              </div>
              <div className="reveal transition-all duration-1000 delay-300">
                <CardSpread />
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section className="py-40 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="reveal transition-all duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Support Command</span>
              </div>
              <h2 className="text-5xl sm:text-6xl font-black tracking-tighter text-[var(--text-main)] mb-8 uppercase leading-[0.9]">
                Deploy <br /><span className="text-indigo-400">Intelligence.</span>
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest leading-relaxed mb-12 max-w-md text-sm sm:text-base">
                Have questions about deployment or strategy? Our elite support team is active 24/7 to ensure your total success.
              </p>
              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] flex items-center justify-center shadow-xl shadow-indigo-500/5 text-xl">📧</div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-1">Secure Comms</span>
                    <span className="text-[13px] font-black uppercase tracking-[0.1em] text-[var(--text-main)]">contact@getchintu.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] flex items-center justify-center shadow-xl shadow-indigo-500/5 text-xl">🌐</div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-1">Status</span>
                    <span className="text-[13px] font-black uppercase tracking-[0.1em] text-emerald-500">Global Infrastructure Active</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal transition-all duration-1000 delay-300">
              <div className="bg-[var(--panel-bg)] p-10 sm:p-16 rounded-[4.5rem] border border-[var(--glass-border)] shadow-[0_50px_100px_-20px_rgba(79,70,229,0.12)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[4.5rem] -mr-10 -mt-10" />
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

      </main>

      <MarqueeReviews />

      {/* Community Ecosystem Bar */}
      <div className="bg-[var(--bg-app)] py-12 px-6 border-t border-[var(--glass-border)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Rated #1 Tactical AI</span>
            </div>
            <div className="flex items-center -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[var(--bg-app)] bg-[var(--panel-bg)] flex items-center justify-center overflow-hidden">
                  <Image src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" width={28} height={28} unoptimized />
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-app)] bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">+10k</div>
            </div>
          </div>
          <div className="flex items-center gap-8">
  <a href="#" className="flex items-center gap-2 group">
    <Globe className="w-4 h-4 text-gray-400 group-hover:text-[#1DA1F2] transition-colors" />
    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">
      Follow
    </span>
  </a>

  <a href="#" className="flex items-center gap-2 group">
    <Code className="w-4 h-4 text-gray-400 group-hover:text-[#333] transition-colors" />
    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">
      Repo
    </span>
  </a>

  <a href="#" className="flex items-center gap-2 group">
    <Star className="w-4 h-4 text-gray-400 group-hover:text-[#0077B5] transition-colors" />
    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">
      Connect
    </span>
  </a>
</div>
        </div>
      </div>

      <GlobalFooter />

    </div>
  );
}