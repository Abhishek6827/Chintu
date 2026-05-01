"use client";

import Link from "next/link";
import Image from "next/image";

export default function GlobalFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-4">
            <Image src="https://www.getchintu.com/icon.png" alt="Chintu" width={24} height={24} unoptimized />
            <span className="text-sm font-black tracking-tighter uppercase">Chintu <span className="text-indigo-600">SaaS</span></span>
          </div>
          <p className="text-[11px] text-gray-400 font-bold leading-relaxed uppercase tracking-wider">
            Empowering candidates with real-time strategic intelligence. Master every interview with confidence.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-12">
          <div>
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="mailto:contact@getchintu.com" className="text-[10px] text-gray-400 hover:text-indigo-600 font-bold uppercase transition-colors">Contact Us</a></li>
              <li><Link href="/support" className="text-[10px] text-gray-400 hover:text-indigo-600 font-bold uppercase transition-colors">Help Center</Link></li>
              <li><Link href="/privacy" className="text-[10px] text-gray-400 hover:text-indigo-600 font-bold uppercase transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-[10px] text-gray-400 hover:text-indigo-600 font-bold uppercase transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-4">Ecosystem</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-[10px] text-gray-400 hover:text-indigo-600 font-bold uppercase transition-colors">Home</Link></li>
              <li><Link href="/pricing" className="text-[10px] text-gray-400 hover:text-indigo-600 font-bold uppercase transition-colors">Pricing</Link></li>
              <li><Link href="/setup" className="text-[10px] text-gray-400 hover:text-indigo-600 font-bold uppercase transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.2em]">
          © 2026 CHINTU INTELLIGENCE ECOSYSTEM • ALL RIGHTS RESERVED
        </p>
        <div className="flex gap-6">
          <span className="text-[9px] text-gray-300 font-black uppercase tracking-widest flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Systems Active
          </span>
        </div>
      </div>
    </footer>
  );
}
