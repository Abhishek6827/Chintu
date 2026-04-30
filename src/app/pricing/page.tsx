"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, Sparkles, Minus, Shield } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Starter",
    description: "Explore Chintu's capabilities",
    monthlyPrice: 0,
    annualPrice: 0,
    period: "forever",
    credits: 10,
    badge: "🌱",
    color: "emerald",
    features: [
      "10 Credits (one-time)",
      "Standard Engine only",
      "Basic Response Types",
      "Standard History",
      "Community Support",
    ],
    locked: [
      "Premium AI Engines",
      "Coding & Detailed Modes",
      "Stealth Session Recording",
      "Custom Themes & UI",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "pro",
    name: "Professional",
    description: "Best for active interviewees",
    monthlyPrice: 9,
    annualPrice: 89,
    period: "/month",
    credits: 200,
    badge: "⚡",
    color: "indigo",
    popular: true,
    stripePriceId: "price_1TRu3pLYcsTnVrvkVfZIjTLC",
    annualStripePriceId: "price_1TRu4ILYcsTnVrvkcfBbwSBr",
    features: [
      "200 Credits / month",
      "All Premium Engines Unlocked",
      "All Response Types",
      "Stealth Session Recording",
      "UI Customization",
      "Priority Speed",
    ],
    cta: "Upgrade to Pro",
  },
  {
    id: "elite",
    name: "Elite",
    description: "Unrestricted career growth",
    monthlyPrice: 29,
    annualPrice: 279,
    period: "/month",
    credits: 1000,
    badge: "👑",
    color: "amber",
    stripePriceId: "price_1TRu4jLYcsTnVrvkJ7gkHA91",
    annualStripePriceId: "price_1TRu5ALYcsTnVrvk3dMorbBe",
    features: [
      "1000 Credits / month",
      "All Pro Features",
      "Stealth Session Recording",
      "Dedicated Support",
      "AI Fine-Tuning",
      "Early Access",
      "Unlimited History",
    ],
    cta: "Go Elite",
  },
];

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: any) => {
    if (!user) return;
    const priceId = billingCycle === "monthly" ? plan.stripePriceId : plan.annualStripePriceId;
    if (!priceId || priceId.includes("STRIPE")) {
      alert("Please configure real Stripe Price IDs.");
      return;
    }

    setLoading(plan.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create checkout session.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setLoading(null);
    }
  };

  const handleMinimize = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI?.minimize) {
      (window as any).electronAPI.minimize();
    }
  };

  if (!isLoaded) return <div className="h-screen bg-[#f8f9fa] flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-screen bg-[#f8f9fa] text-gray-900 overflow-hidden flex flex-col">
      {/* Draggable Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 sticky top-0 bg-[#f8f9fa]/90 backdrop-blur-md z-50 border-b border-gray-100 shrink-0 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
           <Link href="/" className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all text-[10px] font-black uppercase tracking-widest">
            <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </Link>
        </div>
        
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <Image src="/icon.png" alt="" width={20} height={20} className="w-5 h-5" />
          <span className="text-base font-black tracking-tighter">Chintu <span className="text-indigo-600">SaaS</span></span>
        </div>

        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={handleMinimize}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-all active:scale-90"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 pb-20 overflow-y-auto overflow-x-hidden selection:bg-indigo-100" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Title & Billing Toggle */}
        <div className="text-center px-4 pt-10 pb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 border border-indigo-100">
            <Sparkles className="w-3 h-3 animate-pulse" /> Launch Offer
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-4 text-gray-900 leading-none">Elevate Your Career.</h1>
          <p className="text-gray-400 text-sm sm:text-lg font-medium max-w-sm mx-auto mb-10 leading-snug">
            Choose a plan that fits your ambition. Unlock advanced AI.
          </p>

          {/* Toggle Switch */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${billingCycle === "monthly" ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
              className="w-12 h-6 bg-gray-200 rounded-full relative p-1 transition-colors"
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 transform ${billingCycle === "annual" ? "translate-x-6 bg-indigo-600" : "translate-x-0"}`} />
            </button>
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${billingCycle === "annual" ? "text-gray-900" : "text-gray-400"}`}>
              Annual <span className="text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded ml-1 border border-emerald-100">SAVE 20%</span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="px-4 sm:px-8 max-w-6xl mx-auto flex flex-col gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`group relative flex flex-col bg-white rounded-[2.5rem] border-2 transition-all duration-300 ${
                plan.popular 
                  ? "border-indigo-600 shadow-2xl shadow-indigo-500/10" 
                  : "border-gray-100 shadow-lg shadow-gray-200/50"
              } p-6 sm:p-10`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full">
                    Most Preferred
                  </span>
                </div>
              )}

              <div className="mb-6 flex items-start justify-between">
                <div>
                  <span className="text-4xl mb-2 block">{plan.badge}</span>
                  <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
                  <p className="text-gray-400 text-[10px] font-bold">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-0.5">
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">
                      ${billingCycle === "monthly" ? plan.monthlyPrice : Math.floor(plan.annualPrice / 12)}
                    </span>
                    <span className="text-gray-400 text-[10px] font-black uppercase">{plan.period}</span>
                  </div>
                  {billingCycle === "annual" && plan.annualPrice > 0 && (
                    <p className="text-emerald-500 text-[8px] font-black uppercase">Billed annually (${plan.annualPrice})</p>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-gray-700">
                    <Check className={`w-3.5 h-3.5 mt-0.5 ${plan.color === 'emerald' ? 'text-emerald-500' : plan.color === 'indigo' ? 'text-indigo-500' : 'text-amber-500'}`} />
                    {feature}
                  </li>
                ))}
                {plan.locked && plan.locked.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs font-bold text-gray-300">
                    <Shield className="w-3.5 h-3.5 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={plan.disabled || loading === plan.id}
                className={`w-full py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                  plan.disabled
                    ? "bg-gray-100 text-gray-400 border border-gray-200"
                    : plan.popular
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30"
                      : "bg-gray-900 text-white"
                }`}
              >
                {loading === plan.id ? "..." : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Support Footer */}
        <div className="mt-16 px-4 text-center">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 max-w-lg mx-auto shadow-sm">
            <h3 className="text-xl font-black mb-1">Need help?</h3>
            <p className="text-gray-400 text-xs font-medium mb-6 leading-relaxed">Our team is here to guide you.</p>
            <button 
              onClick={() => router.push("/support")}
              className="w-full py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
