"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Check, Star, Sparkles, Zap, Shield, PlayCircle, Globe, Search, Code, Target, BookOpen, Layers, MousePointer2, Cpu, MessageSquare
} from "lucide-react";

import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import GlobalFooter from '@/components/GlobalFooter';
import SyncedUserButton from '@/components/SyncedUserButton';
import ContactForm from '@/components/ContactForm';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { MarqueeReviews } from '@/components/MarqueeReviews';
import { TextReveal } from '@/components/magicui/text-reveal';
import { Meteors } from '@/components/magicui/meteors';
import { VideoText } from '@/components/magicui/video-text';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';
import CardSpread from '@/components/animata/card/card-spread';
import { motion, AnimatePresence } from 'framer-motion';

const showcaseSlides = [
  {
    src: "/signin.png",
    category: "Secure Access",
    title: "Encrypted Login Portal",
    description: "Enterprise-grade authentication with Google, GitHub OAuth and encrypted email — your data, your control.",
    accent: "from-indigo-500 to-blue-500",
    badge: "Secure Auth",
  },
  {
    src: "/setup.png",
    category: "Profile Setup",
    title: "Personalized Intelligence",
    description: "Drop a resume, LinkedIn summary or short bio — Chintu structures it into a tactical profile that powers every answer.",
    accent: "from-purple-500 to-pink-500",
    badge: "AI Profiling",
  },
  {
    src: "/subscription.png",
    category: "Subscription Portal",
    title: "Elite Plan Command Center",
    description: "A premium dashboard for tracking credits, days remaining and full transaction history — secured by Razorpay with live billing intelligence.",
    accent: "from-amber-500 to-orange-500",
    badge: "Premium Dashboard",
  },
  {
    src: "/bug.png",
    category: "Bug Detection",
    title: "Surgical Code Diagnostics",
    description: "Line-by-line bug analysis identifying logic errors, type mismatches and runtime crashes with clear, actionable explanations.",
    accent: "from-indigo-500 to-purple-500",
    badge: "Code Intelligence",
  },

  {
    src: "/4.png",
    category: "Platform Sync",
    title: "Universal Interview Overlay",
    description: "Floating overlay works seamlessly with micro1, HireVue and every global proctored or live interview platform.",
    accent: "from-blue-500 to-indigo-500",
    badge: "Cross-Platform",
  },
  {
    src: "/5.png",
    category: "Long-Form Synthesis",
    title: "Deep Behavioral Responses",
    description: "Generates detailed, personalized long-form answers from your real experience for behavioral and case-style questions.",
    accent: "from-cyan-500 to-blue-500",
    badge: "Standard Engine",
  },
  {
    src: "/6.png",
    category: "Live Interview",
    title: "Real-Time Q&A Assistant",
    description: "Captures the live question and delivers an intelligent, context-aware response in your tone — the moment you need it.",
    accent: "from-emerald-500 to-cyan-500",
    badge: "Live Mode",
  },
  {
    src: "/7.png",
    category: "Root Cause Engine",
    title: "Scout + Turbo Debugging",
    description: "Deep multi-model code reasoning that pinpoints the root cause, explains why it broke and produces a verified fix.",
    accent: "from-violet-500 to-fuchsia-500",
    badge: "Scout + Turbo",
  },
  {
    src: "/8.png",
    category: "Voice Protocol",
    title: "Hold-Space Voice Capture",
    description: "Hold space to capture audio, then synthesize a tactical neural answer instantly — completely hands-free.",
    accent: "from-pink-500 to-rose-500",
    badge: "Voice Input",
  },
  {
    src: "/9.png",
    category: "Elite Synthesis",
    title: "Neural Voice Active",
    description: "Premium voice mode delivering ultra-low-latency contextual answers, ready for the highest-stakes interviews.",
    accent: "from-rose-500 to-red-500",
    badge: "Elite Protocol",
  },
];

