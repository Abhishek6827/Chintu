"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, Zap, Brain, Target, Lock, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 selection:bg-indigo-100 flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="Chintu" width={20} height={20} className="w-5 h-5" unoptimized />
            <span className="text-sm font-black tracking-tight uppercase">About Chintu</span>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
            <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">The Future of Interviewing</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-gray-900 mb-6 leading-none">
            We don&apos;t just help you prepare.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500">We help you win.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Chintu Intelligence is the world&apos;s most advanced ghost overlay assistant, built for high-stakes technical interviews.
          </p>
        </div>

        {/* Why We Are Better */}
        <section className="mb-32">
          <h2 className="text-2xl font-black uppercase tracking-widest text-gray-400 mb-12 text-center text-[11px]">Why Chintu is Superior</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50 hover:border-indigo-600 transition-all group">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-4">Unrivaled Stealth</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Unlike browser extensions or secondary apps, Chintu operates as a native ghost overlay. It is invisible to screen-sharing tools like Zoom, Teams, and Google Meet. You stay safe, always.
              </p>
            </div>
            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50 hover:border-indigo-600 transition-all group">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-4">Neural Profile Context</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                We don&apos;t give generic AI answers. Chintu ingest your resume and experience, tailoring every response to match YOUR voice and background.
              </p>
            </div>
          </div>
        </section>

        {/* Core Functionalities */}
        <section className="mb-32 bg-gray-900 rounded-[50px] p-12 sm:p-20 text-white overflow-hidden relative">
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
        <section className="mb-32">
          <h2 className="text-center text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-12">Comparison vs The Rest</h2>
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Capability</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-indigo-600 text-center">Chintu AI</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Others</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold">
                <tr className="border-t border-gray-50">
                  <td className="p-8">Screen-Share Invisible</td>
                  <td className="p-8 text-center text-emerald-500"><CheckCircle2 className="w-5 h-5 mx-auto" /></td>
                  <td className="p-8 text-center text-gray-300">❌</td>
                </tr>
                <tr className="border-t border-gray-50">
                  <td className="p-8">Resume Context Awareness</td>
                  <td className="p-8 text-center text-emerald-500"><CheckCircle2 className="w-5 h-5 mx-auto" /></td>
                  <td className="p-8 text-center text-gray-300">❌</td>
                </tr>
                <tr className="border-t border-gray-50">
                  <td className="p-8">Real-time Code OCR</td>
                  <td className="p-8 text-center text-emerald-500"><CheckCircle2 className="w-5 h-5 mx-auto" /></td>
                  <td className="p-8 text-center text-gray-300">❌</td>
                </tr>
                <tr className="border-t border-gray-50">
                  <td className="p-8">Latency</td>
                  <td className="p-8 text-center text-indigo-600">&lt; 1.5s</td>
                  <td className="p-8 text-center text-gray-400">5s+</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Closing */}
        <div className="text-center bg-gradient-to-b from-indigo-50 to-transparent p-12 sm:p-20 rounded-[50px] border border-indigo-100/50">
          <h2 className="text-3xl font-black mb-6 tracking-tight">Ready to excel?</h2>
          <Link href="/sign-up" className="inline-flex px-12 py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 transition-all hover:scale-105">
            Join the Revolution
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 grayscale opacity-50">
             <Image src="/icon.png" alt="" width={20} height={20} unoptimized />
             <span className="text-xs font-black uppercase tracking-tight">Chintu AI</span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
             <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</Link>
             <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms</Link>
             <Link href="/support" className="hover:text-indigo-600 transition-colors">Support</Link>
          </div>
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2026 CHINTU.AI</p>
        </div>
      </footer>
    </div>
  );
}
