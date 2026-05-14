"use client";

import React, { useEffect } from 'react';
import { FileText, AlertCircle, Ban, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Meteors } from '@/components/magicui/meteors';
import { useThemeToggle } from '@/hooks/useThemeToggle';

export default function TermsPage() {
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

      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {isPremium && <Meteors number={12} />}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse [animation-delay:700ms]" />
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
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Global Governance v1.4</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-[var(--text-main)] mb-8 uppercase leading-[0.9]">Terms of <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Service Engagement.</span></h1>
          <p className="text-[11px] text-[var(--text-dim)] font-black uppercase tracking-[0.2em] leading-relaxed">Compliance Verified • Effective: April 30, 2026</p>
        </motion.div>

        <div className="space-y-32">
          <section className="reveal transition-all duration-1000">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-xl shadow-indigo-500/5 rounded-[1.5rem] flex items-center justify-center text-indigo-500">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">1. Acceptance of Terms</h2>
            </div>
            <div className="bg-[var(--panel-bg)]/50 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-[var(--glass-border)] shadow-sm leading-relaxed">
              <p className="text-[var(--text-dim)] text-[14px] font-medium leading-relaxed">
                By accessing the Chintu Ji application, you agree to be bound by these Terms of Service. If you do not agree, you must immediately cease usage of the software.
              </p>
            </div>
          </section>

          <section className="reveal transition-all duration-1000 delay-200">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-xl shadow-purple-500/5 rounded-[1.5rem] flex items-center justify-center text-purple-500">
                <Ban className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">2. Responsible Usage</h2>
            </div>
            <div className="bg-[var(--panel-bg)]/50 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-[var(--glass-border)] shadow-sm leading-relaxed">
              <p className="text-[var(--text-dim)] text-[14px] font-medium leading-relaxed">
                Chintu is provided as an AI-powered interview preparation and assistance tool. Users are responsible for ensuring their usage complies with their local laws, employment contracts, and academic integrity policies. Chintu Ji is not liable for any disciplinary actions resulting from the misuse of this tool.
              </p>
            </div>
          </section>

          <section className="reveal transition-all duration-1000 delay-400 bg-[var(--panel-bg)] p-10 sm:p-14 rounded-[4rem] border border-[var(--glass-border)] shadow-2xl shadow-indigo-500/5">
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center text-amber-500">
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
                <li key={i} className="flex gap-5 text-[13px] font-bold text-[var(--text-main)] uppercase tracking-tight group">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <section className="reveal transition-all duration-1000 delay-500">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 bg-[var(--panel-bg)] border border-[var(--glass-border)] shadow-xl shadow-red-500/5 rounded-[1.5rem] flex items-center justify-center text-red-500">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--text-main)]">4. Intellectual Property</h2>
            </div>
            <div className="bg-[var(--panel-bg)]/50 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-[var(--glass-border)] shadow-sm leading-relaxed">
              <p className="text-[var(--text-dim)] text-[14px] font-medium leading-relaxed">
                All software, logos, and proprietary AI mapping logic are the exclusive property of Chintu.AI. Reverse engineering, redistribution, or unauthorized extraction of the application&apos;s binary is strictly prohibited.
              </p>
            </div>
          </section>
        </div>

        <div className="reveal mt-32 pt-16 border-t border-[var(--glass-border)] text-center transition-all duration-1000 delay-700">
          <p className="text-[10px] text-[var(--text-dim)] font-black uppercase tracking-[0.4em] mb-6">Legal Support?</p>
          <a href="mailto:contact@getchintu.com" className="inline-block bg-[var(--panel-bg)] border border-[var(--glass-border)] px-8 py-4 rounded-2xl text-indigo-500 font-black uppercase tracking-widest text-[11px] hover:border-indigo-500/50 transition-all shadow-sm">
            Contact Legal Department
          </a>
        </div>
      </main>


    </div>
  );
}
