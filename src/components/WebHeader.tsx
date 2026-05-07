"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { ArrowRight, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import SyncedUserButton from "@/components/SyncedUserButton";

export default function WebHeader() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("");

  const { currentTheme, toggleTheme } = useThemeToggle();

  const isElectron = typeof window !== "undefined" && 
    (!!(window as any).electronAPI || navigator.userAgent.toLowerCase().includes('electron'));

  useEffect(() => {
    setMounted(true);
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
          console.error("WebHeader: Error fetching profile:", err);
        }
      };
      fetchProfile();
      
      // Refresh credits on custom event
      window.addEventListener('chintu-profile-refresh', fetchProfile);
      return () => window.removeEventListener('chintu-profile-refresh', fetchProfile);
    }
  }, [isSignedIn]);

  // Don't show on Electron platform
  if (!mounted || isElectron) return null;

  return (
    <nav role="navigation" aria-label="Main site navigation" className="sticky top-0 z-[100] bg-[var(--bg-app)]/70 backdrop-blur-2xl border-b border-[var(--glass-border)] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          aria-label="Chintu Ji — return to homepage"
          className="flex items-center gap-3 no-drag hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center justify-center w-8 h-8 hover:scale-110 transition-transform">
            <Image
              src="https://www.getchintu.com/icon.png"
              alt="Chintu Ji Logo"
              className="w-full h-full object-contain"
              width={32}
              height={32}
              unoptimized
              priority
            />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase text-[var(--text-main)]">
            Chintu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Ji</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 no-drag">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex items-center gap-5 lg:gap-6"
            role="menubar"
          >
            <Link
              href="/#power-tools"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group"
              role="menuitem"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/#compare"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group"
              role="menuitem"
            >
              Compare
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/pricing"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group"
              role="menuitem"
            >
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/blog"
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] hover:text-indigo-600 transition-colors relative group"
              role="menuitem"
            >
              Blog
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/faq"
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
                    onClick={() => {
                      const deepLink = `chintu://open?source=web&u=${encodeURIComponent(user?.id || "")}`;
                      window.location.href = deepLink;
                      setTimeout(() => router.push("/setup"), 500);
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
  );
}
