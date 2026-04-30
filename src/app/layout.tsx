import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chintu",
  description: "AI-powered interview assistant — invisible to screen sharing",
};

import { ClerkProvider } from "@clerk/nextjs";
import UpdateNotification from "@/components/UpdateNotification";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/icon.png" />
        </head>
        <body className="bg-transparent">
          {children}
          <UpdateNotification />
        </body>
      </html>
    </ClerkProvider>
  );
}

