"use client";

import React from "react";
import { X, Mic, Image as ImageIcon, Zap, Target, MousePointer2, ShieldCheck, Sparkles, Monitor } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  if (!isOpen) return null;

  const steps = [
    {
      title: "Step 1: Intelligence Setup",
      desc: "Go to your Profile and feed Chintu your Resume and the Job Description. This allows our engines to tailor every answer specifically to your background and the target role.",
      icon: <Target className="w-5 h-5 text-indigo-400" />,
    },
    {
      title: "Step 2: Audio Synthesis",
      desc: "During your interview, press and hold the 'SPACE' key to let Chintu listen. Release it when the interviewer finishes speaking. Chintu will immediately start synthesizing the perfect response.",
      icon: <Mic className="w-5 h-5 text-emerald-400" />,
    },
    {
      title: "Step 3: Visual Intelligence",
      desc: "Facing a coding challenge or a complex diagram? Click the Screenshot icon or use the shortcut. Chintu's Vision layer analyzes the screen and provides the logic and code instantly.",
      icon: <ImageIcon className="w-5 h-5 text-amber-400" />,
    },
    {
      title: "Step 4: Select Your Engine",
      desc: "Switch between Intelligence Engines based on the round. Use 'Coding Specialist' for technical rounds and 'Pro Engine' for behavioral or complex strategic questions.",
      icon: <Zap className="w-5 h-5 text-purple-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
      <div className="relative w-full max-w-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-[var(--glass-border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight leading-none uppercase">Mission Briefing</h2>
              <p className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-widest mt-1.5">Master the interview assistant</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-[var(--input-bg)] text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)] transition-all"
          >
            <X className="w-5 h-5 mx-auto" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          <section className="mb-12">
            <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" /> The Concept
            </h3>
            <p className="text-[var(--text-dim)] text-sm leading-relaxed font-medium">
              Chintu is your silent strategic partner during high-stakes interviews. It lives discreetly on your screen, listens to the conversation, and provides real-time tactical guidance, perfect answers, and complex code solutions without the interviewer ever knowing.
            </p>
          </section>

          <section className="mb-12">
            <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-emerald-400" /> Operation Guide
            </h3>
            <div className="grid gap-6">
              {steps.map((step, i) => (
                <div key={i} className="group flex gap-5 p-5 rounded-3xl bg-[var(--input-bg)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg)] transition-all">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-[var(--panel-bg)] border border-[var(--glass-border)] flex items-center justify-center shadow-inner">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-main)] mb-1.5">{step.title}</h4>
                    <p className="text-xs text-[var(--text-dim)] leading-relaxed font-medium group-hover:text-[var(--text-main)] transition-colors opacity-80">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-600/20">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h4 className="text-sm font-black text-indigo-500 uppercase tracking-widest">Privacy & Stealth</h4>
            </div>
            <p className="text-[11px] text-indigo-600 font-medium italic leading-relaxed">
              Chintu is designed for absolute stealth. Use the <strong>Minimize</strong> button to keep it out of sight, and the <strong>Opacity</strong> slider to blend it into your background. It does not record or save your audio beyond the current session.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-[var(--glass-border)] bg-[var(--input-bg)] shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all"
          >
            I&apos;m Ready to Win
          </button>
        </div>
      </div>
    </div>
  );
}
