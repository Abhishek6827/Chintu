"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function GlobalFooter() {
  return (
    <footer className="bg-[var(--bg-app)] border-t border-[var(--glass-border)] py-20 px-6 sm:px-12 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-16">
        <motion.div
          className="max-w-xs"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Image src="https://www.getchintu.com/icon.png" alt="Chintu" width={28} height={28} unoptimized />
            <span className="text-xl font-black tracking-tighter uppercase text-[var(--text-main)]">Chintu <span className="text-indigo-500">Intelligence</span></span>
          </div>
          <p className="text-[11px] text-[var(--text-dim)] font-bold leading-relaxed uppercase tracking-wider">
            Empowering the next generation of engineers with real-time strategic intelligence. Master every technical challenge with absolute confidence.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 sm:gap-24">
          <div>
            <h4 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.4em] mb-6">Strategic</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-[10px] text-[var(--text-dim)] hover:text-indigo-500 font-black uppercase tracking-widest transition-all">Home Base</Link></li>
              <li><Link href="/pricing" className="text-[10px] text-[var(--text-dim)] hover:text-indigo-500 font-black uppercase tracking-widest transition-all">Intelligence Plans</Link></li>
              <li><Link href="/setup" className="text-[10px] text-[var(--text-dim)] hover:text-indigo-500 font-black uppercase tracking-widest transition-all">Deployment</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.4em] mb-6">Protocol</h4>
            <ul className="space-y-4">
              <li><Link href="/privacy" className="text-[10px] text-[var(--text-dim)] hover:text-indigo-500 font-black uppercase tracking-widest transition-all">Privacy Code</Link></li>
              <li><Link href="/terms" className="text-[10px] text-[var(--text-dim)] hover:text-indigo-500 font-black uppercase tracking-widest transition-all">Terms of Engagement</Link></li>
              <li><Link href="/support" className="text-[10px] text-[var(--text-dim)] hover:text-indigo-500 font-black uppercase tracking-widest transition-all">Help Command</Link></li>
            </ul>
          </div>
          <div className="hidden sm:block">
            <h4 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.4em] mb-6">Contact</h4>
            <ul className="space-y-4">
              <li><a href="mailto:contact@getchintu.com" className="text-[10px] text-[var(--text-dim)] hover:text-indigo-500 font-black uppercase tracking-widest transition-all">Global Support</a></li>
              <li><span className="text-[10px] text-[var(--text-dim)] font-black uppercase tracking-widest">Active 24/7</span></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-[var(--glass-border)] flex flex-col sm:flex-row justify-between items-center gap-6">
        <p className="text-[9px] text-[var(--text-dim)] font-black uppercase tracking-[0.3em]">
          © 2026 CHINTU INTELLIGENCE ECOSYSTEM • SECURE OPERATING ENVIRONMENT
        </p>
        <div className="flex gap-8">
          <span className="text-[9px] text-[var(--text-dim)] font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Global Status: Optimal
          </span>
        </div>
      </div>
    </footer>
  );
}
