"use client";

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FileText, ArrowLeft, AlertCircle, Ban, Globe, Sparkles } from 'lucide-react';

import GlobalFooter from '@/components/GlobalFooter';

export default function TermsPage() {

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
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 selection:bg-indigo-100 flex flex-col relative overflow-x-hidden">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-100/30 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/30 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#f8f9fa]/80 backdrop-blur-2xl border-b border-gray-100 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-all text-[10px] font-black uppercase tracking-[0.3em]">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1.5" />
            Return Home
          </Link>
          <div className="flex items-center gap-2.5">
            <Image src="https://www.getchintu.com/icon.png" alt="Chintu" width={22} height={22} unoptimized />
            <span className="text-[11px] font-black tracking-tight uppercase text-gray-900">Legal Framework</span>
          </div>
          <div className="w-24 hidden sm:block" />
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 py-24 sm:py-32">
        <div className="reveal mb-24 transition-all duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-8">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Global Governance v1.4</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-gray-900 mb-8 uppercase leading-[0.9]">Terms of <br/><span className="text-indigo-600">Service Engagement.</span></h1>
          <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] leading-relaxed">Compliance Verified • Effective: April 30, 2026</p>
        </div>

        <div className="space-y-32">
          <section className="reveal transition-all duration-1000">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-white border border-gray-100 shadow-xl shadow-indigo-500/5 rounded-[1.5rem] flex items-center justify-center text-indigo-600">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">1. Acceptance of Terms</h2>
            </div>
            <div className="bg-white/50 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-gray-100 shadow-sm leading-relaxed">
              <p className="text-gray-600 text-[14px] font-medium leading-relaxed">
                By accessing the Chintu Intelligence application, you agree to be bound by these Terms of Service. If you do not agree, you must immediately cease usage of the software.
              </p>
            </div>
          </section>

          <section className="reveal transition-all duration-1000 delay-200">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-white border border-gray-100 shadow-xl shadow-indigo-500/5 rounded-[1.5rem] flex items-center justify-center text-purple-600">
                <Ban className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">2. Responsible Usage</h2>
            </div>
            <div className="bg-white/50 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-gray-100 shadow-sm leading-relaxed">
              <p className="text-gray-600 text-[14px] font-medium leading-relaxed">
                Chintu is provided as an AI-powered interview preparation and assistance tool. Users are responsible for ensuring their usage complies with their local laws, employment contracts, and academic integrity policies. Chintu Intelligence is not liable for any disciplinary actions resulting from the misuse of this tool.
              </p>
            </div>
          </section>

          <section className="reveal transition-all duration-1000 delay-400 bg-white p-10 sm:p-14 rounded-[4rem] border border-indigo-50 shadow-2xl shadow-indigo-500/5">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">3. Subscription & Refunds</h2>
            </div>
            <ul className="space-y-6">
              {[
                "Payments are processed securely via Stripe encrypted protocols.",
                "Credits are non-transferable and non-refundable once consumed by the AI engine.",
                "Subscription cancellations take effect at the end of the current billing cycle."
              ].map((text, i) => (
                <li key={i} className="flex gap-5 text-[13px] font-bold text-gray-700 uppercase tracking-tight group">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <section className="reveal transition-all duration-1000 delay-500">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-white border border-gray-100 shadow-xl shadow-indigo-500/5 rounded-[1.5rem] flex items-center justify-center text-red-600">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight">4. Intellectual Property</h2>
            </div>
            <div className="bg-white/50 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-gray-100 shadow-sm leading-relaxed">
              <p className="text-gray-600 text-[14px] font-medium leading-relaxed">
                All software, logos, and proprietary AI mapping logic are the exclusive property of Chintu.AI. Reverse engineering, redistribution, or unauthorized extraction of the application&apos;s binary is strictly prohibited.
              </p>
            </div>
          </section>
        </div>

        <div className="reveal mt-32 pt-16 border-t border-gray-100 text-center transition-all duration-1000 delay-700">
           <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mb-6">Legal Support?</p>
           <a href="mailto:contact@getchintu.com" className="bg-white border border-gray-100 px-8 py-4 rounded-2xl text-indigo-600 font-black uppercase tracking-widest text-[11px] hover:border-indigo-600 transition-all shadow-sm">Contact Legal Department</a>
        </div>
      </main>

      <GlobalFooter />

      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 1.2s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
