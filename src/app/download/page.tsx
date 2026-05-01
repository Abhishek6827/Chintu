"use client";

import React from 'react';
import { Download, Laptop, Shield, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import GlobalFooter from '@/components/GlobalFooter';

export default function DownloadPage() {
  const version = "1.1.3";
  const downloadUrl = "https://github.com/Abhishek6827/Chintu/releases/latest/download/Chintu-Setup-" + version + ".exe";

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 selection:bg-indigo-100 flex flex-col relative overflow-x-hidden">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/20 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-24">
        {/* Hero Section */}
        <div className="max-w-4xl w-full text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-8 animate-fade-in">
            <Zap className="w-3 h-3 text-indigo-600 fill-current" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Official Desktop Release</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-gray-900 mb-6 uppercase leading-[0.9]">
            Take Chintu <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Everywhere.</span>
          </h1>
          
          <p className="text-gray-400 text-sm sm:text-lg font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed mb-12">
            Experience the full power of Chintu with our native Windows application. Ghost Mode, Neural Sync, and Screen Intelligence — optimized for performance.
          </p>

          <div className="flex flex-col items-center gap-6">
            <a 
              href={downloadUrl}
              className="group relative px-12 py-6 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[12px] rounded-3xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4"
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              Download for Windows
              <div className="absolute -top-3 -right-3 bg-emerald-500 text-[8px] px-2 py-1 rounded-full border-2 border-white shadow-lg">v{version}</div>
            </a>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Windows 10 / 11 Supported • 64-bit</span>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-32">
          {[
            { icon: <Shield />, title: "Ghost Protocol", desc: "Invisible to screen-sharing and proctoring software." },
            { icon: <Laptop />, title: "Native Speed", desc: "Zero-lag processing with low memory footprint." },
            { icon: <Zap />, title: "Auto Updates", desc: "Always stay synchronized with the latest intelligence." }
          ].map((f, i) => (
            <div key={i} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-indigo-500/5 hover:shadow-2xl transition-all group text-center">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                {f.icon}
              </div>
              <h3 className="font-black uppercase tracking-widest text-[12px] mb-4 text-gray-900">{f.title}</h3>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Installation Steps */}
        <div className="max-w-3xl w-full bg-white rounded-[4rem] border border-gray-100 p-12 sm:p-20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -mr-10 -mt-10" />
          
          <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-12 uppercase">Installation Guide</h2>
          
          <div className="space-y-10">
            {[
              { step: "01", text: "Download the Chintu-Setup.exe file using the button above." },
              { step: "02", text: "Run the installer. If Windows SmartScreen appears, click 'More Info' then 'Run Anyway'." },
              { step: "03", text: "Login with your Chintu credentials and activate Ghost Mode to start your mission." }
            ].map((s, i) => (
              <div key={i} className="flex gap-6 items-start">
                <span className="text-2xl font-black text-indigo-200 tracking-tighter">{s.step}</span>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-600 leading-relaxed pt-1.5">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verified & Secure Build</span>
            </div>
            <a href="/support" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500 flex items-center gap-2">
              Trouble Installing? <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      <GlobalFooter />
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
