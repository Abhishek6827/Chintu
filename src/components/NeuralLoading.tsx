"use client";
import React from 'react';
import { Meteors } from './magicui/meteors';
import { useThemeToggle } from '@/hooks/useThemeToggle';

interface NeuralLoadingProps {
  text?: string;
  subtext?: string;
}

export default function NeuralLoading({
  text = "Synthesizing Neural Intelligence",
  subtext = "Calibrating Protected Overlay"
}: NeuralLoadingProps) {
  const { plan } = useThemeToggle();
  const isPremium = plan === "pro" || plan === "elite";
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--bg-app)] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        {isPremium && <Meteors number={40} />}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-500/5 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/5 blur-[80px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative flex flex-col items-center gap-12 z-10">
        {/* The Neural Core */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Outer Rotating Rings */}
          <div className="absolute inset-0 border-[1px] border-dashed border-indigo-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-4 border-[1px] border-dashed border-purple-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
          <div className="absolute inset-8 border-[1px] border-dashed border-cyan-500/20 rounded-full animate-[spin_20s_linear_infinite]" />

          {/* Orbital Nodes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,1)]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,1)]" />

          {/* The Pulse Core */}
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 rounded-[2.5rem] shadow-[0_0_50px_rgba(99,102,241,0.5)] flex items-center justify-center relative overflow-hidden group">
            {/* Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <div className="w-10 h-10 border-2 border-white/20 rounded-full animate-ping" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_#fff]" />
            </div>
          </div>

          {/* Scanline Effect */}
          <div className="absolute inset-[-40px] bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-1 opacity-50 animate-[scan_3s_linear_infinite]" />
        </div>

        <div className="flex flex-col items-center text-center px-6">
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 tracking-tighter uppercase mb-3 animate-pulse">
            {text}
          </h2>
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[var(--text-dim)] opacity-20" />
            <p className="text-[10px] sm:text-[11px] text-[var(--text-dim)] font-black uppercase tracking-[0.4em] opacity-60">
              {subtext}
            </p>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[var(--text-dim)] opacity-20" />
          </div>
        </div>

        {/* Neural Network Visualization (Simplified) */}
        <div className="flex gap-1.5 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes scan {
          0% { transform: translateY(-100px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
