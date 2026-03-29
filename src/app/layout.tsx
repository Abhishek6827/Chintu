import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Copilot",
  description: "AI-powered interview assistant — invisible to screen sharing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-transparent">
        {children}
      </body>
    </html>
  );
}
