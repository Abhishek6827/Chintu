import {
  Download, Video, Sparkles, UserCheck, Code, Users, MessageSquare, Gift, Gem, Crown, Share2, Rocket, Play, FileText,
} from "lucide-react";
import { type FaqItem, type CompareRow } from '@/components/LandingEnhancements';

export const showcaseSlides = [
  {
    src: "/signin.png",
    category: "Secure Access",
    title: "Encrypted Login Portal",
    description: "Enterprise-grade authentication with Google, GitHub OAuth and encrypted email — your data, your control.",
    accent: "from-teal-500 to-blue-500",
    badge: "Secure Auth",
  },
  {
    src: "/setup.png",
    category: "Profile Setup",
    title: "Personalized Intelligence",
    description: "Drop a resume, LinkedIn summary or short bio — Chintu structures it into a tactical profile that powers every answer.",
    accent: "from-teal-500 to-pink-500",
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
    accent: "from-teal-500 to-teal-500",
    badge: "Code Intelligence",
  },
  {
    src: "/4.png",
    category: "Platform Sync",
    title: "Universal Interview Overlay",
    description: "Floating overlay works seamlessly with micro1, HireVue and every global proctored or live interview platform.",
    accent: "from-blue-500 to-teal-500",
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
    accent: "from-teal-500 to-fuchsia-500",
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

export const comparisonRows: CompareRow[] = [
  { feature: "Real-Time AI Answers", chintu: true, compA: true, compB: true },
  { feature: "Stealth / Invisible Mode", chintu: true, compA: true, compB: true },
  { feature: "Conversational Human Tone", chintu: true, compA: false, compB: false },
  { feature: "Vision OCR Snapshot", chintu: true, compA: false, compB: false },
  { feature: "Hold-Space Voice Capture", chintu: true, compA: false, compB: false },
  { feature: "Scout + Turbo Debugger", chintu: true, compA: false, compB: false },
  { feature: "Universal Overlay", chintu: true, compA: true, compB: true },
  { feature: "Latency", chintu: "<200ms", compA: "~500ms", compB: "~400ms" },
  { feature: "Languages Supported", chintu: "63+", compA: "30+", compB: "63+" },
  { feature: "Long-Form Behavioral", chintu: true, compA: true, compB: true },
];

export const faqItems: FaqItem[] = [
  {
    q: "Is Chintu Ji invisible to interviewers and proctors?",
    a: "Yes. Chintu Ji runs as a stealth overlay at the system level — invisible to screen sharing, recording, and proctoring tools across Zoom, Google Meet, Microsoft Teams, HackerRank, and more.",
  },
  {
    q: "Which interview platforms does Chintu Ji support?",
    a: "Chintu Ji is platform-agnostic. Our universal overlay works with every major video / proctoring / coding platform including Zoom, Google Meet, Microsoft Teams, HireVue, micro1, HackerRank and LeetCode.",
  },
  {
    q: "Can Chintu Ji solve coding interview questions?",
    a: "Absolutely. Scout + Turbo, our multi-model debugger, performs root-cause analysis on logic errors, type mismatches and runtime crashes — and produces verified fixes with line-by-line reasoning.",
  },
  {
    q: "How fast is the response?",
    a: "Sub-200ms median latency. The vision engine OCRs your screen, the LLM orchestrator routes the question, and the answer streams back instantly — fast enough for live questions.",
  },
  {
    q: "Does Chintu Ji work for online exams and MCQs?",
    a: "Yes. Snapshot Intelligence captures any MCQ or equation, processes the context with our vision engine, and delivers the exact answer in milliseconds — including multi-step proofs.",
  },
  {
    q: "What languages does Chintu Ji support?",
    a: "63+ languages with real-time transcription, plus an Authentic Voice engine that crafts answers in a natural, conversational tone — never robotic or rehearsed, never recycled boilerplate.",
  },
  {
    q: "How does the credit and refund policy work?",
    a: "Credits never expire. Subscriptions and lifetime plans are available for unlimited usage. Every purchase is backed by a 7-day money-back guarantee.",
  },
  {
    q: "Can I use Chintu Ji on my phone?",
    a: "Yes. Chintu Ji has a mobile-optimised version accessible directly in your browser — no app store download required. Run desktop and mobile simultaneously on a single session.",
  },
];

export const faqPageSchema = {
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

export const videoSchema = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Chintu Ji — Real-Time AI Interview Copilot Demo",
  "description": "Watch how Chintu Ji helps you solve coding tests, MCQs, and online exams in real-time with sub-200ms latency. Stealth, invisible, and accurate.",
  "thumbnailUrl": [
    "https://www.getchintu.com/og-image.png"
  ],
  "uploadDate": "2026-05-01T08:00:00+05:30",
  "duration": "PT0M30S",
  "contentUrl": "https://www.getchintu.com/1.mp4",
  "embedUrl": "https://www.getchintu.com/",
  "potentialAction": {
    "@type": "SeekAction",
    "target": "https://www.getchintu.com/?={seek_to_start_time}",
    "startOffset-input": "required name=seek_to_start_time"
  }
};

export const humanDemo = {
  question: "What is the toughest bug you have ever debugged in production?",
  textbook:
    "Throughout my professional tenure I have systematically addressed numerous complex software defects necessitating rigorous root-cause analysis. One particularly noteworthy incident involved an intermittent service degradation, which I resolved through methodical investigation, structured hypothesis testing and the disciplined application of established debugging methodologies, ultimately yielding a sustainable and well-documented resolution aligned with organisational best practices.",
  authentic:
    "Honestly, the worst one was a memory leak in our checkout service — the pods would die every four hours and the logs were giving us nothing. I spent two days dumping heap snapshots and tracing allocations before I noticed we were holding closed Redis connections inside a retry loop. The actual fix was three lines of cleanup. The bigger takeaway, though — when nothing in the logs adds up, look at what your retry handlers are silently doing in the background. Every retry I write now has explicit cleanup, no exceptions.",
};

export const howItWorksSteps = [
  {
    num: "01",
    icon: Download,
    accent: "from-teal-500 to-blue-500",
    tag: "Step One",
    title: "Sign Up. Install. Log In.",
    desc: "Create a free account, download the stealth overlay for Windows / macOS, and you are ready in under 60 seconds. No credit card, no fuss.",
  },
  {
    num: "02",
    icon: Video,
    accent: "from-teal-500 to-pink-500",
    tag: "Step Two",
    title: "Join Your Interview.",
    desc: "Jump onto any platform — Zoom, Meet, Teams, HireVue, anything. Chintu Ji stays invisible to screen-share, recording and proctoring.",
  },
  {
    num: "03",
    icon: Sparkles,
    accent: "from-emerald-500 to-cyan-400",
    tag: "Step Three",
    title: "Get Instant Answers.",
    desc: "Hold Space to capture voice. Snapshot the screen for MCQs and code. Chintu Ji streams accurate, human-sounding answers in under 200 ms.",
  },
];

export const supportedPlatforms = [
  { name: "Zoom", icon: Video, category: "Video", logo: "https://cdn.brandfetch.io/zoom.us/icon" },
  { name: "Google Meet", icon: Video, category: "Video", logo: "https://cdn.brandfetch.io/meet.google.com/icon" },
  { name: "Microsoft Teams", icon: Video, category: "Video", logo: "https://cdn.brandfetch.io/teams.microsoft.com/icon" },
  { name: "Webex", icon: Video, category: "Video", logo: "https://cdn.brandfetch.io/webex.com/icon" },
  { name: "Amazon Chime", icon: Video, category: "Video", logo: "https://cdn.brandfetch.io/chime.aws/icon" },
  { name: "Skype", icon: Video, category: "Video", logo: "https://cdn.brandfetch.io/skype.com/icon" },
  { name: "HireVue", icon: UserCheck, category: "AI Interview", logo: "https://cdn.brandfetch.io/hirevue.com/icon" },
  { name: "micro1", icon: UserCheck, category: "AI Interview", logo: "https://cdn.brandfetch.io/micro1.ai/icon" },
  { name: "Karat", icon: UserCheck, category: "AI Interview", logo: "https://cdn.brandfetch.io/karat.com/icon" },
  { name: "Interviewing.io", icon: UserCheck, category: "Live Coding", logo: "https://cdn.brandfetch.io/interviewing.io/icon" },
  { name: "HackerRank", icon: Code, category: "Coding", logo: "https://cdn.brandfetch.io/hackerrank.com/icon" },
  { name: "LeetCode", icon: Code, category: "Coding", logo: "https://cdn.brandfetch.io/leetcode.com/icon" },
  { name: "CoderPad", icon: Code, category: "Coding", logo: "https://cdn.brandfetch.io/coderpad.io/icon" },
  { name: "Codility", icon: Code, category: "Coding", logo: "https://cdn.brandfetch.io/codility.com/icon" },
  { name: "Pramp", icon: Users, category: "Peer Practice", logo: "https://cdn.brandfetch.io/pramp.com/icon" },
  { name: "Discord", icon: MessageSquare, category: "Chat", logo: "https://cdn.brandfetch.io/discord.com/icon" },
];

export const hiredAtCompanies = [
  { name: "Google", logo: "https://cdn.brandfetch.io/google.com/icon" },
  { name: "Meta", logo: "https://cdn.brandfetch.io/meta.com/icon" },
  { name: "Amazon", logo: "https://cdn.brandfetch.io/amazon.com/icon" },
  { name: "Microsoft", logo: "https://cdn.brandfetch.io/microsoft.com/icon" },
  { name: "Apple", logo: "https://cdn.brandfetch.io/apple.com/icon" },
  { name: "Netflix", logo: "https://cdn.brandfetch.io/netflix.com/icon" },
  { name: "Uber", logo: "https://cdn.brandfetch.io/uber.com/icon" },
  { name: "Tesla", logo: "https://cdn.brandfetch.io/tesla.com/icon" },
  { name: "Stripe", logo: "https://cdn.brandfetch.io/stripe.com/icon" },
  { name: "Goldman Sachs", logo: "https://cdn.brandfetch.io/goldmansachs.com/icon" },
  { name: "McKinsey", logo: "https://cdn.brandfetch.io/mckinsey.com/icon" },
  { name: "Deloitte", logo: "https://cdn.brandfetch.io/deloitte.com/icon" },
];

export const powerTools = [
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
    accent: "from-teal-500 via-teal-500 to-pink-500",
    cta: "Start Practising",
    href: "/dashboard",
  },
  {
    icon: FileText,
    tag: "AI Resume Builder",
    title: "JD-Tailored Resume Engine",
    desc:
      "Paste the job description once. Chintu Ji rewrites your resume to match the keywords, recruiter scanners and the exact voice of the company — ATS-ready in 30 seconds.",
    bullets: [
      "ATS keyword optimisation",
      "Role + JD specific tailoring",
      "Designer-grade templates",
      "One-click PDF export",
    ],
    accent: "from-cyan-400 via-blue-500 to-teal-500",
    cta: "Build My Resume",
    href: "/dashboard",
  },
];

export type PricingPlan = {
  name: string;
  blurb: string;
  monthly: number;
  yearly: number;
  icon: any;
  accent: string;
  highlighted?: boolean;
  cta: string;
  href: string;
  features: string[];
};

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    blurb: "Explore Chintu Ji's capabilities",
    monthly: 0,
    yearly: 0,
    icon: Gift,
    accent: "from-slate-400 to-slate-500",
    cta: "Start Free",
    href: "/sign-up",
    features: [
      "10 Credits / month (resets monthly)",
      "1 Profile & 1 Resume Upload",
      "Standard Engine only",
      "Basic Response Types",
      "Standard History",
      "Community Support",
    ],
  },
  {
    name: "Professional",
    blurb: "Best for active interviewees",
    monthly: 29,
    yearly: 9,
    icon: Gem,
    accent: "from-teal-500 to-teal-500",
    highlighted: true,
    cta: "Upgrade to Pro",
    href: "/pricing",
    features: [
      "100 Credits / month per unit",
      "Unlimited Profile Uploads",
      "Unlimited Job Descriptions",
      "All Premium Engines Unlocked",
      "All Response Types",
      "Stealth Session Recording",
      "Font Size & Opacity Sliders",
    ],
  },
  {
    name: "Elite",
    blurb: "Unrestricted career growth.",
    monthly: 79,
    yearly: 29,
    icon: Crown,
    accent: "from-amber-400 via-rose-500 to-teal-500",
    cta: "Unlock Elite",
    href: "/pricing",
    features: [
      "500 Credits / month per unit",
      "Unlimited Profile Uploads",
      "Unlimited Job Descriptions",
      "All Pro Features",
      "Dedicated Support",
      "AI Fine-Tuning",
      "Early Access",
    ],
  },
];

export const creatorTiers = [
  {
    label: "Starter",
    views: "1K – 10K",
    reward: "$5",
    perVideo: "per video",
    icon: Share2,
    accent: "from-slate-400 to-slate-500",
  },
  {
    label: "Creator",
    views: "10K – 100K",
    reward: "$25",
    perVideo: "per video",
    icon: Rocket,
    accent: "from-teal-500 to-teal-500",
    highlighted: true,
  },
  {
    label: "Elite Creator",
    views: "100K +",
    reward: "$100",
    perVideo: "per video",
    icon: Crown,
    accent: "from-amber-400 to-rose-500",
  },
];
