"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, EyeOff, Server, FileCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 selection:bg-indigo-100 flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-black tracking-tight uppercase">Privacy Architecture</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-20">
        <div className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-gray-900 mb-6">Privacy is not a feature.<br/><span className="text-indigo-600">It&apos;s our foundation.</span></h1>
          <p className="text-gray-500 font-medium">Last Updated: April 30, 2026 • Version 2.0</p>
        </div>

        <div className="space-y-16">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Zero-Log Visual Processing</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm mb-4 font-medium">
              Our proprietary screen capture engine operates entirely on a &quot;stream-and-forget&quot; basis. We do not store, upload, or analyze your desktop content outside the immediate context of your interview question. Once the response is generated, the visual buffer is permanently wiped from RAM.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <EyeOff className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Invisible Overlay Encryption</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm mb-4 font-medium">
              Chintu uses low-level hardware abstraction to ensure that its overlay is not detectable by third-party screen recording or monitoring software. Your privacy from your employer or interviewer is maintained through sophisticated stealth mechanisms.
            </p>
          </section>

          <section className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Server className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Data Sovereignty</h2>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm font-bold text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                Your profile data is stored on encrypted Supabase clusters.
              </li>
              <li className="flex gap-3 text-sm font-bold text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                Session recordings are stored locally on your device by default.
              </li>
              <li className="flex gap-3 text-sm font-bold text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                We never sell your data to third-party advertisers or AI trainers.
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <FileCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">Compliance</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm mb-4 font-medium">
              Chintu is fully GDPR and CCPA compliant. You have the right to export or delete your entire profile and history at any time through the Dashboard settings.
            </p>
          </section>
        </div>

        <div className="mt-20 pt-12 border-t border-gray-100 text-center">
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Questions about your data?</p>
           <a href="mailto:privacy@getchintu.com" className="text-indigo-600 font-black uppercase tracking-widest text-[10px] hover:underline">Contact Data Protection Officer</a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 grayscale opacity-50">
             <Image src="/icon.png" alt="" width={20} height={20} />
             <span className="text-xs font-black uppercase tracking-tight">Chintu AI</span>
          </div>
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">© 2026 CHINTU.AI • ALL RIGHTS RESERVED</p>
        </div>
      </footer>
    </div>
  );
}
