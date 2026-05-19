"use client";
import React from 'react';

export default function AIProcessing() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4 animate-fade-in">
      <div className="relative w-24 h-24">
        {/* Outer Glow */}
        <div className="absolute inset-0 bg-teal-500/20 blur-3xl animate-pulse" />
        
        {/* Orbital Rings */}
        <div className="absolute inset-0 border-2 border-dashed border-teal-400/30 rounded-full animate-[spin_8s_linear_infinite]" />
        <div className="absolute inset-2 border border-teal-400/20 rounded-full animate-[spin_12s_linear_infinite_reverse]" />
        
        {/* Inner Core */}
        <div className="absolute inset-6 bg-gradient-to-br from-teal-500 via-teal-500 to-cyan-400 rounded-full shadow-[0_0_30px_rgba(20,184,166,0.6)] animate-pulse flex items-center justify-center overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
        
        {/* Neural Pulse Waves */}
        <div className="absolute inset-0 border-2 border-teal-500/50 rounded-full animate-[ping_2s_infinite]" />
      </div>
      
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-black tracking-[0.3em] uppercase bg-gradient-to-r from-teal-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
          Synthesizing
        </h3>
        <p className="text-[0.625rem] text-[var(--text-dim)] uppercase tracking-widest mt-1 opacity-50">
          Neural Intelligence Active
        </p>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
