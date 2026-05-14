"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Shield, Zap, Brain, Target, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Meteors } from '@/components/magicui/meteors';
import { useThemeToggle } from '@/hooks/useThemeToggle';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } }),
};

export default function AboutPage() {
  const { plan } = useThemeToggle();
  const isPremium = plan === "pro" || plan === "elite";

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
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {isPremium && <Meteors number={15} />}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/20 blur-[120px] rounded-full animate-pulse [animation-delay:700ms]" />
      </div>


      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-20">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-24"
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
            <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">The Future of Interviewing</span>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-6xl font-black tracking-tighter text-[var(--text-main)] mb-6 leading-none uppercase">
            We don&apos;t just help you prepare.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">We help you win.</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-lg text-[var(--text-dim)] max-w-2xl mx-auto leading-relaxed">
            Chintu Ji is the world&apos;s most advanced protected overlay assistant, built for high-stakes technical interviews.
          </motion.p>
        </motion.div>

        {/* Why We Are Better */}
        <section className="reveal mb-32 transition-all duration-1000">
          <h2 className="text-2xl font-black uppercase tracking-widest text-[var(--text-dim)] mb-12 text-center text-[11px]">Why Chintu is Superior</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-[var(--panel-bg)] p-10 rounded-[40px] border border-[var(--glass-border)] shadow-xl shadow-indigo-500/5 hover:border-indigo-500/50 transition-all group"
            >
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-4 text-[var(--text-main)]">Unrivaled Stealth</h3>
              <p className="text-[var(--text-dim)] text-sm leading-relaxed">
                Unlike browser extensions or secondary apps, Chintu operates as a native protected overlay. It is invisible to screen-sharing tools like Zoom, Teams, and Google Meet. You stay safe, always.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-[var(--panel-bg)] p-10 rounded-[40px] border border-[var(--glass-border)] shadow-xl shadow-purple-500/5 hover:border-purple-500/50 transition-all group"
            >
              <div className="w-14 h-14 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <Brain className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-4 text-[var(--text-main)]">Neural Profile Context</h3>
              <p className="text-[var(--text-dim)] text-sm leading-relaxed">
                We don&apos;t give generic AI answers. Chintu ingest your resume and experience, tailoring every response to match YOUR voice and background.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Core Functionalities */}
        <section className="reveal mb-32 bg-gray-900 rounded-[50px] p-12 sm:p-20 text-white overflow-hidden relative transition-all duration-1000">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 blur-[120px] rounded-full" />

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-16 relative z-10">Advanced Functionality</h2>

          <div className="space-y-12 relative z-10">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-lg font-black mb-2 uppercase tracking-wide">Real-time Screen Intelligence</h4>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                  Proprietary low-latency visual engine that &quot;sees&quot; what you see. It parses coding problems, diagrams, and UI elements instantly without leaving a trace.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h4 className="text-lg font-black mb-2 uppercase tracking-wide">Precision Logic Engines</h4>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                  Choose between Standard, Pro, and Specialist engines (like Qwen-Coder) to get the most accurate logic for algorithms or architectural discussions.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-lg font-black mb-2 uppercase tracking-wide">Encrypted Session Recording</h4>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                  Stealthily record your interview sessions for later review. Analyze where you excelled and where you can improve, with all data stored locally and encrypted.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="reveal mb-32 transition-all duration-1000">
          <h2 className="text-center text-[11px] font-black uppercase tracking-[0.3em] text-[var(--text-dim)] mb-12">Comparison vs The Rest</h2>
          <div className="bg-[var(--panel-bg)] rounded-[40px] border border-[var(--glass-border)] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--glass-bg)]">
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Capability</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-indigo-500 text-center">Chintu Ji</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] text-center">Others</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-[var(--text-main)]">
                <tr className="border-t border-[var(--glass-border)]">
                  <td className="p-8">Screen-Share Invisible</td>
                  <td className="p-8 text-center text-emerald-500"><CheckCircle2 className="w-5 h-5 mx-auto" /></td>
                  <td className="p-8 text-center text-[var(--text-dim)]">❌</td>
                </tr>
                <tr className="border-t border-[var(--glass-border)]">
                  <td className="p-8">Resume Context Awareness</td>
                  <td className="p-8 text-center text-emerald-500"><CheckCircle2 className="w-5 h-5 mx-auto" /></td>
                  <td className="p-8 text-center text-[var(--text-dim)]">❌</td>
                </tr>
                <tr className="border-t border-[var(--glass-border)]">
                  <td className="p-8">Real-time Code OCR</td>
                  <td className="p-8 text-center text-emerald-500"><CheckCircle2 className="w-5 h-5 mx-auto" /></td>
                  <td className="p-8 text-center text-[var(--text-dim)]">❌</td>
                </tr>
                <tr className="border-t border-[var(--glass-border)]">
                  <td className="p-8">Latency</td>
                  <td className="p-8 text-center text-indigo-500">&lt; 1.5s</td>
                  <td className="p-8 text-center text-[var(--text-dim)]">5s+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Closing */}
        <div className="reveal text-center bg-gradient-to-b from-indigo-500/10 to-transparent p-12 sm:p-20 rounded-[50px] border border-indigo-500/20 transition-all duration-1000">
          <h2 className="text-3xl font-black mb-6 tracking-tight text-[var(--text-main)] uppercase">Ready to excel?</h2>
          <Link href="/sign-up" className="inline-flex px-12 py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 transition-all hover:scale-105">
            Join the Revolution
          </Link>
        </div>
      </main>

    </div>
  );
}
