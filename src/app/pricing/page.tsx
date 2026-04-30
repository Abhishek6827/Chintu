"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    credits: 10,
    badge: "🌱",
    color: "emerald",
    features: [
      "10 Credits (one-time)",
      "Voice & Text Responses",
      "Screenshot Analysis (2 credits each)",
      "5 Session History",
      "Basic AI Models",
      "Community Support",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    period: "/month",
    credits: 200,
    badge: "⚡",
    color: "indigo",
    popular: true,
    features: [
      "200 Credits / month",
      "All AI Models Unlocked",
      "Unlimited Screenshot Analysis",
      "50 Session History",
      "Priority Response Speed",
      "Profile Customization",
      "Email Support",
    ],
    cta: "Upgrade to Pro",
    stripePriceId: "STRIPE_PRO_PRICE_ID",
  },
  {
    id: "elite",
    name: "Elite",
    price: "$29",
    period: "/month",
    credits: 1000,
    badge: "👑",
    color: "amber",
    features: [
      "1000 Credits / month",
      "All Pro Features",
      "Unlimited Session History",
      "Custom AI Fine-Tuning",
      "Advanced Analytics",
      "Priority Queue",
      "Dedicated Support Channel",
      "Early Access to New Features",
    ],
    cta: "Go Elite",
    stripePriceId: "STRIPE_ELITE_PRICE_ID",
  },
];

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, stripePriceId?: string) => {
    if (!user || !stripePriceId) return;
    setLoading(planId);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: stripePriceId }),
      });

      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      } else {
        alert("Failed to create checkout session. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#f8f9fa]" />;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 overflow-y-auto" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 transition-all text-sm font-bold">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="" className="w-5 h-5" />
          <span className="text-sm font-black tracking-tight">Chintu</span>
        </div>
        <div className="w-12" />
      </div>

      {/* Title */}
      <div className="text-center px-6 pt-4 pb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2">Choose Your Plan</h1>
        <p className="text-gray-400 text-sm font-medium max-w-md mx-auto">
          Unlock the full power of AI-assisted interviews. Upgrade anytime.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl border ${
                plan.popular 
                  ? "border-indigo-200 shadow-2xl shadow-indigo-500/10 scale-[1.02]" 
                  : "border-gray-200 shadow-lg"
              } p-6 flex flex-col transition-all hover:shadow-xl`}
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <span className="text-3xl mb-2 block">{plan.badge}</span>
                <h2 className="text-xl font-black uppercase tracking-tight mb-1">{plan.name}</h2>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-gray-400 text-sm font-bold">{plan.period}</span>
                </div>
                <p className={`text-xs font-bold mt-2 px-3 py-1 rounded-full inline-block ${
                  plan.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                  plan.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                  "bg-amber-50 text-amber-600"
                }`}>
                  {plan.credits} Credits{plan.id !== "free" ? " / month" : ""}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 text-xs ${
                      plan.color === "emerald" ? "text-emerald-500" :
                      plan.color === "indigo" ? "text-indigo-500" :
                      "text-amber-500"
                    }`}>✓</span>
                    <span className="text-gray-600 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(plan.id, plan.stripePriceId)}
                disabled={plan.disabled || loading === plan.id}
                className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  plan.disabled
                    ? "bg-gray-100 text-gray-400 cursor-default border border-gray-200"
                    : plan.popular
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95"
                      : "bg-gray-900 text-white hover:bg-gray-800 active:scale-95"
                }`}
              >
                {loading === plan.id ? "Processing..." : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Credit Info */}
        <div className="mt-12 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">💡 How Credits Work</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <span className="text-2xl">🎤</span>
              <div>
                <p className="text-xs font-black text-gray-900">Voice Response</p>
                <p className="text-[10px] text-gray-400 font-bold">1 Credit per response</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <span className="text-2xl">⌨️</span>
              <div>
                <p className="text-xs font-black text-gray-900">Text Response</p>
                <p className="text-[10px] text-gray-400 font-bold">1 Credit per response</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <span className="text-2xl">📸</span>
              <div>
                <p className="text-xs font-black text-gray-900">Screenshot Analysis</p>
                <p className="text-[10px] text-gray-400 font-bold">2 Credits per analysis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 font-medium">Need a custom plan or have questions?</p>
          <button 
            onClick={() => router.push("/support")}
            className="text-indigo-600 text-xs font-bold hover:underline mt-1"
          >
            Contact Support →
          </button>
        </div>
      </div>
    </div>
  );
}
