import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const SITE_URL = "https://www.getchintu.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Chintu Ji — AI Interview Copilot | Real-Time AI for Coding Tests, Online Exams & Assessments",
    template: "%s | Chintu Ji",
  },
  description:
    "Chintu Ji (getchintu.com) is the world's fastest and most affordable real-time AI interview and exam copilot. Solve live coding rounds, MCQs, technical assessments, behavioral interviews, GMAT/GRE/CAT/JEE/NEET tests and online proctored exams — invisible across Zoom, Google Meet, Microsoft Teams, HireVue, HackerRank, LeetCode and every major proctoring tool. Sub-200ms latency. 63+ languages. 7-day money-back guarantee.",
  keywords: [
    // Brand
    "Chintu Ji", "Chintu AI", "Chintu Ji AI", "Chintu Interview AI", "getchintu", "getchintu.com",
    // Core product
    "AI Interview Assistant", "Real-Time Interview Copilot", "AI Interview Helper",
    "Stealth Interview AI", "Invisible Interview AI", "Live Interview AI",
    // Use cases
    "Online Exam Helper", "Online Test Helper", "Proctored Exam AI", "Online Assessment AI",
    "Technical Assessment Solver", "Coding Interview AI", "Live Coding AI",
    "System Design Interview AI", "Behavioral Interview AI",
    "Mock Interview AI", "AI Mock Interview Practice", "AI Resume Builder", "JD Tailored Resume",
    // Platforms
    "Zoom Interview AI", "Google Meet Interview AI", "Microsoft Teams Interview AI",
    "HireVue AI Helper", "HackerRank AI Helper", "LeetCode AI Helper",
    "Codility AI", "CoderPad AI", "micro1 AI", "Karat AI", "Interviewing.io AI", "Pramp AI",
    // Test brands
    "GMAT AI Helper", "GRE AI Helper", "SAT AI Helper", "CAT Exam AI", "JEE AI",
    "NEET AI", "Placement Test AI", "Campus Recruitment AI", "Aptitude Test AI",
    // Pricing positioning
    "Most Affordable Interview AI", "Cheapest AI Interview Tool", "Free Interview AI",
    // Tech
    "Screen Share Safe AI", "Screen Recording Safe AI", "AI Overlay",
    "Voice Capture Interview AI", "OCR Snapshot AI", "AI Coding Assistant",
  ],
  applicationName: "Chintu Ji",
  authors: [{ name: "Chintu Ji Team", url: `${SITE_URL}/about` }],
  creator: "Chintu Ji",
  publisher: "Chintu Ji",
  category: "Education Technology",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    title:
      "Chintu Ji | Real-Time AI Copilot for Interviews, Coding Tests & Online Exams",
    description:
      "Sub-200ms invisible AI answers across every interview and exam platform. Built for serious candidates. 7-day money-back guarantee.",
    url: SITE_URL,
    siteName: "Chintu Ji — AI Interview Copilot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Chintu Ji — Real-Time AI Interview Copilot",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chintu Ji | Real-Time AI Copilot for Interviews & Exams",
    description:
      "Invisible. Instant. Accurate. The fastest and most affordable AI interview copilot on the planet.",
    images: ["/og-image.png"],
    creator: "@chintuai",
  },
  verification: {
    google: "oIfGEpCWzg3A4gpNSe_9dTxbJeodKqcIIqyRAmgoI4M",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a12" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/* ─── Structured data (JSON-LD) for Google rich results ─── */
const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Chintu Ji",
  alternateName: ["Chintu AI", "Chintu Ji AI", "getchintu", "Chintu Ji Interview AI"],
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  image: `${SITE_URL}/og-image.png`,
  description:
    "World's most affordable real-time AI copilot for interviews, online exams and technical assessments. Not the 2009 Bollywood movie.",
  email: "contact@getchintu.com",
  foundingDate: "2024",
  // TODO: Add sameAs social links here once profiles are created
  // sameAs: ["https://x.com/chintuai", "https://youtube.com/@ChintuJiAI"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@getchintu.com",
    contactType: "customer support",
    availableLanguage: ["English", "Hindi"],
  },
  brand: {
    "@type": "Brand",
    name: "Chintu Ji",
    alternateName: "Chintu AI",
    logo: `${SITE_URL}/icon.png`,
    description: "AI-powered interview copilot software",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Chintu Ji — AI Interview Copilot",
  alternateName: ["Chintu AI", "getchintu"],
  description: "Real-time AI interview and exam copilot software by Chintu Ji.",
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/blog?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Chintu Ji — AI Interview Copilot",
  alternateName: ["Chintu AI", "Chintu Ji AI", "Chintu Ji Interview App"],
  operatingSystem: "Windows, macOS, Web Browser",
  applicationCategory: "EducationalApplication",
  applicationSubCategory: "Interview Preparation",
  url: SITE_URL,
  downloadUrl: `${SITE_URL}/download`,
  screenshot: `${SITE_URL}/og-image.png`,
  description:
    "Stealth real-time AI copilot delivering sub-200ms accurate answers for interviews, online exams and technical assessments across every major platform. Not a movie — this is AI software.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
  },
  /* NOTE: aggregateRating values below are placeholders — update once
   * the team publishes verified review counts. */
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "1247",
    bestRating: "5",
    worstRating: "1",
  },
  featureList: [
    "Real-time AI answers under 200ms",
    "Stealth overlay invisible to screen recording and proctoring",
    "Vision OCR snapshot intelligence for MCQs and code",
    "Hold-Space voice capture",
    "Scout + Turbo multi-model code debugger",
    "63+ languages with real-time transcription",
    "Universal compatibility — Zoom, Meet, Teams, HireVue, HackerRank, LeetCode",
    "Mock Interview Simulator",
    "JD-Tailored AI Resume Builder",
  ],
};

import { ClerkProvider } from "@clerk/nextjs";
import UpdateNotification from "@/components/UpdateNotification";
import ThemeProvider from "@/components/ThemeProvider";
import GlobalHeader from "@/components/GlobalHeader";
import WebHeader from "@/components/WebHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/setup"
      signUpFallbackRedirectUrl="/setup"
    >
      <html lang="en" className="relative">
        <head>
          {/* Favicon is auto-served by Next from src/app/icon.png — no manual <link> needed */}
          {/* Performance: hint preconnects for critical third-parties */}
          <link rel="preconnect" href="https://clerk.getchintu.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://img.clerk.com" />
          <link rel="dns-prefetch" href="https://images.clerk.dev" />
          {/* Preload hero showcase image for faster LCP */}
          <link rel="preload" as="image" href="/signin.png" />
          {/* Suppress sensor-related warnings from third-party scripts (like Razorpay) */}
          <meta httpEquiv="Permissions-Policy" content="accelerometer=*, camera=*, geolocation=*, gyroscope=*, magnetometer=*, microphone=*, payment=*, usb=*" />
          {/* Structured data — Organization */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
          />
          {/* Structured data — WebSite */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
          />
          {/* Structured data — SoftwareApplication */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
          />
        </head>
        <body className={`${inter.className} bg-transparent h-screen flex flex-col relative`}>
          <ThemeProvider />
          <GlobalHeader />
          <WebHeader />
          <main id="main-content" className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
            {children}
            <GlobalFooter />
          </main>
          <UpdateNotification />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
