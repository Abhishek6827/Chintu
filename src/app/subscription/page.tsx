"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Meteors } from "@/components/magicui/meteors";

interface SubscriptionData {
  plan: string;
  credits: number;
  subscription_expires_at: string | null;
  subscription_starts_at: string | null;
  payment_provider: string | null;
  razorpay_payment_id: string | null;
  full_name: string | null;
  email: string | null;
  updated_at: string | null;
  profile_data?: {
    payment_amount?: number | string;
    payment_type?: string;
    last_payment_at?: string;
    last_frequency?: string;
    free_credits_refill_at?: string;
    subscription_starts_at?: string;
    [key: string]: any;
  } | null;
}

export default function SubscriptionPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<{ amount?: number; currency?: string; method?: string; createdAt?: string } | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

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
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center transition-colors duration-300">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-dim)] text-sm transition-colors duration-300">
        No subscription data found.
      </div>
    );
  }

  const plan = (data.plan || "free").toLowerCase();
  const planStyle = getPlanColor(plan);
  // For free users, use the top-level subscription_expires_at (refill date)
  // Falls back to profile_data.free_credits_refill_at for legacy data
  const freeRefillDate = data.subscription_expires_at || data.profile_data?.free_credits_refill_at;
  const daysLeft = plan === "free"
    ? getDaysRemaining(freeRefillDate || null)
    : getDaysRemaining(data.subscription_expires_at);
  const isExpired = daysLeft === 0 && !!(data.subscription_expires_at || freeRefillDate);
  const expiryPercent = plan === "free" && freeRefillDate
    ? Math.min(100, Math.max(0, (daysLeft / 30) * 100))
    : data.subscription_expires_at
      ? Math.min(100, Math.max(0, (daysLeft / 365) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] relative overflow-hidden transition-colors duration-300" style={{ WebkitAppRegion: "drag" } as any}>
      {/* Background for premium users */}
      {plan !== "free" && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <Meteors number={20} />
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      )}


      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-8 pb-8" style={{ WebkitAppRegion: "no-drag" } as any}>
        <div className="w-full max-w-4xl">
          
          {/* Page Header */}
          <div className="flex items-end justify-between mb-8 border-b border-[var(--glass-border)] pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)] mb-1">Billing</h1>
              <p className="text-sm text-[var(--text-dim)] font-medium">Manage your subscription and view transaction history</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
              <svg viewBox="0 0 100 100" className="w-3.5 h-3.5 text-blue-500" fill="currentColor">
                <path d="M72.5,23.5 L58.5,80.5 L36.5,80.5 L46.5,40.5 L27.5,40.5 L31.5,23.5 L72.5,23.5 Z M85.5,23.5 L71.5,80.5 L60.5,80.5 L74.5,23.5 L85.5,23.5 Z" />
              </svg>
              <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider">Secured by Razorpay</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Plan Overview */}
            <div className="md:col-span-5 space-y-6">
              <section>
                <h3 className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-[0.15em] mb-4">Current Plan</h3>
                <div className={`relative overflow-hidden rounded-2xl border ${planStyle.border} ${planStyle.bg} p-6 shadow-sm`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold tracking-tight ${planStyle.text}`}>
                      {plan === "free" ? "Starter" : plan}
                    </h2>
                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${planStyle.bg} ${planStyle.text} border ${planStyle.border}`}>
                      {isExpired ? "Expired" : "Active"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">Credits</p>
                      <p className="text-xl font-bold text-[var(--text-main)] opacity-90">{data.credits?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">Days Left</p>
                      <p className={`text-xl font-bold ${daysLeft <= 7 ? "text-red-400" : daysLeft <= 30 ? "text-amber-400" : "text-emerald-400"}`}>
                        {daysLeft}
                      </p>
                    </div>
                  </div>

                  {(data.subscription_expires_at || freeRefillDate) && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-medium text-[var(--text-dim)] opacity-60">
                        <span>Period</span>
                        <span>
                          {plan === "free"
                            ? `Next Refill ${formatDate(freeRefillDate || null)}`
                            : `Expires ${formatDate(data.subscription_expires_at)}`}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            daysLeft <= 7 ? "bg-red-500/80" : daysLeft <= 30 ? "bg-amber-500/80" : "bg-emerald-500/80"
                          }`}
                          style={{ width: `${expiryPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className="space-y-3 pt-2">
                {(plan === "free" || isExpired) && (
                  <button
                    onClick={() => router.push("/pricing")}
                    className="w-full py-3 rounded-xl bg-[var(--text-main)] text-[var(--bg-app)] text-[11px] font-bold uppercase tracking-wider hover:opacity-90 transition-all"
                  >
                    {isExpired ? "Renew Subscription" : "Upgrade Plan"}
                  </button>
                )}

                {plan !== "free" && !isExpired && (
                  <button
                    onClick={() => router.push("/pricing")}
                    className="w-full py-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-main)] opacity-80 text-[11px] font-bold uppercase tracking-wider hover:opacity-100 transition-all"
                  >
                    Change Plan
                  </button>
                )}

                <button
                  onClick={() => router.push("/support")}
                  className="w-full py-3 rounded-xl bg-transparent border border-[var(--glass-border)] text-[var(--text-dim)] text-[11px] font-bold uppercase tracking-wider hover:text-[var(--text-main)] hover:border-[var(--text-dim)] transition-all"
                >
                  Contact Support
                </button>
              </div>
            </div>

            {/* Right Column: Transaction Details & Credit History */}
            <div className="md:col-span-7 space-y-8">
              <section>
                <h3 className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-[0.15em] mb-4">Payment Details</h3>
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] overflow-hidden">
                  <div className="divide-y divide-[var(--glass-border)]">
                    {[...(
                      plan === "free"
                        ? [
                          { label: "Account", value: data.email || user?.primaryEmailAddress?.emailAddress || "N/A" },
                          { label: "Billed To", value: data.full_name || user?.fullName || "N/A" },
                          { label: "Billing Cycle", value: "30 Days (Free Refill)" },
                          { label: "Subscription Start", value: formatDate(data.subscription_starts_at) },
                        ]
                        : [
                          { label: "Gateway", value: data.payment_provider || "N/A", isBadge: true, color: "blue" },
                          { label: "Account", value: data.email || user?.primaryEmailAddress?.emailAddress || "N/A" },
                          { label: "Billed To", value: data.full_name || user?.fullName || "N/A" },
                          { label: "Payment ID", value: data.razorpay_payment_id || "N/A", isMono: true },
                          { label: "Amount Paid", value: (() => {
                            const amount = paymentDetails?.amount ?? data.profile_data?.payment_amount;
                            if (amount == null) return "N/A";
                            const num = typeof amount === "string" ? Number(amount.replace(/[^0-9.]/g, "")) : amount;
                            return `₹${num.toLocaleString()}`;
                          })() },
                          { label: "Method", value: (paymentDetails?.method || data.profile_data?.payment_type || "N/A"), isBadge: true, color: "emerald" },
                          { label: "Billing Cycle", value: getBillingCycle(data.updated_at, data.subscription_expires_at), isBadge: true, color: "indigo" },
                          { label: "Subscription Start", value: formatDate(data.subscription_starts_at) },
                          { label: "Invoice Date", value: formatDate(paymentDetails?.createdAt || data.profile_data?.last_payment_at || data.updated_at) },
                        ]
                    )].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-6 py-3.5">
                        <span className="text-[12px] font-medium text-[var(--text-dim)]">{item.label}</span>
                        {item.isBadge ? (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            item.color === 'blue' ? 'bg-blue-500/5 text-blue-400 border-blue-500/10' : 
                            item.color === 'emerald' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' : 
                            'bg-indigo-500/5 text-indigo-400 border-indigo-500/10'
                          }`}>
                            {item.value}
                          </span>
                        ) : (
                          <span className={`text-[12px] font-bold text-[var(--text-main)] opacity-80 ${item.isMono ? 'font-mono text-[11px] opacity-60' : ''}`}>
                            {item.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Credit History Section */}
              <section>
                {(() => {
                  const creditHistory = (data.profile_data?.credit_history as any[]) || [];
                  const displayedHistory = creditHistory.slice(0, visibleCount);
                  const isUnderFifty = creditHistory.length < 50;

                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-[0.15em]">Credit Activity Log</h3>
                        <span className="text-[9px] font-bold text-[var(--text-dim)] opacity-40 uppercase">
                          {isUnderFifty ? `Total: ${creditHistory.length} Entries` : "Last 50 Events"}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--panel-bg)] overflow-hidden shadow-sm">
                        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
                          {displayedHistory.length > 0 ? (
                            <div className="divide-y divide-[var(--glass-border)]">
                              {displayedHistory.map((entry, idx) => (
                                <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                                      entry.type === 'addition' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-red-500/5 border-red-500/10 text-red-400'
                                    }`}>
                                      {entry.type === 'addition' ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                      ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-[12px] font-bold text-[var(--text-main)] opacity-90">{entry.description}</p>
                                      <p className="text-[10px] font-medium text-[var(--text-dim)] opacity-40">{formatDate(entry.timestamp)}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-[13px] font-black ${entry.type === 'addition' ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {entry.type === 'addition' ? '+' : '-'}{entry.amount}
                                    </p>
                                    {entry.transaction_id && (
                                      <p className="text-[8px] font-mono text-[var(--text-dim)] opacity-30 uppercase tracking-tighter">ID: {entry.transaction_id.slice(-8)}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-12 flex flex-col items-center justify-center opacity-30 grayscale">
                              <svg className="w-8 h-8 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <p className="text-[11px] font-bold uppercase tracking-widest text-center">No Activity Detected<br/><span className="text-[9px]">Transactions will appear here</span></p>
                            </div>
                          )}
                        </div>
                        {creditHistory.length > visibleCount && visibleCount < 50 && (
                          <div className="flex justify-center p-4 border-t border-[var(--glass-border)] bg-[var(--bg-app)]/50">
                            <button
                              onClick={() => setVisibleCount(Math.min(50, creditHistory.length))}
                              className="px-4 py-2 rounded-lg bg-[var(--text-main)] text-[var(--bg-app)] hover:opacity-90 active:scale-[0.98] text-[10px] font-bold uppercase tracking-wider transition-all"
                            >
                              View More
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </section>
              
              <p className="mt-6 text-center md:text-left text-[10px] text-[var(--text-dim)] opacity-50 font-medium leading-relaxed">
                Need help? <button onClick={() => router.push("/support")} className="text-[var(--text-dim)] hover:text-[var(--text-main)] underline underline-offset-4 transition-colors">Contact our support team</button> for cancellations, refunds, or billing inquiries.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
