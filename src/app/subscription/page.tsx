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
  profile_data?: {
    payment_amount?: string;
    payment_type?: string;
    [key: string]: any;
  } | null;
}

export default function SubscriptionPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<{ amount?: number; currency?: string; method?: string } | null>(null);

  const isElectron = typeof window !== "undefined" && (!!(window as any).electronAPI || navigator.userAgent.toLowerCase().includes("electron"));

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile?t=${Date.now()}`, { cache: "no-store" });
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
            if (profile.razorpay_payment_id) {
              console.log("[Subscription] Fetching Razorpay details for:", profile.razorpay_payment_id);
              try {
                const pRes = await fetch(`/api/razorpay/payment-details?paymentId=${profile.razorpay_payment_id}`);
                if (pRes.ok) {
                  const pData = await pRes.json();
                  console.log("[Subscription] Got details:", pData);
                  setPaymentDetails(pData);
                } else {
                  console.error("[Subscription] Failed to fetch details:", await pRes.text());
                }
              } catch (e) {
                console.error("[Subscription] Fetch error:", e);
              }
            } else {
              console.log("[Subscription] No razorpay_payment_id found in profile");
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
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true
    });
  };

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return 0;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getBillingCycle = (updatedStr: string | null, expiresStr: string | null) => {
    if (!updatedStr || !expiresStr) return "N/A";
    const diff = new Date(expiresStr).getTime() - new Date(updatedStr).getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    if (days > 300) return "Annually";
    return "Monthly";
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
      <div className="grid grid-cols-3 items-center px-4 sm:px-8 py-4 sticky top-0 bg-[#0a0a0f]/90 backdrop-blur-md z-50 border-b border-white/5 shrink-0 select-none" style={{ WebkitAppRegion: "drag" } as any}>
        <div className="flex items-center" style={{ WebkitAppRegion: "no-drag" } as any}>
          <button
            onClick={() => router.push("/room")}
            className="group flex items-center gap-2 text-white/40 hover:text-white/90 transition-all text-[9px] font-black uppercase tracking-[0.2em]"
          >
            <svg className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-2.5 pointer-events-none">
          <div className="flex items-center justify-center w-7 h-7 bg-indigo-500/10 rounded-lg border border-indigo-500/20 shadow-sm overflow-hidden p-1">
            <Image 
              src="https://www.getchintu.com/icon.png" 
              alt="Chintu" 
              className="w-full h-full object-contain" 
              width={28} 
              height={28} 
              unoptimized 
            />
          </div>
          <span className="text-sm font-black tracking-tighter uppercase text-white/90">Chintu <span className="text-indigo-500"> Portal</span></span>
        </div>

        <div className="flex justify-end items-center" style={{ WebkitAppRegion: "no-drag" } as any}>
           <div className="w-7 h-7" /> {/* Spacer for symmetry */}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-6 pb-16 pt-10" style={{ WebkitAppRegion: "no-drag" } as any}>
        <div className="w-full max-w-lg space-y-6">

          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10 p-2 relative">
                <Image src="https://www.getchintu.com/icon.png" alt="Chintu" width={48} height={48} className="w-full h-full object-contain" unoptimized />
              </div>
              <div className="w-8 h-[2px] bg-white/10 rounded-full" />
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/10 p-2">
                {/* Razorpay Icon (simplified SVG) */}
                <svg viewBox="0 0 100 100" className="w-8 h-8 text-blue-500" fill="currentColor">
                  <path d="M72.5,23.5 L58.5,80.5 L36.5,80.5 L46.5,40.5 L27.5,40.5 L31.5,23.5 L72.5,23.5 Z M85.5,23.5 L71.5,80.5 L60.5,80.5 L74.5,23.5 L85.5,23.5 Z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-2">Subscription Portal</h1>
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Secured by Razorpay
            </p>
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
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6 shadow-xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none" />
            
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Transaction Record
            </h3>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-white/40 font-medium tracking-wide">Gateway</span>
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md">
                  <div className={`w-1.5 h-1.5 rounded-full ${data.payment_provider === "razorpay" ? "bg-blue-400 animate-pulse" : "bg-indigo-400"}`} />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{data.payment_provider || "N/A"}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-white/40 font-medium tracking-wide">Account</span>
                <span className="text-xs font-bold text-white/90">{data.email || user?.primaryEmailAddress?.emailAddress || "N/A"}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-white/40 font-medium tracking-wide">Billed To</span>
                <span className="text-xs font-bold text-white/90">{data.full_name || user?.fullName || "N/A"}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5 group">
                <span className="text-xs text-white/40 font-medium tracking-wide flex items-center gap-1.5">
                  Payment ID
                </span>
                <span className="text-[10px] font-mono font-bold text-white/80 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg group-hover:border-white/20 transition-colors">
                  {data.razorpay_payment_id || "N/A"}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-white/40 font-medium tracking-wide">Amount Paid</span>
                <span className="text-xs font-bold text-white/90">
                  {paymentDetails?.amount ? `₹${paymentDetails.amount.toLocaleString()}` : (data.profile_data?.payment_amount || "N/A")}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-white/40 font-medium tracking-wide">Payment Type</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider text-[9px]">
                  {paymentDetails?.method ? paymentDetails.method : (data.profile_data?.payment_type || "N/A")}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-xs text-white/40 font-medium tracking-wide">Billing Cycle</span>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wider text-[9px]">
                  {getBillingCycle(data.updated_at, data.subscription_expires_at)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 pt-3">
                <span className="text-xs text-white/40 font-medium tracking-wide">Timestamp</span>
                <span className="text-[11px] font-bold text-white/60">{formatDate(data.updated_at)}</span>
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
