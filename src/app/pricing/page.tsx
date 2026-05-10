"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, Sparkles, Minus, Shield, Plus, HelpCircle, Trophy, Crown, ArrowRight, MessageSquare, FileText, Layout, Code } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { VideoText } from "@/components/magicui/video-text";
import ConfirmationMessage from "@/components/animata/feature-cards/confirmation-message";

import { useThemeToggle } from "@/hooks/useThemeToggle";
import SyncedUserButton from "@/components/SyncedUserButton";
// import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";






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
      "1 Profile & 1 Resume Upload",
      "Standard Engine only",
      "Basic Response Types",
      "Standard History",
      "Community Support",
    ],
    locked: [
      "Multiple Profile Slots",
      "Unlimited Job Descriptions",
      "Premium AI Engines",
      "Coding & Detailed Modes",
    ],
    cta: "Included",
    disabled: true,

  },
  {
    id: "pro",
    name: "Professional",
    description: "Best for active interviewees",
    monthlyPrice: 9,
    oldPrice: 29,
    annualPrice: 89,
    period: "/month",
    credits: 100,
    badge: "⚡",
    color: "indigo",
    popular: true,
    features: [
      "100 Credits / month per unit",
      "1 Credit = 1 Resume Tailoring",
      "Unlimited Profile Uploads",
      "Unlimited Job Descriptions",
      "All Premium Engines Unlocked",
      "All Response Types",
      "Stealth Session Recording",
      "Font Size & Opacity Sliders",
      "UI Customization",
    ],
    cta: "Upgrade to Pro",
    stripePriceIdMonthly: "price_1TTF8WLYcsTnVrvkaLcpMyel",
    stripePriceIdAnnual: "price_1TTcEhLYcsTnVrvkvOjR8hMc",
  },
  {
    id: "elite",
    name: "Elite",
    description: "Unrestricted career growth",
    monthlyPrice: 29,
    oldPrice: 79,
    annualPrice: 279,
    period: "/month",
    credits: 500,
    badge: "👑",
    color: "amber",
    features: [
      "500 Credits / month per unit",
      "1 Credit = 1 Resume Tailoring",
      "Unlimited Profile Uploads",
      "Unlimited Job Descriptions",
      "All Pro Features",
      "Stealth Session Recording",
      "Font Size & Opacity Sliders",
      "Dedicated Support",
      "AI Fine-Tuning",
      "Early Access",
    ],
    cta: "Go Elite",
    stripePriceIdMonthly: "price_1TTFBELYcsTnVrvkKpZSsGRN",
    stripePriceIdAnnual: "price_1TTcI2LYcsTnVrvk5Y3jkmp0",
  },
];

const ENGINE_DETAILS = [
  {
    name: "Standard Engine",
    desc: "The backbone of Chintu. Fast, reliable, and perfect for standard interview questions.",
    plans: ["Starter", "Pro", "Elite"],
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />
  },
  {
    name: "Pro Engine",
    desc: "Superior reasoning and logic. Best for behavioral questions and complex system design.",
    plans: ["Pro", "Elite"],
    icon: <Shield className="w-4 h-4 text-indigo-400" />
  },
  {
    name: "Coding Specialist",
    desc: "Hardened for technical rounds. Expert at finding silent bugs and optimizing algorithms.",
    plans: ["Pro", "Elite"],
    icon: <Check className="w-4 h-4 text-blue-400" />
  },
  {
    name: "Titan Engine",
    desc: "Massive intelligence for niche domains. High-fidelity knowledge across all tech stacks.",
    plans: ["Pro", "Elite"],
    icon: <Trophy className="w-4 h-4 text-purple-400" />
  },
  {
    name: "Turbo Engine",
    desc: "Hyper-intelligence with zero latency. The ultimate strategic companion for Elite users.",
    plans: ["Elite Only"],
    icon: <Crown className="w-4 h-4 text-amber-400" />
  }
];

