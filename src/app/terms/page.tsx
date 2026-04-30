import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white py-16 px-6 sm:px-12 lg:px-24 text-gray-800">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black mb-8 text-gray-900 uppercase tracking-tight">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8 uppercase tracking-widest font-bold">Last Updated: April 30, 2026</p>
        
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase tracking-wide">1. Acceptance of Terms</h2>
          <p className="leading-relaxed mb-4">
            By accessing or using Chintu Intelligence, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase tracking-wide">2. Description of Service</h2>
          <p className="leading-relaxed mb-4">
            Chintu is an AI-powered interview assistant. We provide tools for interview preparation, coding assistance, and real-time guidance using advanced language models.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase tracking-wide">3. User Conduct</h2>
          <p className="leading-relaxed mb-4">
            Users agree not to use the service for any illegal purposes or to violate any local, state, or international laws. You are responsible for maintaining the confidentiality of your account credentials.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase tracking-wide">4. Subscriptions and Credits</h2>
          <p className="leading-relaxed mb-4">
            Access to certain features requires a paid subscription. Credits are non-transferable and subject to the specific terms of the plan you choose. Payments are processed via Stripe.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 text-gray-900 uppercase tracking-wide">5. Limitation of Liability</h2>
          <p className="leading-relaxed mb-4">
            Chintu Intelligence shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services.
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
