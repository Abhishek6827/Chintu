import React from 'react';
export const dynamic = "force-dynamic";
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white py-16 px-6 sm:px-12 lg:px-24 text-gray-800">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black mb-8 text-gray-900 uppercase tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8 uppercase tracking-widest font-bold">Last Updated: April 30, 2026</p>
        
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase tracking-wide">1. Introduction</h2>
          <p className="leading-relaxed mb-4">
            Welcome to Chintu Intelligence (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your data when you use our application.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase tracking-wide">2. Data We Collect</h2>
          <p className="leading-relaxed mb-4">
            We collect information that you provide directly to us through Clerk Authentication and your interactions with our AI service:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, and profile picture.</li>
            <li><strong>Usage Data:</strong> Information about how you use the app, including session history and AI interactions.</li>
            <li><strong>Billing Data:</strong> Transaction details processed securely via Stripe (we do not store credit card info).</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase tracking-wide">3. How We Use Your Data</h2>
          <p className="leading-relaxed mb-4">
            We use your data to provide, maintain, and improve our AI interview assistance services, process payments, and communicate with you about your account.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase tracking-wide">4. Security</h2>
          <p className="leading-relaxed mb-4">
            We implement industry-standard security measures to protect your data. Authentication is handled by Clerk, and data is stored securely in Supabase.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase tracking-wide">5. Contact Us</h2>
          <p className="leading-relaxed mb-4">
            If you have questions about this policy, please contact us at: <span className="font-bold">contact@getchintu.com</span>
          </p>
        </section>
        
        <div className="mt-16 pt-8 border-t border-gray-100 text-center">
          <Link href="/" className="text-indigo-600 font-bold hover:underline uppercase text-xs tracking-widest">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
