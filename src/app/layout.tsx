import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chintu",
  description: "AI-powered interview assistant — invisible to screen sharing",
  verification: {
    google: "oIfGEpCWzg3A4gpNSe_9dTxbJeodKqcIIqyRAmgoI4M",
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
  const { userId } = await auth();
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
      <html lang="en" className={themeClass}>
        <head>
          <link rel="icon" href="https://www.getchintu.com/icon.png" />
        </head>
        <body className="bg-transparent h-screen flex flex-col">
          <GlobalHeader />
          <main className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          <UpdateNotification />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