export default function LandingPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [userCredits, setUserCredits] = React.useState<number | null>(null);
  const [userPlan, setUserPlan] = React.useState<string>("");
  const [currentShowcase, setCurrentShowcase] = React.useState(0);
  const [isShowcasePaused, setIsShowcasePaused] = React.useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isShowcasePaused) return;
    const interval = setInterval(() => {
      setCurrentShowcase((prev) => (prev + 1) % showcaseSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isShowcasePaused]);

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
            <div className="flex items-center justify-center w-8 h-8 hover:scale-110 transition-transform">
              <Image
                src="https://www.getchintu.com/icon.png"
                alt="Chintu AI Logo - Ultimate Interview & Exam Assistant"
                className="w-full h-full object-contain"
                width={32}
                height={32}
                unoptimized
                priority
              />
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
              <Link href="/sign-up" className="relative group overflow-hidden bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-lg shadow-indigo-500/40 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                Get Started <ArrowRight className="w-3 h-3" />
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                {userPlan !== 'free' && userPlan !== '' && (
                  <>
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--panel-bg)] border border-[var(--glass-border)] backdrop-blur-md shadow-sm">
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
                      className="relative group overflow-hidden bg-[var(--panel-bg)] border-2 border-[var(--glass-border)] text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <span className="hidden sm:inline">Enter The App</span>
                      <span className="sm:hidden">Open</span>
                      <Sparkles className="w-3 h-3 fill-indigo-400" />
                    </button>
                  </>
                )}
                {userPlan === 'free' && (
                  <Link
                    href="/pricing"
                    className="relative group overflow-hidden bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Upgrade Plan</span>
                    <span className="sm:hidden">Upgrade</span>
                    <Zap className="w-3 h-3 fill-current" />
                  </Link>
                )}
                <div className="scale-105 hover:scale-110 transition-transform">
                  <SyncedUserButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1">

        {/* Hero Section — Stylish Split Layout */}
        <section className="relative px-6 pt-10 lg:pt-16 pb-20 max-w-7xl mx-auto w-full">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-1/4 w-[28rem] h-[28rem] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute top-32 right-0 w-[28rem] h-[28rem] bg-purple-500/10 blur-[140px] rounded-full pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">

            {/* ─── LEFT: Hero Content ─────────────────────────── */}
            <motion.div
              className="lg:col-span-6"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">v2.5 Hyper-Intelligence Active</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black tracking-tighter text-[var(--text-main)] mb-6 leading-[0.85] uppercase">
                Destroy Every <br />
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">Assessment.</span>
                  <motion.span
                    className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm md:text-base text-[var(--text-dim)] mb-6 sm:mb-8 leading-relaxed font-bold uppercase tracking-widest max-w-xl">
                Interviews, Global Exams, MCQs, or Technical Tests. Capture any problem. Get the perfect solution. Instantly.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
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
                    className="relative group overflow-hidden px-7 sm:px-9 py-3.5 sm:py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.25em] text-[10px] sm:text-[11px] rounded-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Access Dashboard <Zap className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <Link href="/sign-up" className="relative group overflow-hidden px-7 sm:px-9 py-3.5 sm:py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.25em] text-[10px] sm:text-[11px] rounded-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3">
                    Join the Revolution <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                <InteractiveHoverButton
                  onClick={() => router.push("/pricing")}
                  className="px-7 sm:px-9 py-3.5 sm:py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-[var(--text-dim)] hover:text-indigo-400 bg-[var(--panel-bg)] sm:max-w-[260px]"
                >
                  View Access Tiers
                </InteractiveHoverButton>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[var(--bg-app)] bg-[var(--panel-bg)] overflow-hidden shadow-md">
                      <Image
                        src={`https://i.pravatar.cc/100?img=${i + 10}`}
                        alt={`Reviewer ${i}`}
                        width={32}
                        height={32}
                        unoptimized
                      />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-app)] bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white shadow-md">+10k</div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-[10px] font-black text-[var(--text-main)] ml-1.5">4.9</span>
                  </div>
                  <span className="text-[8px] font-black text-[var(--text-dim)] uppercase tracking-widest">Rated #1 by 10k+ Pros</span>
                </div>
              </div>

              {/* ─── Live Demo Video Card ─── */}
              <motion.button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="group relative w-full max-w-sm text-left"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-cyan-400/40 blur-xl rounded-2xl opacity-50 group-hover:opacity-90 transition-opacity duration-500" />
                <div className="relative flex items-center gap-3 p-2.5 bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-2xl backdrop-blur-xl shadow-xl group-hover:border-indigo-500/40 group-hover:scale-[1.02] transition-all duration-300">
                  {/* Looping Video Thumbnail */}
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                    <video
                      src="/1.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                      </div>
                    </div>
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/90 backdrop-blur-sm">
                      <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      <span className="text-[7px] font-black text-white uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-0.5">Watch Demo</p>
                    <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight mb-0.5 truncate">See It In Action</p>
                    <p className="text-[9px] font-bold text-[var(--text-dim)] uppercase tracking-widest flex items-center gap-1">
                      30s walkthrough <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </div>
              </motion.button>
            </motion.div>

            {/* ─── RIGHT: Image Showcase Carousel ─────────────── */}
            <motion.div
              className="lg:col-span-6 relative"
              initial={{ opacity: 0, scale: 0.95, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => setIsShowcasePaused(true)}
              onMouseLeave={() => setIsShowcasePaused(false)}
            >
              {/* Animated Glow */}
              <div className={`absolute -inset-4 bg-gradient-to-r ${showcaseSlides[currentShowcase].accent} blur-3xl opacity-25 transition-all duration-1000 rounded-[2.5rem]`} />

              {/* Browser Frame */}
              <div className="relative bg-[var(--panel-bg)] rounded-[1.5rem] border border-[var(--glass-border)] shadow-2xl shadow-indigo-500/10 overflow-hidden backdrop-blur-2xl">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--glass-border)] bg-[var(--bg-app)]/60">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`tab-${currentShowcase}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-app)] rounded-full border border-[var(--glass-border)] max-w-[80%] truncate"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${showcaseSlides[currentShowcase].accent} animate-pulse flex-shrink-0`} />
                        <span className="text-[8px] sm:text-[9px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] truncate">
                          chintu.ai / {showcaseSlides[currentShowcase].badge.toLowerCase().replace(/\s+/g, "-")}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex-shrink-0">
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
                  </div>
                </div>

                {/* Image Display */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[var(--bg-app)] to-[var(--panel-bg)]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`img-${currentShowcase}`}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={showcaseSlides[currentShowcase].src}
                        alt={showcaseSlides[currentShowcase].title}
                        fill
                        className="object-cover"
                        priority={currentShowcase === 0}
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                    </motion.div>
                  </AnimatePresence>

                  {/* Slide Counter */}
                  <div className="absolute top-4 right-4 z-10 px-2.5 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full">
                    <span className="text-[9px] font-black text-white/90 uppercase tracking-widest tabular-nums">
                      {String(currentShowcase + 1).padStart(2, "0")} <span className="text-white/40">/ {String(showcaseSlides.length).padStart(2, "0")}</span>
                    </span>
                  </div>

                  {/* Description Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 z-10">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`desc-${currentShowcase}`}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r ${showcaseSlides[currentShowcase].accent} backdrop-blur-md border border-white/20 rounded-full text-[8px] font-black text-white uppercase tracking-[0.25em] mb-2 shadow-lg`}>
                          <Sparkles className="w-2.5 h-2.5" />
                          {showcaseSlides[currentShowcase].category}
                        </span>
                        <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight mb-2 leading-[1.05]">
                          {showcaseSlides[currentShowcase].title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-white/85 font-medium leading-relaxed">
                          {showcaseSlides[currentShowcase].description}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-20">
                    <motion.div
                      key={`progress-${currentShowcase}-${isShowcasePaused}`}
                      className={`h-full bg-gradient-to-r ${showcaseSlides[currentShowcase].accent}`}
                      initial={{ width: "0%" }}
                      animate={{ width: isShowcasePaused ? "0%" : "100%" }}
                      transition={{ duration: isShowcasePaused ? 0 : 4, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="mt-5 flex items-center justify-center gap-1.5 flex-wrap">
                {showcaseSlides.map((slide, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentShowcase(i)}
                    className={`group relative transition-all duration-300 ${i === currentShowcase
                      ? "w-10 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"
                      : "w-2 h-2 bg-[var(--glass-border)] rounded-full hover:bg-indigo-500/50 hover:scale-125"
                      }`}
                    aria-label={`Show ${slide.title}`}
                    title={slide.title}
                  />
                ))}
              </div>

              {/* Floating Stat Cards (positioned within right column, lg+ only) */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1, duration: 0.7 }}
                className="hidden xl:flex absolute -left-6 top-1/4 items-center gap-2.5 px-3 py-2 bg-[var(--panel-bg)]/95 backdrop-blur-xl border border-[var(--glass-border)] rounded-xl shadow-2xl"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Verified</p>
                  <p className="text-[10px] font-black text-[var(--text-main)]">99.9% Accuracy</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.2, duration: 0.7 }}
                className="hidden xl:flex absolute -right-6 top-1/2 items-center gap-2.5 px-3 py-2 bg-[var(--panel-bg)]/95 backdrop-blur-xl border border-[var(--glass-border)] rounded-xl shadow-2xl"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
                  <Zap className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <p className="text-[7px] font-black text-indigo-500 uppercase tracking-widest">Latency</p>
                  <p className="text-[10px] font-black text-[var(--text-main)]">&lt; 200ms</p>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ─── Video Modal ─────────────────────────────── */}
        <AnimatePresence>
          {isVideoModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
              onClick={() => setIsVideoModalOpen(false)}
              style={{ WebkitAppRegion: "no-drag" } as any}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="absolute -top-12 right-0 text-white/80 hover:text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"
                >
                  Close <span className="text-base">×</span>
                </button>
                <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 blur-2xl opacity-30 -z-10 rounded-2xl" />
                  <video
                    src="/1.mp4"
                    autoPlay
                    controls
                    playsInline
                    className="w-full aspect-video object-contain bg-black"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Reveal */}
        <section className="bg-[var(--bg-app)] relative">
          <TextReveal text="Chintu Intelligence is not just a tool. It is a strategic evolution for your career. Master any challenge. Instantly." />
        </section>

        {/* Strategic Intelligence Hub */}
        <section className="py-16 sm:py-20 lg:py-24 px-6 bg-[var(--bg-app)] relative overflow-hidden">
          {!isElectron && <div className="absolute inset-0 pointer-events-none opacity-50"><Meteors number={10} /></div>}
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
              <div className="flex-1 space-y-4 sm:space-y-6 w-full">
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Layers className="w-3.5 h-3.5" /> System Architecture
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tighter uppercase leading-none">
                  Advanced <span className="text-indigo-600">Strategic</span> Modules
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
                  {[
                    { icon: Search, label: "Live Intel", desc: "Real-time web analysis" },
                    { icon: Code, label: "Logic Engine", desc: "Complex problem solving" },
                    { icon: BookOpen, label: "Memory Bank", desc: "Session persistence" },
                    { icon: MousePointer2, label: "Direct Action", desc: "Click-to-execute logic" }
                  ].map((item, i) => (
                    <div key={i} className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-[var(--glass-border)] bg-[var(--panel-bg)] hover:border-indigo-500/50 hover:bg-[var(--glass-bg)] transition-all group cursor-default">
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-dim)] group-hover:text-indigo-400 mb-2 sm:mb-3 transition-colors" />
                      <p className="text-[11px] sm:text-xs font-black uppercase tracking-tight text-[var(--text-main)]">{item.label}</p>
                      <p className="text-[9px] sm:text-[10px] text-[var(--text-dim)] font-bold uppercase">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-[var(--panel-bg)] rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 border border-[var(--glass-border)] relative overflow-hidden w-full">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent)] animate-pulse" />
                <div className="relative z-10 space-y-3 sm:space-y-6">
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[var(--bg-app)] rounded-xl sm:rounded-2xl shadow-sm border border-[var(--glass-border)] hover:border-indigo-500/30 transition-all group">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 flex-shrink-0">
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-400">Global Sync</p>
                      <p className="text-[10px] sm:text-xs font-bold text-[var(--text-dim)] truncate">Connected to Tactical Grid</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[var(--bg-app)] rounded-xl sm:rounded-2xl shadow-sm border border-[var(--glass-border)] hover:border-emerald-500/30 transition-all group">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 flex-shrink-0">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400">Verified Intel</p>
                      <p className="text-[10px] sm:text-xs font-bold text-[var(--text-dim)] truncate">99.9% Accuracy Rating</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[var(--bg-app)] rounded-xl sm:rounded-2xl shadow-sm border border-[var(--glass-border)] hover:border-amber-500/30 transition-all group">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 flex-shrink-0">
                      <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-400">Auto Pilot</p>
                      <p className="text-[10px] sm:text-xs font-bold text-[var(--text-dim)] truncate">Autonomous Reasoning</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Total Coverage Section */}
        <section className="py-20 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          {!isElectron && <div className="absolute inset-0 pointer-events-none opacity-40"><Meteors number={15} /></div>}
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="reveal text-center mb-12 sm:mb-16 lg:mb-24 transition-all duration-1000">
              <h2 className="text-[10px] sm:text-xs font-black text-indigo-400 uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-4 sm:mb-6">Omniscient Intelligence</h2>
              <p className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-none text-[var(--text-main)]">
                Zero Gaps. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Total Dominance.</span>
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 lg:gap-10">
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
                <div key={i} className="reveal bg-[var(--panel-bg)] border border-[var(--glass-border)] p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] hover:bg-[var(--glass-bg)] hover:border-indigo-500/50 transition-all duration-500 group">
                  <h4 className="font-black text-[10px] sm:text-[12px] uppercase tracking-widest text-indigo-400 mb-2 sm:mb-3 group-hover:text-[var(--text-main)] transition-colors">{item.title}</h4>
                  <p className="text-[9px] sm:text-[11px] text-[var(--text-dim)] font-bold uppercase tracking-tight leading-relaxed group-hover:text-[var(--text-main)] transition-colors">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Snapshot Section */}
        <section className="py-20 sm:py-32 lg:py-40 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div className="reveal transition-all duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6 sm:mb-8">
                <Zap className="w-4 h-4 text-purple-400 fill-current" />
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Snapshot Intelligence</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-7xl font-black tracking-tighter text-[var(--text-main)] mb-6 sm:mb-8 uppercase leading-[0.9]">
                See it. <br /><span className="text-purple-400">Solve it.</span>
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest leading-relaxed mb-8 sm:mb-10 max-w-md text-xs sm:text-sm md:text-base">
                Stuck on a complex MCQ or a difficult equation? Just take a screenshot. Our vision engine processes the context, identifies the core problem, and generates the exact answer in milliseconds.
              </p>
              <ul className="space-y-3 sm:space-y-5">
                {['Instant OCR Processing', 'Multi-Step Logical Proofs', 'Source Verification', 'Context-Aware Hints'].map((li, i) => (
                  <li key={i} className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[var(--text-dim)]">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] sm:text-[10px] flex-shrink-0">✓</div>
                    {li}
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal relative transition-all duration-1000 delay-300">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[2rem] sm:rounded-[4rem] blur-3xl opacity-20 animate-pulse" />
              <div className="relative bg-[var(--panel-bg)] border border-[var(--glass-border)] p-3 sm:p-4 rounded-[2rem] sm:rounded-[4rem] shadow-2xl">
                <div className="bg-[var(--bg-app)] rounded-[1.5rem] sm:rounded-[3rem] aspect-video overflow-hidden border border-[var(--glass-border)] relative">
                  <VideoText
                    src="/1.mp4"
                    className="h-full w-full"
                    videoClassName="grayscale-0 opacity-90"
                  >
                    SOLVE.
                  </VideoText>
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[8px] font-black text-white/90 uppercase tracking-widest">Vision Active</span>
                  </div>
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
                    <Target className="w-2.5 h-2.5 text-purple-400" />
                    <span className="text-[8px] font-black text-white/90 uppercase tracking-widest">OCR Engine</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TestimonialsSection />

        {/* Features Grid */}
        <section className="py-20 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] border-y border-[var(--glass-border)]">
          <div className="max-w-7xl mx-auto">
            <div className="reveal text-center mb-12 sm:mb-16 lg:mb-24 transition-all duration-1000">
              <h2 className="text-[10px] sm:text-xs font-black text-indigo-400 uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-3 sm:mb-4">Tactical Superiority</h2>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-main)] uppercase">Engineered for Success</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-12">
              <motion.div whileHover={{ scale: 1.03, y: -6 }} className="reveal bg-[var(--panel-bg)] p-6 sm:p-8 lg:p-12 rounded-[2rem] lg:rounded-[4rem] border border-[var(--glass-border)] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 sm:mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg shadow-emerald-500/5">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="font-black uppercase tracking-[0.2em] text-[12px] sm:text-[13px] mb-3 sm:mb-6 text-[var(--text-main)]">Ghost Protocol</h3>
                <p className="text-[11px] sm:text-[13px] text-[var(--text-dim)] font-bold uppercase tracking-wide leading-relaxed">Advanced hardware-level abstraction that keeps your AI companion invisible to all proctoring and monitoring systems.</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -6 }} className="reveal bg-[var(--panel-bg)] p-6 sm:p-8 lg:p-12 rounded-[2rem] lg:rounded-[4rem] border border-[var(--glass-border)] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 delay-200 group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mb-6 sm:mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-500/5">
                  <Cpu className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="font-black uppercase tracking-[0.2em] text-[12px] sm:text-[13px] mb-3 sm:mb-6 text-[var(--text-main)]">Quantum Synthesis</h3>
                <p className="text-[11px] sm:text-[13px] text-[var(--text-dim)] font-bold uppercase tracking-wide leading-relaxed">Proprietary LLM orchestration that combines multiple specialized models for zero-error technical and logical accuracy.</p>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, y: -6 }} className="reveal bg-[var(--panel-bg)] p-6 sm:p-8 lg:p-12 rounded-[2rem] lg:rounded-[4rem] border border-[var(--glass-border)] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 delay-400 group">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/10 text-purple-500 rounded-full flex items-center justify-center mb-6 sm:mb-10 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-lg shadow-purple-500/5">
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="font-black uppercase tracking-[0.2em] text-[12px] sm:text-[13px] mb-3 sm:mb-6 text-[var(--text-main)]">Stealth Overlay</h3>
                <p className="text-[11px] sm:text-[13px] text-[var(--text-dim)] font-bold uppercase tracking-wide leading-relaxed">Ultra-minimalist floating interface that stays exactly where you need it, hidden from screenshots and screen recordings.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Strategic Spread - Only show on Web landing, hide in EXE app */}
        {!isElectron && (
          <section className="py-16 sm:py-20 lg:py-24 px-6 bg-[var(--bg-app)] relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-30"><Meteors number={8} /></div>
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="reveal text-center mb-10 sm:mb-16 transition-all duration-1000">
                <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Protocol Resources</h2>
                <p className="text-2xl sm:text-3xl font-black text-[var(--text-main)] uppercase tracking-tight">Master the Interview Logic</p>
              </div>
              <div className="reveal transition-all duration-1000 delay-300">
                <CardSpread />
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section className="py-20 sm:py-32 lg:py-40 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div className="reveal transition-all duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6 sm:mb-8">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Support Command</span>
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-[var(--text-main)] mb-6 sm:mb-8 uppercase leading-[0.9]">
                Deploy <br /><span className="text-indigo-400">Tactical Intelligence.</span>
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest leading-relaxed mb-8 sm:mb-12 max-w-md text-xs sm:text-sm md:text-base">
                Have questions about deployment or strategy? Our elite support team is active 24/7 to ensure your total success.
              </p>
              <div className="space-y-5 sm:space-y-8">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--panel-bg)] border border-[var(--glass-border)] flex items-center justify-center shadow-xl shadow-indigo-500/5 text-base sm:text-xl flex-shrink-0">📧</div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-1">Secure Comms</span>
                    <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.1em] text-[var(--text-main)] truncate">contact@getchintu.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--panel-bg)] border border-[var(--glass-border)] flex items-center justify-center shadow-xl shadow-indigo-500/5 text-base sm:text-xl flex-shrink-0">🌐</div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-1">Status</span>
                    <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-[0.1em] text-emerald-500">Global Infrastructure Active</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="reveal transition-all duration-1000 delay-300">
              <div className="bg-[var(--panel-bg)] p-6 sm:p-10 lg:p-16 rounded-[2rem] sm:rounded-[3rem] lg:rounded-[4.5rem] border border-[var(--glass-border)] shadow-[0_50px_100px_-20px_rgba(79,70,229,0.12)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[2rem] sm:rounded-bl-[3rem] lg:rounded-bl-[4.5rem] -mr-10 -mt-10" />
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

      </main>

      <MarqueeReviews />

      {/* Community Ecosystem Bar */}
      <div className="bg-[var(--bg-app)] py-8 sm:py-12 px-6 border-t border-[var(--glass-border)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <Star className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-400">Rated #1 Tactical AI</span>
            </div>
            <div className="flex items-center -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[var(--bg-app)] bg-[var(--panel-bg)] flex items-center justify-center overflow-hidden">
                  <Image
                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                    alt={`Chintu AI User Reviewer ${i}`}
                    width={28}
                    height={28}
                    unoptimized
                  />
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-app)] bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">+10k</div>
            </div>
          </div>
          <div className="flex items-center gap-5 sm:gap-8">
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