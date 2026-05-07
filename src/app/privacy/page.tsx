"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Lock, EyeOff, Server, FileCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Meteors } from '@/components/magicui/meteors';

export default function PrivacyPage() {
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('reveal-visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] selection:bg-indigo-500/20 flex flex-col relative overflow-x-hidden">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Meteors number={12} />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/20 blur-[120px] rounded-full animate-pulse [animation-delay:700ms]" />
      </div>


      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-24 sm:py-32">
        <motion.div
          className="mb-24"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Security Standards v2.0</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-[var(--text-main)] mb-8 uppercase leading-[0.9]">Privacy is our <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Core Protocol.</span></h1>
          <p className="text-[11px] text-[var(--text-dim)] font-black uppercase tracking-[0.2em] leading-relaxed">System Integrity Verified • Updated: April 30, 2026</p>
        </motion.div>

        <div className="space-y-32">
          <section className="reveal transition-all duration-1000">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-xl shadow-indigo-500/5 rounded-[1.5rem] flex items-center justify-center text-indigo-500">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">Zero-Log Visual Pipeline</h2>
            </div>
            <div className="bg-[var(--panel-bg)]/50 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-[var(--glass-border)] shadow-sm leading-relaxed">
              <p className="text-[var(--text-dim)] text-[14px] font-medium leading-relaxed">
                Our proprietary screen capture engine operates entirely on a &quot;stream-and-forget&quot; basis. We do not store, upload, or analyze your desktop content outside the immediate context of your interview question. Once the response is generated, the visual buffer is permanently wiped from RAM.
              </p>
            </div>
          </section>

          <section className="reveal transition-all duration-1000 delay-200">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-xl shadow-purple-500/5 rounded-[1.5rem] flex items-center justify-center text-purple-500">
                <EyeOff className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">Stealth Encryption</h2>
            </div>
            <div className="bg-[var(--panel-bg)]/50 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-[var(--glass-border)] shadow-sm leading-relaxed">
              <p className="text-[var(--text-dim)] text-[14px] font-medium leading-relaxed">
                Chintu uses low-level hardware abstraction to ensure that its overlay is not detectable by third-party screen recording or monitoring software. Your privacy from your employer or interviewer is maintained through sophisticated stealth mechanisms.
              </p>
            </div>
          </section>

          <section className="reveal transition-all duration-1000 delay-400 bg-[var(--panel-bg)] p-10 sm:p-14 rounded-[4rem] border border-[var(--glass-border)] shadow-2xl shadow-indigo-500/5">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-emerald-500">
                <Server className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Data Sovereignty</h2>
            </div>
            <ul className="space-y-6">
              {[
                "Your profile data is stored on encrypted Supabase clusters with RLS protection.",
                "Session recordings are stored locally on your device hardware by default.",
                "We strictly never sell your data to third-party advertisers or AI trainers."
              ].map((text, i) => (
                <li key={i} className="flex gap-5 text-[13px] font-bold text-[var(--text-main)] uppercase tracking-tight group">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse" />
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <section className="reveal transition-all duration-1000 delay-500">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-xl shadow-amber-500/5 rounded-[1.5rem] flex items-center justify-center text-amber-500">
                <FileCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">Global Compliance</h2>
            </div>
            <div className="bg-[var(--panel-bg)]/50 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-[var(--glass-border)] shadow-sm leading-relaxed">
              <p className="text-[var(--text-dim)] text-[14px] font-medium leading-relaxed">
                Chintu is fully GDPR and CCPA compliant. You have the right to export or delete your entire profile and history at any time through the Dashboard settings.
              </p>
            </div>
          </section>
        </div>

        <div className="reveal mt-32 pt-16 border-t border-[var(--glass-border)] text-center transition-all duration-1000 delay-700">
           <p className="text-[10px] text-[var(--text-dim)] font-black uppercase tracking-[0.4em] mb-6">Security Inquiries?</p>
           <a href="mailto:contact@getchintu.com" className="inline-block bg-[var(--panel-bg)] border border-[var(--glass-border)] px-8 py-4 rounded-2xl text-indigo-500 font-black uppercase tracking-widest text-[11px] hover:border-indigo-500/50 transition-all shadow-sm">
             Contact Data Protection Officer
           </a>
        </div>
      </main>


    </div>
  );
}
