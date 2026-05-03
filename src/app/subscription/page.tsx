"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface SubscriptionData {
  plan: string;
  credits: number;
  subscription_expires_at: string | null;
  payment_provider: string | null;
  razorpay_payment_id: string | null;
  full_name: string | null;
  email: string | null;
  updated_at: string | null;
}

export default function SubscriptionPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const isElectron = typeof window !== "undefined" && (!!(window as any).electronAPI || navigator.userAgent.toLowerCase().includes("electron"));

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { profile } = await res.json();
          if (profile) {
            // If Stripe user, redirect to Stripe portal instead
            if ((profile.payment_provider || "").toLowerCase() === "stripe" && profile.stripe_customer_id) {
              const portalRes = await fetch("/api/manage-subscription");
              const portalData = await portalRes.json();
              if (portalData.url) {
                if (isElectron) (window as any).electronAPI.openExternal(portalData.url);
                else window.location.href = portalData.url;
                return;
              }
            }
            setData(profile);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isLoaded, isSignedIn, router, isElectron]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return 0;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case "elite": return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-amber-500/10" };
      case "pro": return { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", glow: "shadow-indigo-500/10" };
      default: return { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", glow: "shadow-gray-500/10" };
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white/50 text-sm">
        No subscription data found.
      </div>
    );
  }

  const plan = (data.plan || "free").toLowerCase();
  const planStyle = getPlanColor(plan);
  const daysLeft = getDaysRemaining(data.subscription_expires_at);
  const isExpired = daysLeft === 0 && data.subscription_expires_at;
  const expiryPercent = data.subscription_expires_at
    ? Math.min(100, Math.max(0, (daysLeft / 365) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" style={{ WebkitAppRegion: "drag" } as any}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5" style={{ WebkitAppRegion: "no-drag" } as any}>
        <button
          onClick={() => router.push("/room")}
          className="text-white/30 hover:text-white/70 transition-all text-xs font-bold flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <Image src="https://www.getchintu.com/icon.png" alt="" width={20} height={20} className="w-5 h-5" unoptimized />
          <span className="text-xs font-black tracking-tight text-white/80">Chintu</span>
        </div>
        <div className="w-24" />
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-6 pb-16 pt-10" style={{ WebkitAppRegion: "no-drag" } as any}>
        <div className="w-full max-w-lg space-y-6">

          {/* Title */}
          <div className="text-center mb-2">
            <span className="text-3xl mb-3 block">💎</span>
            <h1 className="text-xl font-black tracking-tight mb-1">Subscription Portal</h1>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Manage Your Plan</p>
          </div>

          {/* ─── Plan Card ─────────────────────────────────────── */}
          <div className={`relative overflow-hidden rounded-3xl border ${planStyle.border} ${planStyle.bg} p-6 shadow-xl ${planStyle.glow}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-bl-full" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Current Plan</p>
                <h2 className={`text-2xl font-black uppercase tracking-tight ${planStyle.text}`}>
                  {plan === "free" ? "Starter" : plan}
                </h2>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${planStyle.bg} ${planStyle.text} border ${planStyle.border}`}>
                {isExpired ? "Expired" : "Active"}
              </div>
            </div>

            {/* Credits */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.15em] mb-1">Credits</p>
                <p className="text-2xl font-black text-white/90">{data.credits?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.15em] mb-1">Days Left</p>
                <p className={`text-2xl font-black ${daysLeft <= 7 ? "text-red-400" : daysLeft <= 30 ? "text-amber-400" : "text-emerald-400"}`}>
                  {daysLeft}
                </p>
              </div>
            </div>

            {/* Expiry Bar */}
            {data.subscription_expires_at && (
              <div>
                <div className="flex justify-between text-[9px] font-bold text-white/25 mb-1.5">
                  <span>Subscription Period</span>
                  <span>Expires {formatDate(data.subscription_expires_at)}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      daysLeft <= 7 ? "bg-red-500" : daysLeft <= 30 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${expiryPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ─── Payment Details Card ──────────────────────────── */}
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Payment Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-white/40 font-medium">Provider</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${data.payment_provider === "razorpay" ? "bg-blue-400" : "bg-indigo-400"}`} />
                  <span className="text-xs font-bold text-white/80 uppercase">{data.payment_provider || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-white/40 font-medium">Account</span>
                <span className="text-xs font-bold text-white/80">{data.email || user?.primaryEmailAddress?.emailAddress || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-white/40 font-medium">Name</span>
                <span className="text-xs font-bold text-white/80">{data.full_name || user?.fullName || "N/A"}</span>
              </div>
              {data.razorpay_payment_id && (
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-xs text-white/40 font-medium">Last Transaction</span>
                  <span className="text-[10px] font-mono font-bold text-white/60 bg-white/5 px-2 py-1 rounded-lg">{data.razorpay_payment_id}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-white/40 font-medium">Last Updated</span>
                <span className="text-xs font-bold text-white/60">{formatDate(data.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* ─── Actions ───────────────────────────────────────── */}
          <div className="space-y-3">
            {/* Upgrade / Renew */}
            {(plan === "free" || isExpired) && (
              <button
                onClick={() => router.push("/pricing")}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.01] transition-all active:scale-[0.99]"
              >
                {isExpired ? "Renew Subscription →" : "Upgrade Plan →"}
              </button>
            )}

            {plan !== "free" && !isExpired && (
              <button
                onClick={() => router.push("/pricing")}
                className="w-full py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/[0.06] hover:text-white/80 transition-all active:scale-[0.99]"
              >
                Change Plan
              </button>
            )}

            {/* Contact Support */}
            <button
              onClick={() => router.push("/support")}
              className="w-full py-4 rounded-2xl bg-white/[0.02] border border-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/[0.05] hover:text-white/60 transition-all active:scale-[0.99]"
            >
              Contact Support
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-[9px] text-white/15 font-medium mt-6">
            For cancellations or refund requests, please contact our support team.
          </p>

        </div>
      </div>
    </div>
  );
}
