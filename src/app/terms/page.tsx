"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FileText, ArrowLeft, Scale, AlertCircle, Ban, Globe } from 'lucide-react';

import GlobalFooter from '@/components/GlobalFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 selection:bg-indigo-100 flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#f8f9fa]/90 backdrop-blur-xl border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            <Image src="https://www.getchintu.com/icon.png" alt="Chintu" width={20} height={20} unoptimized />
            <span className="text-[10px] font-black tracking-tight uppercase">Legal Framework</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-20">
        <div className="mb-16">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-gray-900 mb-6 uppercase">Terms of Service.<br/><span className="text-indigo-600">Fair usage for all.</span></h1>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Effective Date: April 30, 2026</p>
        </div>

        <div className="space-y-16">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Globe className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight">1. Acceptance of Terms</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-[13px] mb-4 font-medium">
              By accessing the Chintu Intelligence application, you agree to be bound by these Terms of Service. If you do not agree, you must immediately cease usage of the software.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <Ban className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight">2. Responsible Usage</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-[13px] mb-4 font-medium">
              Chintu is provided as an AI-powered interview preparation and assistance tool. Users are responsible for ensuring their usage complies with their local laws, employment contracts, and academic integrity policies. Chintu Intelligence is not liable for any disciplinary actions resulting from the misuse of this tool.
            </p>
          </section>

          <section className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight">3. Subscription & Refunds</h2>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-3 text-[12px] font-bold text-gray-700 uppercase tracking-tight">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                Payments are processed securely via Stripe.
              </li>
              <li className="flex gap-3 text-[12px] font-bold text-gray-700 uppercase tracking-tight">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                Credits are non-transferable and non-refundable once consumed.
              </li>
              <li className="flex gap-3 text-[12px] font-bold text-gray-700 uppercase tracking-tight">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                Subscription cancellations take effect at the end of the current billing cycle.
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight">4. Intellectual Property</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-[13px] mb-4 font-medium">
              All software, logos, and proprietary AI mapping logic are the exclusive property of Chintu.AI. Reverse engineering, redistribution, or unauthorized extraction of the application&apos;s binary is strictly prohibited.
            </p>
          </section>
        </div>

        <div className="mt-20 pt-12 border-t border-gray-100 text-center">
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Legal Inquiries?</p>
           <a href="mailto:contact@getchintu.com" className="text-indigo-600 font-black uppercase tracking-widest text-[10px] hover:underline">Contact Legal Department</a>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
