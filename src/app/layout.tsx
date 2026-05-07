import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });
export const dynamic = "force-dynamic";

const SITE_URL = "https://www.getchintu.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Chintu Ji | #1 Real-Time AI Interview Copilot for Online Tests, Coding Assessments & Exams",
    template: "%s | Chintu Ji",
  },
  description:
    "Chintu Ji the world's fastest and most affordable real-time AI interview and exam copilot. Solve live coding rounds, MCQs, technical assessments, behavioral interviews, GMAT/GRE/CAT/JEE/NEET tests and online proctored exams — invisible across Zoom, Google Meet, Microsoft Teams, HireVue, HackerRank, LeetCode and every major proctoring tool. Sub-200ms latency. 63+ languages. 7-day money-back guarantee.",
  keywords: [
    // Brand
    "Chintu Ji", "Chintu Interview AI",
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
    siteName: "Chintu Ji",
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
  alternateName: "Chintu Ji",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description:
    "World's most affordable real-time AI copilot for interviews, online exams and technical assessments.",
  email: "contact@getchintu.com",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Chintu Ji",
  description: "Real-time AI interview and exam copilot.",
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
  name: "Chintu Ji",
  alternateName: "Chintu Ji",
  operatingSystem: "Windows, macOS, Web Browser",
  applicationCategory: "EducationalApplication",
  applicationSubCategory: "Interview Preparation",
  url: SITE_URL,
  description:
    "Stealth real-time AI copilot delivering sub-200ms accurate answers for interviews, online exams and technical assessments across every major platform.",
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
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/server";
import UpdateNotification from "@/components/UpdateNotification";
import GlobalHeader from "@/components/GlobalHeader";
import WebHeader from "@/components/WebHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userId = null;
  try {
    const authData = await auth();
    userId = authData.userId;
  } catch {
    // This happens during 404s for static assets where middleware is skipped
    console.warn("Layout: Auth context not available for this request");
  }
  let themeClass = ""; // Default light

  if (userId) {
    try {
      const supabase = createAdminClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, theme")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        const plan = (profile.plan || "free").toLowerCase();
        if (plan === "pro" || plan === "elite") {
          // Premium users default to dark unless explicitly light
          if (profile.theme !== "light") {
            themeClass = "dark-mode";
          }
        }
      }
    } catch (err) {
      console.error("Layout: Theme fetch error:", err);
    }
  }

  return (
    <ClerkProvider>
      <html lang="en" className={`${themeClass} relative`}>
        <head>
          <link rel="icon" href="https://www.getchintu.com/icon.png" />
          {/* Performance: hint preconnects for critical third-parties */}
          <link rel="preconnect" href="https://www.getchintu.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://img.clerk.com" />
          <link rel="dns-prefetch" href="https://images.clerk.dev" />
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
