"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Check, X, Star, Sparkles, Zap, Shield, PlayCircle, Globe, Search, Code, Target, BookOpen, Layers, MousePointer2, Cpu, MessageSquare, HelpCircle, Trophy, ThumbsUp, ThumbsDown,
  Download, Video, FileText, Play, Users, Building2, Rocket, Crown, Gem, Gift, Briefcase, IndianRupee, Share2, UserCheck, CircleDollarSign
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
import {
  ScrollProgressBar,
  AnimatedCounter,
  FaqAccordion,
  ComparisonTable,
  type FaqItem,
  type CompareRow,
} from '@/components/LandingEnhancements';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

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

/* ─── Comparison data: Chintu vs alternative AI interview copilots ─── */
const comparisonRows: CompareRow[] = [
  { feature: "Real-Time AI Answers",      chintu: true,                  compA: true,           compB: true            },
  { feature: "Stealth / Invisible Mode",  chintu: true,                  compA: true,           compB: true            },
  { feature: "Conversational Human Tone", chintu: true,                  compA: false,          compB: false           },
  { feature: "Vision OCR Snapshot",       chintu: true,                  compA: false,          compB: false           },
  { feature: "Hold-Space Voice Capture",  chintu: true,                  compA: false,          compB: false           },
  { feature: "Scout + Turbo Debugger",    chintu: true,                  compA: false,          compB: false           },
  { feature: "Universal Overlay",         chintu: true,                  compA: true,           compB: true            },
  { feature: "Latency",                   chintu: "<200ms",              compA: "~500ms",       compB: "~400ms"        },
  { feature: "Languages Supported",       chintu: "52+",                 compA: "30+",          compB: "52+"           },
  { feature: "Long-Form Behavioral",      chintu: true,                  compA: true,           compB: true            },
];

/* ─── FAQ data ──────────────────────────────────────────── */
const faqItems: FaqItem[] = [
  {
    q: "Is Chintu AI invisible to interviewers and proctors?",
    a: "Yes. Chintu runs as a stealth overlay at the system level — invisible to screen sharing, recording, and proctoring tools across Zoom, Google Meet, Microsoft Teams, HackerRank, and more.",
  },
  {
    q: "Which interview platforms does Chintu support?",
    a: "Chintu is platform-agnostic. Our universal overlay works with every major video / proctoring / coding platform including Zoom, Google Meet, Microsoft Teams, HireVue, micro1, HackerRank and LeetCode.",
  },
  {
    q: "Can Chintu solve coding interview questions?",
    a: "Absolutely. Scout + Turbo, our multi-model debugger, performs root-cause analysis on logic errors, type mismatches and runtime crashes — and produces verified fixes with line-by-line reasoning.",
  },
  {
    q: "How fast is the response?",
    a: "Sub-200ms median latency. The vision engine OCRs your screen, the LLM orchestrator routes the question, and the answer streams back instantly — fast enough for live questions.",
  },
  {
    q: "Does Chintu work for online exams and MCQs?",
    a: "Yes. Snapshot Intelligence captures any MCQ or equation, processes the context with our vision engine, and delivers the exact answer in milliseconds — including multi-step proofs.",
  },
  {
    q: "What languages does Chintu support?",
    a: "52+ languages with real-time transcription, plus an Authentic Voice engine that crafts answers in a natural, conversational tone — never robotic or rehearsed, never recycled boilerplate.",
  },
  {
    q: "How does the credit and refund policy work?",
    a: "Credits never expire. Subscriptions and lifetime plans are available for unlimited usage. Every purchase is backed by a 7-day money-back guarantee.",
  },
  {
    q: "Can I use Chintu on my phone?",
    a: "Yes. Chintu has a mobile-optimised version accessible directly in your browser — no app store download required. Run desktop and mobile simultaneously on a single session.",
  },
];

/* ─── FAQPage JSON-LD schema (auto-built from faqItems above) ─── */
const faqPageSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

/* ─── Authentic Voice demo ──────────────────────────────── */
const humanDemo = {
  question: "What is the toughest bug you have ever debugged in production?",
  textbook:
    "Throughout my professional tenure I have systematically addressed numerous complex software defects necessitating rigorous root-cause analysis. One particularly noteworthy incident involved an intermittent service degradation, which I resolved through methodical investigation, structured hypothesis testing and the disciplined application of established debugging methodologies, ultimately yielding a sustainable and well-documented resolution aligned with organisational best practices.",
  authentic:
    "Honestly, the worst one was a memory leak in our checkout service — the pods would die every four hours and the logs were giving us nothing. I spent two days dumping heap snapshots and tracing allocations before I noticed we were holding closed Redis connections inside a retry loop. The actual fix was three lines of cleanup. The bigger takeaway, though — when nothing in the logs adds up, look at what your retry handlers are silently doing in the background. Every retry I write now has explicit cleanup, no exceptions.",
};

/* ─── How It Works (3 steps) ─────────────────────────────── */
const howItWorksSteps = [
  {
    num: "01",
    icon: Download,
    accent: "from-indigo-500 to-blue-500",
    tag: "Step One",
    title: "Sign Up. Install. Log In.",
    desc: "Create a free account, download the stealth overlay for Windows / macOS, and you are ready in under 60 seconds. No credit card, no fuss.",
  },
  {
    num: "02",
    icon: Video,
    accent: "from-purple-500 to-pink-500",
    tag: "Step Two",
    title: "Join Your Interview.",
    desc: "Jump onto any platform — Zoom, Meet, Teams, HireVue, HackerRank, anything. Chintu stays invisible to screen-share, recording and proctoring.",
  },
  {
    num: "03",
    icon: Sparkles,
    accent: "from-emerald-500 to-cyan-400",
    tag: "Step Three",
    title: "Get Instant Answers.",
    desc: "Hold Space to capture voice. Snapshot the screen for MCQs and code. Chintu streams accurate, human-sounding answers in under 200 ms.",
  },
];

