import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chintu",
  description: "AI-powered interview assistant — invisible to screen sharing",
};

import { ClerkProvider } from "@clerk/nextjs";
import UpdateNotification from "@/components/UpdateNotification";
import GlobalHeader from "@/components/GlobalHeader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="https://www.getchintu.com/icon.png" />
        </head>
        <body className="bg-transparent h-screen flex flex-col">
          <GlobalHeader />
          <main className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          <UpdateNotification />
        </body>
      </html>
    </ClerkProvider>
  );
}