const RESPONSE_DETAILS = [
  {
    name: "Small",
    desc: "3-4 short sentences. Ideal for quick, direct answers when time is extremely tight.",
    plans: ["Starter", "Pro", "Elite"],
    icon: <MessageSquare className="w-4 h-4 text-emerald-400" />
  },
  {
    name: "Balanced",
    desc: "2-3 natural paragraphs. The default mode for a thoughtful, human-like conversational flow.",
    plans: ["Starter", "Pro", "Elite"],
    icon: <FileText className="w-4 h-4 text-emerald-400" />
  },
  {
    name: "Detailed",
    desc: "Structured sections with headers & steps. Perfect for deep dives and complex explanations.",
    plans: ["Pro", "Elite"],
    icon: <Layout className="w-4 h-4 text-emerald-400" />
  },
  {
    name: "Coding",
    desc: "Specialized code blocks with inline fixes and line-by-line optimization analysis.",
    plans: ["Pro", "Elite"],
    icon: <Code className="w-4 h-4 text-emerald-400" />
  }
];

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlan, setSuccessPlan] = useState<any>(null);
  const [countdown, setCountdown] = useState(5);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState<any[]>([]);
  const searchParams = useSearchParams();


  // Fetch current plan
  useEffect(() => {
    async function fetchPlan() {
      if (!user) return;
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan(data.profile?.plan || "free");
        }
      } catch (err) {
        console.error("Failed to fetch plan:", err);
      }
    }
    fetchPlan();
  }, [user]);

  // Handle Stripe Success
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId && isLoaded && user) {
      const fetchSession = async () => {
        setLoading("stripe");
        try {
          const res = await fetch(`/api/checkout/session?session_id=${sessionId}`);
          if (res.ok) {
            const data = await res.json();

            // Auto-switch to Dark Mode
            window.dispatchEvent(new CustomEvent("chintu-theme-sync", { detail: { theme: "dark" } }));

            const matchedPlan = PLANS.find(p => p.name.toLowerCase().includes(data.plan.toLowerCase()));
            setSuccessPlan(matchedPlan || PLANS[1]);
            setReceiptDetails([
              { label: "Transaction ID", value: data.transactionId },
              { label: "Total Amount", value: `${data.totalAmount} ${data.currency}` },
              { label: "Plan Price", value: `${data.planPrice} ${data.currency}` },
              { label: "Gateway Fees", value: `${data.gatewayFees} ${data.currency} (2%)` },
              { label: "Total Credits", value: data.newCredits },
              { label: "Expiry Date", value: data.expiryDate },
            ]);
            setShowSuccess(true);

            // Start countdown to redirect
            let timer = 10; // Give them time to read the receipt
            setCountdown(timer);
            const interval = setInterval(() => {
              timer -= 1;
              setCountdown(timer);
              if (timer <= 0) {
                clearInterval(interval);
                const jd = sessionStorage.getItem("jobDescription");
                router.push(jd ? "/room" : "/setup");
              }
            }, 1000);
          }
        } catch (err) {
          console.error("Failed to fetch session:", err);
        } finally {
          setLoading(null);
        }
      }
      fetchSession();
    }
  }, [searchParams, isLoaded, user, router]);

  // Quantity Selector
  const [quantity, setQuantity] = useState<number>(1);
  const minQty = 1;
  const maxQty = 10;

  // Conversion rate (approx 1 USD = 85 INR for Razorpay processing)
  const USD_TO_INR = 85;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBack = () => {
    const jd = sessionStorage.getItem("jobDescription");
    router.push(jd ? "/room" : "/setup");
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.crossOrigin = "anonymous";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: any) => {
    if (!user) return;
    setSelectedPlanForPayment(plan);
    setShowPaymentModal(true);
  };



  const handleRazorpayCheckout = async () => {
    if (!selectedPlanForPayment || !user) return;

    const plan = selectedPlanForPayment;
    setShowPaymentModal(false);
    setLoading(plan.id);
    try {
      const res = await loadRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setLoading(null);
        return;
      }

      // Calculate price in INR (Base * Qty * 85 * 100 for paise * 1.02 for gateway)
      const basePrice = billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
      const totalAmount = Math.round(basePrice * quantity * USD_TO_INR * 100 * 1.02);

      // 1. Create Order
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          planId: plan.id,
          quantity,
          billingCycle,
          currency: "INR",
          email: user.primaryEmailAddress?.emailAddress || "",
          fullName: user.fullName || ""
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || "Order creation failed");
      }

      const order = await orderRes.json();

      // 2. Open Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Chintu Ji",
        description: `${plan.name} Plan Upgrade`,
        image: "https://www.getchintu.com/icon.png",
        order_id: order.id,
        handler: async function (response: any) {
          setLoading(plan.id);
          // 3. Verify Payment
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id,
              quantity,
              billingCycle,
            }),
          });

          const result = await verifyRes.json();
          if (result.success) {
            // Auto-switch to Dark Mode
            window.dispatchEvent(new CustomEvent("chintu-theme-sync", { detail: { theme: "dark" } }));

            setSuccessPlan(plan);
            if (result.receipt) {
              setReceiptDetails([
                { label: "Transaction ID", value: result.receipt.transactionId },
                { label: "Total Amount", value: `₹${result.receipt.totalAmount}` },
                { label: "Plan Price", value: `₹${result.receipt.planPrice}` },
                { label: "Gateway Fees", value: `₹${result.receipt.gatewayFees} (2%)` },
                { label: "Total Credits", value: result.receipt.newCredits },
                { label: "Expiry Date", value: result.receipt.expiryDate },
              ]);
            } else {
              setReceiptDetails([
                { label: "Transaction ID", value: response.razorpay_payment_id },
                { label: "Status", value: "Success (Details Pending)" }
              ]);
            }
            // Refresh credits in header
            window.dispatchEvent(new CustomEvent("chintu-profile-refresh"));

            setShowSuccess(true);

            // Start countdown to redirect
            let timer = 10;
            setCountdown(timer);
            const interval = setInterval(() => {
              timer -= 1;
              setCountdown(timer);
              if (timer <= 0) {
                clearInterval(interval);
                const jd = sessionStorage.getItem("jobDescription");
                router.push(jd ? "/room" : "/setup");
              }
            }, 1000);
          } else {
            alert(result.error || "Payment verification failed.");
          }
          setLoading(null);
        },
        prefill: {
          name: user.fullName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function () {
            setLoading(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error("Razorpay Error:", err);
      alert(`Payment Error: ${err.message || "Something went wrong"}`);
      setLoading(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { currentTheme, toggleTheme } = useThemeToggle();

  if (!isLoaded) return <div className="h-screen bg-[var(--bg-app)] flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;


  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0a0a0c] flex flex-col items-center justify-center p-6 text-center overflow-hidden"
          >
            {/* Background Orbs */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full"
            />

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
              className="relative z-10"
            >
              <ConfirmationMessage
                successMessage="Protocol Active"
                labelName="Chintu Ji"
                labelMessage={`Welcome to the ${successPlan?.name} tier. Your account has been initialized with ${successPlan?.credits * (quantity || 1)} credits. All premium strategic modules are now unlocked.`}
                icon={successPlan?.id === 'elite' ? <Crown className="w-8 h-8 text-white" /> : <Trophy className="w-8 h-8 text-white" />}
                containerClassName="mb-8"
                details={receiptDetails}
              />

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-4 items-center"
              >
                <InteractiveHoverButton
                  onClick={() => {
                    const jd = sessionStorage.getItem("jobDescription");
                    router.push(jd ? "/room" : "/setup");
                  }}
                  className="px-12 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="flex items-center gap-2">Enter the App <ArrowRight className="w-4 h-4" /></span>
                </InteractiveHoverButton>
                <p className="text-[10px] text-[var(--text-dim)] font-black uppercase tracking-widest mt-4">
                  Redirecting in {countdown}s...
                </p>
              </motion.div>
            </motion.div>

            {/* Confetti-like Sparkles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * 1000 - 500,
                  y: Math.random() * 1000 - 500,
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  y: [null, Math.random() * -500],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className="absolute w-1 h-1 bg-indigo-400 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-[var(--bg-app)]/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-[var(--glass-border)] border-t-indigo-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-black tracking-tighter mb-2 uppercase text-[var(--text-main)]">Securing Connection...</h2>
        </div>
      )}


      <div className="flex-1 pb-16 selection:bg-indigo-500/20">
        <div className="text-center px-4 pt-12 pb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 border border-indigo-500/20">
            <Sparkles className="w-3 h-3 animate-pulse" /> Premium Access
          </div>

          {currentPlan === 'elite' && (
            <div className="max-w-4xl mx-auto mb-12 h-[150px] rounded-[2rem] overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-500/10">
              <VideoText src="https://cdn.magicui.design/ocean-small.webm">ELITE PROTOCOL ACTIVE</VideoText>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4 text-[var(--text-main)] leading-none uppercase">Elevate Your Career.</h1>

          <div className="max-w-[280px] mx-auto mb-10 bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-2xl p-4 shadow-sm">
            <label className="block text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest mb-3">
              Select Multiplier (Quantity)
            </label>
            <div className="flex items-center justify-between">
              <button onClick={() => setQuantity(q => Math.max(minQty, q - 1))} disabled={quantity <= minQty} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--glass-bg)] text-[var(--text-dim)] hover:text-[var(--text-main)] disabled:opacity-50 transition-colors"><Minus className="w-3 h-3" /></button>
              <span className="text-lg font-black text-[var(--text-main)]">{quantity}x</span>
              <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty} className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--glass-bg)] text-[var(--text-dim)] hover:text-[var(--text-main)] disabled:opacity-50 transition-colors"><Plus className="w-3 h-3" /></button>
            </div>
            <p className="text-[8px] font-bold text-[var(--text-dim)] uppercase mt-2">Credits & Price will be multiplied by {quantity}</p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${billingCycle === "monthly" ? "text-[var(--text-main)]" : "text-[var(--text-dim)]"}`}>Monthly</span>
            <button onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")} className="w-12 h-6 bg-[var(--glass-bg)] rounded-full relative p-1 transition-colors">
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 transform ${billingCycle === "annual" ? "translate-x-6 bg-indigo-500" : "translate-x-0"}`} />
            </button>
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${billingCycle === "annual" ? "text-[var(--text-main)]" : "text-[var(--text-dim)]"}`}>
              Annual <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-1 border border-emerald-500/20">SAVE UP TO 75%</span>
            </span>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 bg-[var(--panel-bg)] border border-[var(--glass-border)] px-4 py-2 rounded-xl group/tooltip relative cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">Credit System Explained</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white p-3 rounded-xl text-[9px] font-bold leading-relaxed opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all shadow-xl z-[60]">
              <div className="flex justify-between border-b border-white/10 pb-1.5 mb-1.5">
                <span>1 TEXT / VOICE CHAT RESPONSE</span>
                <span className="text-emerald-400">1 CREDIT</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5 mb-1.5">
                <span>1 RESUME BUILDER</span>
                <span className="text-emerald-400">1 CREDIT</span>
              </div>
              <div className="flex justify-between">
                <span>1 SCREENSHOT RESPONSE</span>
                <span className="text-emerald-400">2 CREDITS</span>
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PLANS.map((plan) => {
            const isMonthly = billingCycle === "monthly";
            const q = plan.id === "free" ? 1 : quantity;
            const totalPrice = (isMonthly ? plan.monthlyPrice : plan.annualPrice) * q;
            const oldPriceTotal = plan.oldPrice ? (isMonthly ? plan.oldPrice : plan.annualPrice * 3) * q : null;
            const totalCredits = plan.id === "free" ? plan.credits : plan.credits * q;

            return (
              <div key={plan.id} className={`group relative flex flex-col bg-[var(--panel-bg)] rounded-[2rem] border-2 transition-all duration-300 ${plan.popular ? "border-indigo-500 shadow-xl shadow-indigo-500/10 scale-105 z-10" : "border-[var(--glass-border)] shadow-sm"} p-6 sm:p-8`}>

                {plan.id === 'elite' && (
                  <div className="absolute inset-0 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <VideoText src="https://cdn.magicui.design/ocean-small.webm">ELITE</VideoText>
                  </div>
                )}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">Most Preferred</span>
                  </div>
                )}

                <div className="mb-6">
                  <span className="text-3xl mb-2 block">{plan.badge}</span>
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">{plan.name}</h3>
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1">{totalCredits} Credits/mo</p>

                  <div className="mt-4 flex flex-col gap-1">
                    {/* Row 1: Old Prices (Strike-through) */}
                    {oldPriceTotal && oldPriceTotal > totalPrice && (
                      <div className="flex items-baseline gap-2 opacity-60">
                        <span className="text-[var(--text-dim)] text-sm line-through decoration-red-500/50 decoration-2 tracking-tighter">
                          ${oldPriceTotal.toLocaleString()}
                        </span>
                        <span className="text-[var(--text-dim)] text-[10px] line-through decoration-red-500/50 uppercase tracking-tight">
                          ₹{(oldPriceTotal * USD_TO_INR).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Row 2: Current Prices (Main) */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-[var(--text-main)] tracking-tighter">
                        ${totalPrice.toLocaleString()}
                      </span>
                      <span className="text-[var(--text-dim)] text-[9px] font-black uppercase">{isMonthly ? "/month" : "/year"}</span>
                    </div>

                    {/* Row 3: Current Approx INR */}
                    <div className="flex items-center gap-1.5 mt-0.5 mb-2">
                      <span className="text-[10px] font-bold text-[var(--text-main)] uppercase tracking-tight">
                        ≈ ₹{(totalPrice * USD_TO_INR).toLocaleString()} INR
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md w-fit border border-indigo-500/20">
                      <span className="text-[7px] font-black uppercase tracking-widest">+ Gateway Charges at Checkout</span>
                    </div>
                  </div>
                  {billingCycle === "annual" && plan.annualPrice > 0 && (
                    <p className="text-emerald-500 text-[8px] font-black uppercase mt-1">Billed annually (${(plan.annualPrice * quantity).toFixed(2)})</p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[11px] font-bold text-[var(--text-dim)]">
                      <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.color === 'emerald' ? 'text-emerald-400' : plan.color === 'indigo' ? 'text-indigo-400' : 'text-amber-400'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <InteractiveHoverButton
                  onClick={() => handleSubscribe(plan)}
                  disabled={plan.id === 'free' || loading === plan.id}
                  className={`w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${currentPlan === plan.id ? "bg-[var(--glass-bg)] text-[var(--text-dim)] border border-[var(--glass-border)]" : plan.popular ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-[var(--text-main)] text-[var(--bg-app)]"}`}
                >
                  {loading === plan.id
                    ? "Connecting..."
                    : currentPlan === plan.id
                      ? "Current Plan"
                      : (currentPlan === 'elite' && plan.id === 'pro')
                        ? "Downgrade to Pro"
                        : plan.cta}
                </InteractiveHoverButton>
              </div>
            )
          })}
        </div>

        <p className="text-center text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest mt-12">
          Secure Payments by Razorpay • Global Access Enabled
        </p>

        {/* Intelligence Matrix Section */}
        <div className="mt-24 max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-black tracking-tighter uppercase mb-4">The Intelligence Matrix</h2>
            <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest max-w-md mx-auto leading-relaxed">
              Understand the strategic capabilities of each neural module and response mode.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Engines Column */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Neural Engines
              </h3>
              <div className="space-y-4">
                {ENGINE_DETAILS.map((engine, i) => (
                  <div key={i} className="bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-2xl p-5 hover:border-indigo-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                          {engine.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">{engine.name}</h4>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {engine.plans.map((p, idx) => (
                          <span key={idx} className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${p.includes('Only') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-[var(--text-dim)] border border-white/10'}`}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-[var(--text-dim)] leading-relaxed">{engine.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Types Column */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-2 mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Strategic Responses
              </h3>
              <div className="space-y-4">
                {RESPONSE_DETAILS.map((resp, i) => (
                  <div key={i} className="bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-2xl p-5 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
                          {resp.icon}
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-[var(--text-main)]">{resp.name}</h4>
                      </div>
                      <div className="flex gap-1">
                        {resp.plans.map((p, idx) => (
                          <span key={idx} className="bg-white/5 text-[var(--text-dim)] text-[7px] font-black uppercase px-2 py-0.5 rounded border border-white/10">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-[var(--text-dim)] leading-relaxed">{resp.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[var(--bg-app)] border-t border-[var(--glass-border)] py-12 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/icon.png" alt="Chintu" width={24} height={24} />
              <span className="text-sm font-black tracking-tighter uppercase text-[var(--text-main)]">Chintu <span className="text-indigo-500">SaaS</span></span>
            </div>
            <p className="text-[11px] text-[var(--text-dim)] font-bold leading-relaxed uppercase tracking-wider">
              Empowering candidates with real-time strategic intelligence. Master every interview with confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 items-start">
            <div>
              <h4 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em] mb-4 text-center sm:text-left">Support</h4>
              <ul className="space-y-2 text-center sm:text-left">
                <li><a href="mailto:contact@getchintu.com" className="text-[10px] text-[var(--text-dim)] hover:text-indigo-400 font-bold uppercase transition-colors">Contact Us</a></li>
                <li><Link href="/support" className="text-[10px] text-[var(--text-dim)] hover:text-indigo-400 font-bold uppercase transition-colors">Help Center</Link></li>
                <li><Link href="/terms" className="text-[10px] text-[var(--text-dim)] hover:text-indigo-400 font-bold uppercase transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div className="flex flex-col items-center sm:items-end">
              <h4 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em] mb-4">Account</h4>
              <div className="hover:scale-105 transition-all">
                <SyncedUserButton />
              </div>
              <p className="text-[8px] text-[var(--text-dim)] font-black uppercase mt-2 tracking-widest">Active Profile</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-50 flex flex-col sm:row justify-between items-center gap-4">
          <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.2em]">
            © 2026 Chintu Ji ECOSYSTEM • ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>

      {/* Payment Selection Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="fixed inset-0 bg-[#0a0a0c]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-[92%] sm:w-full max-w-2xl bg-[var(--bg-app)] border border-[var(--glass-border)] rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.4)] overflow-y-auto flex flex-col md:flex-row h-auto max-h-[90vh] custom-scrollbar"
            >
              {/* Left Section: Order Summary (Stripe-like) */}
              <div className="w-full md:w-[40%] bg-[var(--panel-bg)] p-5 md:p-8 pb-10 md:pb-8 border-b md:border-b-0 md:border-r border-[var(--glass-border)] flex flex-col relative">
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="group flex items-center gap-2 text-[var(--text-dim)] hover:text-[var(--text-main)] transition-all text-[9px] font-black uppercase tracking-widest mb-6 relative z-10"
                >
                  <ArrowRight className="w-3 h-3 rotate-180 transition-transform group-hover:-translate-x-1" />
                  Back to plans
                </button>

                <div className="flex items-center gap-2 mb-5 relative z-10">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Image src="/icon.png" alt="Chintu" width={20} height={20} />
                  </div>
                  <span className="text-xs font-black tracking-tighter uppercase text-[var(--text-main)]">Chintu <span className="text-indigo-500">SaaS</span></span>
                </div>

                <div className="mb-auto relative z-10">
                  <p className="text-[var(--text-dim)] text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Checkout Summary</p>
                  <h2 className="text-base font-black text-[var(--text-main)] uppercase tracking-tight">
                    {selectedPlanForPayment?.name} Tier
                  </h2>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-black text-[var(--text-main)] tracking-tighter">
                      ${((billingCycle === 'monthly' ? selectedPlanForPayment?.monthlyPrice : selectedPlanForPayment?.annualPrice) * quantity).toLocaleString()}
                    </span>
                    <span className="text-[var(--text-dim)] text-[9px] font-black uppercase opacity-60">
                      {billingCycle === 'monthly' ? '/ mo' : '/ yr'}
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-[var(--glass-border)] space-y-2.5 relative z-10">
                  <div className="flex justify-between text-[10px] font-bold text-[var(--text-dim)] uppercase">
                    <span>Protocol (×{quantity})</span>
                    <span className="text-[var(--text-main)]">${((billingCycle === 'monthly' ? selectedPlanForPayment?.monthlyPrice : selectedPlanForPayment?.annualPrice) * quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-[var(--text-dim)] uppercase">
                    <span>Processing Fee</span>
                    <span className="text-[var(--text-main)]">${(((billingCycle === 'monthly' ? selectedPlanForPayment?.monthlyPrice : selectedPlanForPayment?.annualPrice) * quantity) * 0.02).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-[var(--text-dim)] uppercase">
                    <span>Strategic Credits</span>
                    <span className="text-emerald-400">+{selectedPlanForPayment?.credits * quantity}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-[var(--text-main)] uppercase pt-4 border-t border-[var(--glass-border)] mt-2">
                    <span>Total Due</span>
                    <span className="text-indigo-500 tracking-tighter text-xl md:text-2xl">${(((billingCycle === 'monthly' ? selectedPlanForPayment?.monthlyPrice : selectedPlanForPayment?.annualPrice) * quantity) * 1.02).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Right Section: Gateway Selection */}
              <div className="w-full md:w-[60%] p-5 md:p-8 flex flex-col justify-center bg-[var(--bg-app)] relative">
                {/* Subtle Grid Background */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-main) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                <div className="mb-5 text-center md:text-left relative z-10">
                  <h3 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tighter mb-1.5">Select Gateway</h3>
                  <p className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-widest opacity-60">Authorize Secure Protocol</p>
                </div>

                <div className="space-y-4 relative z-10">
                  {/* <StripeCheckoutButton 
                    selectedPlan={selectedPlanForPayment}
                    user={user}
                    billingCycle={billingCycle}
                    quantity={quantity}
                    setLoading={setLoading}
                    setShowPaymentModal={setShowPaymentModal}
                  /> */}

                  <button
                    onClick={handleRazorpayCheckout}
                    className="group relative w-full flex items-center gap-3.5 p-4 rounded-xl bg-[var(--panel-bg)] border border-[var(--glass-border)] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-300 text-left overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 transition-all" />
                    <div className="w-20 h-8 flex items-center justify-center shrink-0 transition-all duration-500">
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
                        alt="Razorpay"
                        width={80}
                        height={24}
                        className="w-full h-full object-contain filter brightness-125"
                        loading="lazy"
                        unoptimized
                      />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-[var(--text-main)] uppercase tracking-tight mb-0.5">Razorpay</span>
                      <span className="block text-[8px] font-bold text-[var(--text-dim)] uppercase tracking-widest opacity-60">UPI, Netbanking, Cards</span>
                    </div>
                    <div className="ml-auto bg-[var(--glass-bg)] w-8 h-8 rounded-full flex items-center justify-center border border-[var(--glass-border)] group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-all">
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                </div>

                <div className="mt-8 text-center relative z-10">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/5 text-emerald-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.1em] mb-4 border border-emerald-500/10">
                    <Shield className="w-3 h-3" /> SECURE AES-256 ENCRYPTION
                  </div>
                  <p className="text-[8px] text-[var(--text-dim)] uppercase tracking-[0.2em] leading-relaxed opacity-50 max-w-[280px] mx-auto">
                    Your data is secured by industry leading encryption protocols.
                    Authorized payment partners handle all sensitive information.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