/* ─── Platforms that Chintu works on ─────────────────────── */
const supportedPlatforms: { name: string; icon: any; category: string; logo?: string }[] = [
  { name: "Zoom",             icon: Video,        category: "Video",        logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg" },
  { name: "Google Meet",      icon: Video,        category: "Video",        logo: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Google_Meet_icon_%282020%29.svg" },
  { name: "Microsoft Teams",  icon: Video,        category: "Video",        logo: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg" },
  { name: "Webex",            icon: Video,        category: "Video",        logo: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Cisco_Webex_logo_2021.svg" },
  { name: "Amazon Chime",     icon: Video,        category: "Video",        logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Amazon_Chime_Logo.svg" },
  { name: "Skype",            icon: Video,        category: "Video",        logo: "https://upload.wikimedia.org/wikipedia/commons/6/60/Skype_logo_%282019%E2%80%93present%29.svg" },
  { name: "HireVue",          icon: UserCheck,    category: "AI Interview", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Hirevue_logo.svg" },
  { name: "micro1",           icon: UserCheck,    category: "AI Interview", logo: "https://cdn.brandfetch.io/micro1.ai/logo" },
  { name: "Karat",            icon: UserCheck,    category: "AI Interview", logo: "https://karat.com/wp-content/themes/karat/assets/img/logo.svg" },
  { name: "Interviewing.io",  icon: UserCheck,    category: "Live Coding",  logo: "https://vtlogo.com/wp-content/uploads/2020/11/interviewing-io-vector-logo.png" },
  { name: "HackerRank",       icon: Code,         category: "Coding",       logo: "https://upload.wikimedia.org/wikipedia/commons/4/40/HackerRank_Icon-1000px.png" },
  { name: "LeetCode",         icon: Code,         category: "Coding",       logo: "https://cdn.brandfetch.io/leetcode.com/logo" },
  { name: "CoderPad",         icon: Code,         category: "Coding",       logo: "https://cdn.brandfetch.io/coderpad.io/logo" },
  { name: "Codility",         icon: Code,         category: "Coding",       logo: "https://cdn.brandfetch.io/codility.com/logo" },
  { name: "Pramp",            icon: Users,        category: "Peer Practice", logo: "https://www.pramp.com/img/pramp_logo_blue.png" },
  { name: "Discord",          icon: MessageSquare,category: "Chat",          logo: "https://upload.wikimedia.org/wikipedia/commons/7/73/Discord_Color_Text_Logo_%282021%29.svg" },
];

/* ─── Companies whose candidates use Chintu ──────────────── */
const hiredAtCompanies = [
  { name: "Google",        logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { name: "Meta",          logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" },
  { name: "Amazon",        logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
  { name: "Microsoft",     logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
  { name: "Apple",         logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
  { name: "Netflix",       logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
  { name: "Uber",          logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" },
  { name: "Tesla",         logo: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg" },
  { name: "Stripe",        logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" },
  { name: "Goldman Sachs", logo: "https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs_logo.svg" },
  { name: "McKinsey",      logo: "https://upload.wikimedia.org/wikipedia/commons/b/ba/McKinsey_%26_Company_logo.svg" },
  { name: "Deloitte",      logo: "https://upload.wikimedia.org/wikipedia/commons/5/56/Deloitte.svg" },
];

/* ─── Power Tools spotlight (Mock + Resume) ───────────────
 * Extra products bundled with every paid Chintu plan.
 */
const powerTools = [
  {
    icon: Play,
    tag: "Practice Arena",
    title: "Mock Interview Simulator",
    desc:
      "Train with our AI interviewer that asks role-specific questions, grades your answers on clarity, structure and confidence — then tells you exactly what to fix before the real thing.",
    bullets: [
      "Role-specific question banks (SDE, PM, DA, Sales)",
      "Real-time grading on tone, filler words, structure",
      "Unlimited retries, private by default",
      "Weekly progress report",
    ],
    accent: "from-indigo-500 via-purple-500 to-pink-500",
    cta: "Start Practising",
    href: "/dashboard",
  },
  {
    icon: FileText,
    tag: "AI Resume Builder",
    title: "JD-Tailored Resume Engine",
    desc:
      "Paste the job description once. Chintu rewrites your resume to match the keywords, recruiter scanners and the exact voice of the company — ATS-ready in 30 seconds.",
    bullets: [
      "ATS keyword optimisation",
      "Role + JD specific tailoring",
      "Designer-grade templates",
      "One-click PDF export",
    ],
    accent: "from-cyan-400 via-blue-500 to-indigo-500",
    cta: "Build My Resume",
    href: "/dashboard",
  },
];

/* ─── Pricing plans (update to match your live /pricing) ──
 * NOTE: Prices are placeholders. Change monthly/yearly figures
 * to match your real tiers in the /pricing page.
 */
type PricingPlan = {
  name: string;
  blurb: string;
  monthly: number;
  yearly: number; // per-month, billed annually
  icon: any;
  accent: string;
  highlighted?: boolean;
  cta: string;
  href: string;
  features: string[];
};

const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    blurb: "Kick the tyres.",
    monthly: 0,
    yearly: 0,
    icon: Gift,
    accent: "from-slate-400 to-slate-500",
    cta: "Start Free",
    href: "/sign-up",
    features: [
      "5 credits per month",
      "Basic stealth overlay",
      "52+ languages",
      "Email support",
    ],
  },
  {
    name: "Pro",
    blurb: "For serious candidates.",
    monthly: 999,
    yearly: 599,
    icon: Gem,
    accent: "from-indigo-500 to-purple-500",
    highlighted: true,
    cta: "Go Pro",
    href: "/pricing",
    features: [
      "Unlimited credits",
      "Full stealth overlay on every platform",
      "Scout + Turbo code debugger",
      "Vision OCR snapshot intelligence",
      "Hold-Space voice capture",
      "Priority streaming answers (<200ms)",
      "Priority chat support",
    ],
  },
  {
    name: "Elite",
    blurb: "Zero compromises.",
    monthly: 2499,
    yearly: 1499,
    icon: Crown,
    accent: "from-amber-400 via-rose-500 to-purple-500",
    cta: "Unlock Elite",
    href: "/pricing",
    features: [
      "Everything in Pro",
      "Dedicated GPT-4o / Claude priority lane",
      "Custom persona + tone training",
      "Mock Interview Simulator — unlimited",
      "AI Resume Builder — unlimited",
      "Dedicated success manager",
      "7-day money-back guarantee",
    ],
  },
];

/* ─── Creator / Affiliate program tiers ──────────────────── */
const creatorTiers = [
  {
    label: "Starter",
    views: "1K – 10K",
    reward: "₹500",
    perVideo: "per video",
    icon: Share2,
    accent: "from-slate-400 to-slate-500",
  },
  {
    label: "Creator",
    views: "10K – 100K",
    reward: "₹2,500",
    perVideo: "per video",
    icon: Rocket,
    accent: "from-indigo-500 to-purple-500",
    highlighted: true,
  },
  {
    label: "Elite Creator",
    views: "100K +",
    reward: "₹10,000",
    perVideo: "per video",
    icon: Crown,
    accent: "from-amber-400 to-rose-500",
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
  const [pricingMode, setPricingMode] = React.useState<"monthly" | "yearly">("yearly");

  /* ─── Scroll-driven motion (reads scroll from #main-content) ─── */
  const scrollProgress = useMotionValue(0);
  const smoothScroll = useSpring(scrollProgress, { stiffness: 80, damping: 22, mass: 0.4 });
  const heroBlob1Y = useTransform(smoothScroll, [0, 0.4], [0, -180]);
  const heroBlob2Y = useTransform(smoothScroll, [0, 0.4], [0, 220]);
  const heroBlob1Scale = useTransform(smoothScroll, [0, 0.4], [1, 1.25]);
  const heroFadeOut = useTransform(smoothScroll, [0, 0.25], [1, 0.4]);

  useEffect(() => {
    setMounted(true);
    const el = document.getElementById('main-content');
    const target: HTMLElement | Window = el || window;
    const update = () => {
      if (el) {
        const { scrollTop, scrollHeight, clientHeight } = el;
        const max = scrollHeight - clientHeight;
        scrollProgress.set(max > 0 ? scrollTop / max : 0);
      } else {
        const max = (document.documentElement.scrollHeight || 0) - window.innerHeight;
        scrollProgress.set(max > 0 ? window.scrollY / max : 0);
      }
    };
    update();
    target.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      target.removeEventListener('scroll', update as EventListener);
      window.removeEventListener('resize', update);
    };
  }, [scrollProgress]);

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

      {/* SEO: FAQPage structured data so Google can render rich FAQ snippet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />

      {/* Scroll Progress Bar (web-only, hidden in Electron app) */}
      {!isElectron && <ScrollProgressBar />}

      {/* Background Elements (parallax) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {!isElectron && userPlan !== "free" && userPlan !== "" && <Meteors number={30} />}
        <motion.div
          style={{ y: heroBlob1Y, scale: heroBlob1Scale, opacity: heroFadeOut }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse"
        />
        <motion.div
          style={{ y: heroBlob2Y, opacity: heroFadeOut }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/20 blur-[120px] rounded-full animate-pulse delay-700"
        />
      </div>

      {/* Navigation */}
      <nav role="navigation" aria-label="Main site navigation" className="sticky top-0 z-[100] bg-[var(--bg-app)]/70 backdrop-blur-2xl border-b border-[var(--glass-border)] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            aria-label="Chintu AI — return to homepage"
            className="flex items-center gap-3 no-drag hover:opacity-90 transition-opacity"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <div className="flex items-center justify-center w-8 h-8 hover:scale-110 transition-transform">
              <Image
                src="https://www.getchintu.com/icon.png"
                alt="Chintu AI Logo - Real-Time AI Interview & Exam Copilot"
                className="w-full h-full object-contain"
                width={32}
                height={32}
                unoptimized
                priority
                fetchPriority="high"
              />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase text-[var(--text-main)]">
              Chintu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4 no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hidden md:flex items-center gap-5 lg:gap-6"
              role="menubar"
            >
              <Link
                href="/#power-tools"
                aria-label="Jump to product features"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group"
                role="menuitem"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/#compare"
                aria-label="Compare Chintu vs other AI interview tools"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group"
                role="menuitem"
              >
                Compare
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/pricing"
                aria-label="View Chintu AI pricing plans"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group"
                role="menuitem"
              >
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/blog"
                aria-label="Read the Chintu AI blog"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group"
                role="menuitem"
              >
                Blog
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                href="/faq"
                aria-label="Browse the full FAQ"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group"
                role="menuitem"
              >
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
        <section id="hero" aria-label="Chintu AI Hero Section" className="relative px-6 pt-10 lg:pt-16 pb-20 max-w-7xl mx-auto w-full">
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
                        alt={`Chintu AI candidate review avatar ${i}`}
                        width={32}
                        height={32}
                        decoding="async"
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
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-cyan-400/40 blur-xl opacity-50 group-hover:opacity-90 transition-opacity duration-500" />
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
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                        priority={currentShowcase === 0}
                        fetchPriority={currentShowcase === 0 ? "high" : "auto"}
                        decoding={currentShowcase === 0 ? "sync" : "async"}
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
                whileHover={{ y: -4, scale: 1.04 }}
                className="hidden xl:flex absolute -left-6 top-1/4 items-center gap-2.5 px-3 py-2 bg-[var(--panel-bg)]/95 backdrop-blur-xl border border-[var(--glass-border)] rounded-xl shadow-2xl"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Verified</p>
                  <p className="text-[10px] font-black text-[var(--text-main)]">
                    <AnimatedCounter to={99.9} decimals={1} suffix="% Accuracy" />
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.2, duration: 0.7 }}
                whileHover={{ y: -4, scale: 1.04 }}
                className="hidden xl:flex absolute -right-6 top-1/2 items-center gap-2.5 px-3 py-2 bg-[var(--panel-bg)]/95 backdrop-blur-xl border border-[var(--glass-border)] rounded-xl shadow-2xl"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
                  <Zap className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <p className="text-[7px] font-black text-indigo-500 uppercase tracking-widest">Latency</p>
                  <p className="text-[10px] font-black text-[var(--text-main)]">
                    &lt; <AnimatedCounter to={200} suffix="ms" />
                  </p>
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

        {/* ─── How It Works (3 steps) ─────────────────────── */}
        <section id="how-it-works" aria-label="How Chintu AI works" className="py-16 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden border-y border-[var(--glass-border)]">
          <div className="absolute top-0 left-1/4 w-[28rem] h-[28rem] bg-indigo-500/8 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] bg-purple-500/8 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-12 sm:mb-16 lg:mb-20"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-5 sm:mb-6">
                <Rocket className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Get Started in 60s</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-main)] mb-4">
                How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">Works.</span>
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-[10px] sm:text-xs max-w-2xl mx-auto">
                Three steps from sign-up to real-time invisible answers in your interview.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-7 relative">
              {/* Connecting line — md+ only */}
              <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/40 to-cyan-500/0 pointer-events-none" />

              {howItWorksSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6 }}
                  className="relative rounded-[1.5rem] sm:rounded-[2rem] border border-[var(--glass-border)] bg-[var(--panel-bg)] backdrop-blur-xl p-6 sm:p-7 hover:border-indigo-500/40 transition-colors group"
                >
                  {/* Big step number */}
                  <div className={`absolute -top-5 left-6 text-6xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br ${step.accent} opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none select-none`}>
                    {step.num}
                  </div>

                  {/* Icon badge */}
                  <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center shadow-xl mb-5 sm:mb-6`}>
                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>

                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">{step.tag}</p>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter uppercase text-[var(--text-main)] mb-3 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[11px] sm:text-[12px] text-[var(--text-dim)] font-medium leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Sub-CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              {!isSignedIn ? (
                <Link
                  href="/sign-up"
                  className="px-7 py-3.5 bg-indigo-600 text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Get Chintu Now <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="px-7 py-3.5 bg-indigo-600 text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-dim)]">
                No download required for web — overlay optional
              </span>
            </motion.div>
          </div>
        </section>

        {/* Text Reveal */}
        <section className="bg-[var(--bg-app)] relative">
          <TextReveal text="Chintu Intelligence is not just a tool. It is a strategic evolution for your career. Master any challenge. Instantly." />
        </section>

        {/* Strategic Intelligence Hub */}
        <section id="strategic-intelligence" aria-label="Chintu AI Strategic Intelligence Hub" className="py-16 sm:py-20 lg:py-24 px-6 bg-[var(--bg-app)] relative overflow-hidden">
          {!isElectron && <div className="absolute inset-0 pointer-events-none opacity-50"><Meteors number={10} /></div>}
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12">
              <div className="flex-1 space-y-4 sm:space-y-6 w-full">
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
                  <Layers className="w-3.5 h-3.5" /> System Architecture
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tighter uppercase leading-none text-[var(--text-main)] mb-6">
                  Advanced <span className="text-indigo-600">Strategic</span> Modules
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4">
                  {[
                    { icon: Search, label: "Live Intel", desc: "Real-time web analysis" },
                    { icon: Code, label: "Logic Engine", desc: "Complex problem solving" },
                    { icon: BookOpen, label: "Memory Bank", desc: "Session persistence" },
                    { icon: MousePointer2, label: "Direct Action", desc: "Click-to-execute logic" }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-[var(--glass-border)] bg-[var(--panel-bg)] hover:border-indigo-500/50 hover:bg-[var(--glass-bg)] transition-colors group cursor-default"
                    >
                      <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-dim)] group-hover:text-indigo-400 mb-2 sm:mb-3 transition-colors" />
                      <p className="text-[11px] sm:text-xs font-black uppercase tracking-tight text-[var(--text-main)]">{item.label}</p>
                      <p className="text-[9px] sm:text-[10px] text-[var(--text-dim)] font-bold uppercase">{item.desc}</p>
                    </motion.div>
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
        <section id="total-coverage" aria-label="Chintu AI Total Coverage" className="py-20 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          {!isElectron && <div className="absolute inset-0 pointer-events-none opacity-40"><Meteors number={15} /></div>}
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="reveal text-center mb-12 sm:mb-16 lg:mb-24 transition-all duration-1000">
              <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-4 sm:mb-6">Omniscient Intelligence</h2>
              <p className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-main)]">
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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: (i % 4) * 0.08 + Math.floor(i / 4) * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  className="bg-[var(--panel-bg)] border border-[var(--glass-border)] p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2rem] lg:rounded-[2.5rem] hover:bg-[var(--glass-bg)] hover:border-indigo-500/50 transition-colors duration-500 group"
                >
                  <h4 className="font-black text-[10px] sm:text-[12px] uppercase tracking-widest text-indigo-400 mb-2 sm:mb-3 group-hover:text-[var(--text-main)] transition-colors">{item.title}</h4>
                  <p className="text-[9px] sm:text-[11px] text-[var(--text-dim)] font-bold uppercase tracking-tight leading-relaxed group-hover:text-[var(--text-main)] transition-colors">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Platform Compatibility ─────────────────────── */}
        <section id="platforms" aria-label="Supported interview and exam platforms" className="py-16 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-10 sm:mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-5 sm:mb-6">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Universal Compatibility</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-main)] mb-4">
                Works <br className="sm:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500">Everywhere.</span>
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-[10px] sm:text-xs max-w-2xl mx-auto">
                Invisible across every video, coding, AI-interview and proctoring platform on the planet.
              </p>
            </motion.div>

            {/* Platform pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {supportedPlatforms.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: (i % 4) * 0.06 + Math.floor(i / 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, scale: 1.05 }}
                  className="relative flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--panel-bg)]/80 backdrop-blur-xl hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors group cursor-default"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 overflow-hidden">
                    {p.logo ? (
                      <Image
                        src={p.logo}
                        alt={`${p.name} official logo`}
                        width={24}
                        height={24}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <p.icon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 group-hover:text-cyan-400 transition-colors" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-[13px] font-black uppercase tracking-tight text-[var(--text-main)] truncate">
                      {p.name}
                    </p>
                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] group-hover:text-cyan-500/80 transition-colors">
                      {p.category}
                    </p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-500/70 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footnote */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 sm:mt-10 text-center text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-dim)]"
            >
              + many more — if it runs on your screen, Chintu works with it.
            </motion.p>
          </div>
        </section>

        {/* Snapshot Section */}
        <section id="snapshot" aria-label="Chintu AI Snapshot Section" className="py-20 sm:py-32 lg:py-40 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div className="reveal transition-all duration-1000">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6 sm:mb-8">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Snapshot Intelligence</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-main)] mb-6 sm:mb-8">
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

        {/* ─── Authentic Voice Demo ─── */}
        <section id="authentic-voice" aria-label="Authentic conversational AI voice demo" className="py-16 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden border-y border-[var(--glass-border)]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 blur-[100px] rounded-full" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-10 sm:mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full mb-5 sm:mb-6">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Authentic Voice</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-main)] mb-4">
                Sound <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Human.</span> <br className="sm:hidden" />Not Robotic.
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-[10px] sm:text-xs max-w-2xl mx-auto">
                AI answers that sound like an actual person, not a textbook. Direct, conversational and authentic — the way real engineers actually speak.
              </p>
            </motion.div>

            {/* Question Card */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl mx-auto mb-6 sm:mb-10"
            >
              <div className="relative rounded-[1.5rem] sm:rounded-[2rem] border border-indigo-500/30 bg-[var(--panel-bg)] backdrop-blur-xl p-5 sm:p-7 shadow-xl shadow-indigo-500/5">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] rounded-full shadow-lg shadow-indigo-500/30">
                  Interview Question
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-[var(--text-main)] font-bold leading-relaxed pt-2">
                  &ldquo;{humanDemo.question}&rdquo;
                </p>
              </div>
            </motion.div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7">
              {/* Textbook (bad) */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative rounded-[1.5rem] sm:rounded-[2rem] border border-rose-500/20 bg-[var(--panel-bg)]/80 backdrop-blur-xl p-5 sm:p-7 group hover:border-rose-500/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500/15 flex items-center justify-center">
                      <ThumbsDown className="w-4 h-4 text-rose-500" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-rose-500">Other Tools</span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-rose-500/70 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                    Textbook
                  </span>
                </div>
                <p className="text-[11px] sm:text-[13px] text-[var(--text-dim)] font-medium leading-relaxed italic">
                  &ldquo;{humanDemo.textbook}&rdquo;
                </p>
                <p className="mt-4 sm:mt-5 text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <X className="w-3 h-3" /> Sounds rehearsed, not authentic
                </p>
              </motion.div>

              {/* Authentic (good) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="relative rounded-[1.5rem] sm:rounded-[2rem] border-2 border-emerald-500/40 bg-[var(--panel-bg)] backdrop-blur-xl p-5 sm:p-7 shadow-xl shadow-emerald-500/10 group hover:border-emerald-500/60 transition-colors"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-2xl opacity-50 -z-10 rounded-[2rem]" />
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                      <ThumbsUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">Chintu AI</span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    Authentic
                  </span>
                </div>
                <p className="text-[11px] sm:text-[13px] text-[var(--text-main)] font-medium leading-relaxed">
                  &ldquo;{humanDemo.authentic}&rdquo;
                </p>
                <p className="mt-4 sm:mt-5 text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Check className="w-3 h-3" /> Real, relatable, how people actually talk
                </p>
              </motion.div>
            </div>

            {/* Quick stats strip */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {[
                { val: 52, suffix: "+", label: "Languages", color: "text-indigo-500" },
                { val: 99.9, suffix: "%", decimals: 1, label: "Accuracy", color: "text-emerald-500" },
                { val: 200, suffix: "ms", prefix: "<", label: "Latency", color: "text-purple-500" },
                { val: 10, suffix: "k+", label: "Candidates", color: "text-cyan-500" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -4, scale: 1.04 }}
                  className="rounded-2xl border border-[var(--glass-border)] bg-[var(--panel-bg)]/80 backdrop-blur-xl p-4 sm:p-5 text-center"
                >
                  <div className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter ${s.color}`}>
                    <AnimatedCounter
                      to={s.val}
                      decimals={s.decimals ?? 0}
                      suffix={s.suffix}
                      prefix={s.prefix ?? ""}
                    />
                  </div>
                  <div className="mt-1 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-dim)]">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── Power Tools Spotlight (Mock + Resume) ─── */}
        <section id="power-tools" aria-label="Mock Interview and AI Resume Builder" className="py-16 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden border-y border-[var(--glass-border)]">
          <div className="absolute top-0 left-0 w-[35%] h-[60%] bg-indigo-500/8 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[35%] h-[60%] bg-cyan-500/8 blur-[140px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-12 sm:mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full mb-5 sm:mb-6">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Beyond The Overlay</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-main)] mb-4">
                More <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Power.</span> One Subscription.
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-[10px] sm:text-xs max-w-2xl mx-auto">
                The interview overlay is just the start. Practise. Polish. Land the offer.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7">
              {powerTools.map((tool, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6 }}
                  className="relative rounded-[1.5rem] sm:rounded-[2.5rem] border border-[var(--glass-border)] bg-[var(--panel-bg)] backdrop-blur-xl overflow-hidden group hover:border-indigo-500/40 transition-colors"
                >
                  {/* Gradient accent strip on top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tool.accent}`} />
                  {/* Soft glow */}
                  <div className={`absolute -inset-1 bg-gradient-to-r ${tool.accent} opacity-0 group-hover:opacity-10 blur-3xl -z-10 transition-opacity`} />

                  <div className="p-6 sm:p-8 lg:p-10">
                    <div className="flex items-center gap-3 mb-5 sm:mb-6">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${tool.accent} flex items-center justify-center shadow-xl`}>
                        <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                        {tool.tag}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-[var(--text-main)] mb-3 sm:mb-4 leading-[0.95]">
                      {tool.title}
                    </h3>
                    <p className="text-[12px] sm:text-[13px] text-[var(--text-dim)] font-medium leading-relaxed mb-5 sm:mb-6">
                      {tool.desc}
                    </p>

                    <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                      {tool.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <div className={`mt-0.5 w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full bg-gradient-to-br ${tool.accent} flex items-center justify-center flex-shrink-0`}>
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          </div>
                          <span className="text-[11px] sm:text-[12px] font-bold text-[var(--text-main)] leading-snug">
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500 hover:border-indigo-500 hover:text-white text-indigo-400 font-black uppercase tracking-[0.25em] text-[10px] transition-colors"
                    >
                      {tool.cta} <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <TestimonialsSection />

        {/* ─── Hired At Top Companies ─────────────────────── */}
        <section id="hired-at" aria-label="Companies whose candidates use Chintu AI" className="py-12 sm:py-16 lg:py-20 px-6 bg-[var(--bg-app)] relative overflow-hidden border-y border-[var(--glass-border)]">
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-8 sm:mb-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Trusted Outcomes</span>
              </div>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-[var(--text-dim)] mb-2">
                Candidates Using Chintu Got Hired At
              </p>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter uppercase text-[var(--text-main)]">
                Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-400">Global</span> Companies.
              </h3>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 lg:gap-10">
              {hiredAtCompanies.map((co, i) => (
                <motion.div
                  key={co.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex items-center gap-2.5 group transition-all duration-500 cursor-default"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center overflow-hidden">
                    <Image
                      src={co.logo}
                      alt={`${co.name} official logo`}
                      width={24}
                      height={24}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] group-hover:text-[var(--text-main)] transition-colors">
                    {co.name}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-6 sm:mt-8 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-dim)]"
            >
              + thousands of startups, FAANG and fortune-500 firms
            </motion.p>
          </div>
        </section>

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

        {/* ─── Comparison Table: Chintu vs alternatives ─── */}
        <section id="compare" aria-label="Compare Chintu AI to other interview copilots" className="py-16 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          {!isElectron && <div className="absolute inset-0 pointer-events-none opacity-30"><Meteors number={10} /></div>}

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-10 sm:mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-5 sm:mb-6">
                <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Why Chintu Wins</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-main)] mb-4">
                Chintu vs <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">The Rest.</span>
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-[10px] sm:text-xs max-w-2xl mx-auto">
                Same elite stealth. More features. Lower latency. Built for the toughest interview reality.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <ComparisonTable
                rows={comparisonRows}
                competitorAName="Final Round AI"
                competitorBName="LockedIn AI"
              />
            </motion.div>

            {/* CTA below table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            >
              {!isSignedIn ? (
                <Link
                  href="/sign-up"
                  className="px-7 py-3.5 bg-indigo-600 text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Try Chintu Free <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="px-7 py-3.5 bg-indigo-600 text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  View Pricing <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-dim)]">
                No credit card required
              </span>
            </motion.div>
          </div>
        </section>

        {/* ─── Pricing Cards (Monthly / Yearly toggle) ─── */}
        <section id="pricing" aria-label="Pricing plans for Chintu AI" className="py-16 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden border-y border-[var(--glass-border)]">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[70%] h-[60%] bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-amber-500/5 blur-[140px] rounded-full pointer-events-none" />
          {!isElectron && <div className="absolute inset-0 pointer-events-none opacity-20"><Meteors number={8} /></div>}

          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-10 sm:mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-5 sm:mb-6">
                <CircleDollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">Honest Pricing</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-main)] mb-4">
                Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400">Plans.</span> No Lock-in.
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-[10px] sm:text-xs max-w-2xl mx-auto">
                Cheaper than competitors. Cancel anytime. 7-day money-back guarantee on every paid plan.
              </p>

              {/* Monthly / Yearly Toggle */}
              <div className="mt-7 sm:mt-9 inline-flex items-center gap-1 p-1 rounded-full border border-[var(--glass-border)] bg-[var(--panel-bg)] backdrop-blur-xl no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                  onClick={() => setPricingMode("monthly")}
                  aria-pressed={pricingMode === "monthly"}
                  className={`relative px-5 sm:px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-colors ${
                    pricingMode === "monthly"
                      ? "text-white"
                      : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {pricingMode === "monthly" && (
                    <motion.span
                      layoutId="pricing-toggle-pill"
                      className="absolute inset-0 rounded-full bg-indigo-600 shadow-lg shadow-indigo-500/40 -z-10"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                  Monthly
                </button>
                <button
                  onClick={() => setPricingMode("yearly")}
                  aria-pressed={pricingMode === "yearly"}
                  className={`relative px-5 sm:px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-colors flex items-center gap-2 ${
                    pricingMode === "yearly"
                      ? "text-white"
                      : "text-[var(--text-dim)] hover:text-[var(--text-main)]"
                  }`}
                >
                  {pricingMode === "yearly" && (
                    <motion.span
                      layoutId="pricing-toggle-pill"
                      className="absolute inset-0 rounded-full bg-indigo-600 shadow-lg shadow-indigo-500/40 -z-10"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                  Yearly
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${pricingMode === "yearly" ? "bg-amber-400 text-amber-950" : "bg-emerald-500/15 text-emerald-500"}`}>
                    -40%
                  </span>
                </button>
              </div>
            </motion.div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-7 items-stretch">
              {pricingPlans.map((plan, i) => {
                const price = pricingMode === "monthly" ? plan.monthly : plan.yearly;
                const showStrike = pricingMode === "yearly" && plan.monthly > plan.yearly;
                return (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -8 }}
                    className={`relative rounded-[1.5rem] sm:rounded-[2.5rem] border p-6 sm:p-8 backdrop-blur-xl flex flex-col ${
                      plan.highlighted
                        ? "border-indigo-500/40 bg-[var(--panel-bg)] shadow-2xl shadow-indigo-500/20 md:scale-[1.04]"
                        : "border-[var(--glass-border)] bg-[var(--panel-bg)]/80 hover:border-indigo-500/30"
                    } transition-colors`}
                  >
                    {plan.highlighted && (
                      <>
                        <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-2xl -z-10 rounded-[2.5rem]" />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-indigo-500/30 whitespace-nowrap">
                          ⚡ Most Popular
                        </div>
                      </>
                    )}

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5 sm:mb-6">
                      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${plan.accent} flex items-center justify-center shadow-lg`}>
                        <plan.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-[var(--text-main)] leading-none">{plan.name}</h3>
                        <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-dim)] mt-1">{plan.blurb}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-5 sm:mb-6 min-h-[68px]">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={pricingMode + plan.name}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="flex items-baseline gap-1.5"
                        >
                          <span className="text-[var(--text-dim)] text-2xl sm:text-3xl font-black">₹</span>
                          <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-[var(--text-main)] leading-none">
                            {price.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] ml-1">
                            {price === 0 ? "" : "/ mo"}
                          </span>
                        </motion.div>
                      </AnimatePresence>
                      {showStrike && (
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">
                          <span className="line-through opacity-60">₹{plan.monthly.toLocaleString("en-IN")}</span>{" "}
                          <span className="text-emerald-500">save {Math.round((1 - plan.yearly / plan.monthly) * 100)}%</span>
                        </p>
                      )}
                      {!showStrike && pricingMode === "yearly" && plan.yearly === 0 && (
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                          Forever free
                        </p>
                      )}
                      {pricingMode === "yearly" && plan.yearly > 0 && (
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-dim)]">
                          Billed annually
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-7 sm:mb-8 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5">
                          <div className={`mt-0.5 w-4 h-4 rounded-full bg-gradient-to-br ${plan.accent} flex items-center justify-center flex-shrink-0`}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="text-[11px] sm:text-[12px] font-bold text-[var(--text-main)] leading-snug">
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href={plan.href}
                      className={`block text-center px-5 py-3.5 rounded-xl font-black uppercase tracking-[0.25em] text-[10px] transition-colors ${
                        plan.highlighted
                          ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500"
                          : "border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:border-indigo-500 hover:text-white"
                      }`}
                    >
                      {plan.cta} <ArrowRight className="inline-block w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Guarantee strip below pricing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[var(--text-dim)]"
            >
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em]">
                <Shield className="w-3.5 h-3.5 text-emerald-500" /> 7-Day Money-Back
              </span>
              <span className="text-[var(--text-dim)] opacity-30">•</span>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em]">
                <Zap className="w-3.5 h-3.5 text-indigo-500" /> Instant Activation
              </span>
              <span className="text-[var(--text-dim)] opacity-30">•</span>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em]">
                <X className="w-3.5 h-3.5 text-rose-500" /> Cancel Anytime
              </span>
              <span className="text-[var(--text-dim)] opacity-30">•</span>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em]">
                <IndianRupee className="w-3.5 h-3.5 text-amber-500" /> UPI, Cards, Netbanking
              </span>
            </motion.div>
          </div>
        </section>

        {/* ─── Creator / Affiliate Program ─────────────────── */}
        <section id="creators" aria-label="Chintu AI Creator and Affiliate Program" className="py-16 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[40%] h-[60%] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[40%] h-[60%] bg-rose-500/5 blur-[140px] rounded-full pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-10 sm:mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full mb-5 sm:mb-6">
                <Gift className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em]">Creator Program</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-main)] mb-4">
                Make A Reel. <br className="sm:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500">Get Paid.</span>
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-[10px] sm:text-xs max-w-2xl mx-auto">
                Post a video about Chintu on Instagram, YouTube or LinkedIn. Tag us. Earn cash for every view bracket you hit.
              </p>
            </motion.div>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {creatorTiers.map((tier, i) => (
                <motion.div
                  key={tier.label}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className={`relative rounded-[1.5rem] sm:rounded-[2rem] border p-6 sm:p-8 backdrop-blur-xl flex flex-col items-center text-center ${
                    tier.highlighted
                      ? "border-indigo-500/40 bg-[var(--panel-bg)] shadow-2xl shadow-indigo-500/20 md:scale-105"
                      : "border-[var(--glass-border)] bg-[var(--panel-bg)]/80 hover:border-rose-500/30"
                  } transition-colors`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-400 to-rose-500 text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg whitespace-nowrap">
                      ★ Most Earned
                    </div>
                  )}

                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${tier.accent} flex items-center justify-center shadow-xl mb-4 sm:mb-5`}>
                    <tier.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>

                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-dim)] mb-1">
                    {tier.label}
                  </p>
                  <p className="text-[11px] sm:text-[12px] font-black uppercase tracking-widest text-[var(--text-main)] mb-4">
                    {tier.views} Views
                  </p>

                  <div className="my-3 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--glass-border)] to-transparent" />

                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-dim)] mb-1">Reward</p>
                  <p className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br ${tier.accent} leading-none`}>
                    {tier.reward}
                  </p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-dim)]">{tier.perVideo}</p>
                </motion.div>
              ))}
            </div>

            {/* Creator CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 sm:mt-14 text-center"
            >
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-amber-400 to-rose-500 text-white font-black uppercase tracking-[0.25em] text-[10px] rounded-xl shadow-2xl shadow-rose-500/30 hover:scale-[1.04] active:scale-95 transition-transform"
              >
                <Share2 className="w-4 h-4" /> Apply To Creator Program <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-dim)]">
                Approved creators paid weekly. UPI / PayPal / Bank transfer.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── FAQ Accordion ─── */}
        <section id="faq" aria-label="Frequently asked questions" className="py-16 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden border-y border-[var(--glass-border)]">
          <div className="absolute -top-20 left-1/4 w-[24rem] h-[24rem] bg-indigo-500/8 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 right-1/4 w-[24rem] h-[24rem] bg-purple-500/8 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-10 sm:mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-5 sm:mb-6">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Knowledge Base</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-[var(--text-main)] mb-4">
                Frequently <br className="sm:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Asked.</span>
              </h2>
              <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-[10px] sm:text-xs max-w-2xl mx-auto">
                Everything you need to know — about stealth, speed, platforms and pricing.
              </p>
            </motion.div>

            <FaqAccordion items={faqItems} />

            {/* "Browse the full FAQ" CTA — bridge to /faq page */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 sm:mt-12 text-center"
            >
              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-dim)] mb-4">
                Looking for something more specific?
              </p>
              <Link
                href="/faq"
                aria-label="Browse the full Chintu AI FAQ"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:border-cyan-500 hover:text-white font-black uppercase tracking-[0.25em] text-[10px] transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Browse the full FAQ
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ─── Final CTA + Guarantee Banner ─────────────────── */}
        <section id="get-started" aria-label="Get started with Chintu AI today" className="py-16 sm:py-24 lg:py-32 px-6 bg-[var(--bg-app)] relative overflow-hidden">
          {!isElectron && <div className="absolute inset-0 pointer-events-none opacity-40"><Meteors number={14} /></div>}

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-6xl mx-auto rounded-[2rem] sm:rounded-[3rem] overflow-hidden"
          >
            {/* Glowing border + gradient bg */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-[3rem] opacity-30 blur-2xl pointer-events-none" />
            <div className="relative bg-[var(--panel-bg)] border border-indigo-500/30 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 lg:p-16 overflow-hidden">
              {/* Animated gradient accent */}
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-full mb-5 sm:mb-6">
                    <Rocket className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Final Mission Brief</span>
                  </div>

                  <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter uppercase leading-[0.85] text-[var(--text-main)] mb-5 sm:mb-7">
                    Stop Studying. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">
                      Start Winning.
                    </span>
                  </h2>

                  <p className="text-[12px] sm:text-[14px] text-[var(--text-dim)] font-medium leading-relaxed mb-6 sm:mb-8 max-w-xl">
                    Your next interview is a 60-minute window. Don&rsquo;t walk in alone. Activate Chintu,
                    stay invisible, and let elite intelligence handle the questions while you handle the offer.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                    {!isSignedIn ? (
                      <Link
                        href="/sign-up"
                        className="px-7 py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.25em] text-[11px] rounded-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <Rocket className="w-4 h-4" /> Start Free Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        className="px-7 py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.25em] text-[11px] rounded-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        <Rocket className="w-4 h-4" /> Open Dashboard <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    <Link
                      href="/pricing"
                      className="px-7 py-4 border border-[var(--glass-border)] bg-[var(--bg-app)]/60 text-[var(--text-main)] font-black uppercase tracking-[0.25em] text-[11px] rounded-xl hover:border-indigo-500/40 transition-colors flex items-center justify-center gap-3"
                    >
                      View Pricing
                    </Link>
                  </div>

                  {/* Trust pills */}
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[9px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-[0.25em]">
                      <Check className="w-3 h-3" /> No Credit Card
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-[9px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em]">
                      <Zap className="w-3 h-3" /> 60-Sec Setup
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-[9px] sm:text-[10px] font-black text-purple-500 uppercase tracking-[0.25em]">
                      <Shield className="w-3 h-3" /> 100% Stealth
                    </span>
                  </div>
                </div>

                {/* Right: 7-day money back badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ rotate: 0, scale: 1.04 }}
                  className="relative mx-auto"
                >
                  <div className="relative w-52 h-52 sm:w-64 sm:h-64 lg:w-72 lg:h-72">
                    {/* Outer glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-cyan-500 to-indigo-500 rounded-full blur-2xl opacity-50 animate-pulse" />
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-dashed border-emerald-400/40 animate-spin" style={{ animationDuration: "30s" }} />
                    {/* Inner solid badge */}
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-indigo-600 flex flex-col items-center justify-center text-white shadow-2xl shadow-emerald-500/40 p-4 text-center">
                      <Shield className="w-7 h-7 sm:w-9 sm:h-9 mb-1.5" />
                      <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] opacity-90">Risk-Free</p>
                      <p className="text-3xl sm:text-4xl font-black tracking-tighter leading-none mt-1">7-Day</p>
                      <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] mt-1">Money Back</p>
                      <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.3em] opacity-80 mt-2">Guarantee</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

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
                    alt={`Chintu AI candidate review avatar ${i}`}
                    width={28}
                    height={28}
                    loading="lazy"
                    decoding="async"
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