import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Chintu AI | #1 Most Affordable AI for Interviews, Assessments & Online Exams — 100% Accurate",
  description: "The world's fastest and most affordable AI assistant for interviews, online exams, and technical assessments. Get 100% accurate solutions instantly with zero delay. Invisible to screen sharing and proctoring. Try it once to see the power of Chintu AI!",
  keywords: [
    "AI Interview Assistant",
    "Online Exam Helper",
    "Technical Assessment Solver",
    "Most Affordable AI Assistant",
    "Cheapest Interview AI",
    "100% Accurate Exam Solutions",
    "Fastest AI Assessment Tool",
    "Screen Share Safe AI",
    "Chintu AI",
    "Coding Test Helper",
    "GMAT GRE AI Helper",
    "Placement Test Assistant",
    "Invisible Exam AI"
  ],
  authors: [{ name: "Chintu AI Team" }],
  openGraph: {
    title: "Chintu AI | Ultimate AI for Interviews & Online Exams",
    description: "100% accurate solutions for every online test and interview. The most affordable and fastest AI on the market. Invisible to all platforms.",
    url: "https://www.getchintu.com",
    siteName: "Chintu AI",
    images: [
      {
        url: "https://www.getchintu.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Chintu AI - Most Affordable & Accurate Interview Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chintu AI | Fastest & Cheapest AI for Online Exams",
    description: "Get 100% accurate solutions for any assessment instantly. Invisible stealth mode active.",
    images: ["https://www.getchintu.com/og-image.png"],
  },
  verification: {
    google: "oIfGEpCWzg3A4gpNSe_9dTxbJeodKqcIIqyRAmgoI4M",
  },
  alternates: {
    canonical: "https://www.getchintu.com",
  },
};

import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/utils/supabase/server";
import UpdateNotification from "@/components/UpdateNotification";
import GlobalHeader from "@/components/GlobalHeader";
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
          {/* Suppress sensor-related warnings from third-party scripts (like Razorpay) */}
          <meta httpEquiv="Permissions-Policy" content="accelerometer=*, camera=*, geolocation=*, gyroscope=*, magnetometer=*, microphone=*, payment=*, usb=*" />

        </head>
        <body className={`${inter.className} bg-transparent h-screen flex flex-col relative`}>
          <GlobalHeader />
          <main id="main-content" className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          <UpdateNotification />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
