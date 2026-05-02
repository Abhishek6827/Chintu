"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, Sparkles, Minus, Shield, Plus, HelpCircle, Trophy, Crown, ArrowRight } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { VideoText } from "@/components/magicui/video-text";
import ConfirmationMessage from "@/components/animata/feature-cards/confirmation-message";
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";






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
    monthlyPrice: 9.18, // $9 + 2% gateway charge
    oldPrice: 29, 
    annualPrice: 89.99,
    period: "/month",
    credits: 200,
    badge: "⚡",
    color: "indigo",
    popular: true,
    features: [
      "200 Credits / month per unit",
      "5 Profile & 5 Resume Slots",
      "Unlimited Job Descriptions",
      "All Premium Engines Unlocked",
      "All Response Types",
      "Stealth Session Recording",
      "UI Customization",
    ],
    cta: "Upgrade to Pro",
  },
  {
    id: "elite",
    name: "Elite",
    description: "Unrestricted career growth",
    monthlyPrice: 29.58, // $29 + 2% gateway charge
    oldPrice: 79, 
    annualPrice: 279.99,
    period: "/month",
    credits: 1000,
    badge: "👑",
    color: "amber",
    features: [
      "1000 Credits / month per unit",
      "Unlimited Profile & Resumes",
      "Unlimited Job Descriptions",
      "All Pro Features",
      "Stealth Session Recording",
      "Dedicated Support",
      "AI Fine-Tuning",
      "Early Access",
    ],
    cta: "Go Elite",
  },
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
  
  // Quantity Selector
  const [quantity, setQuantity] = useState<number>(1);
  const minQty = 1;
  const maxQty = 10;

  // Conversion rate (approx 1 USD = 85 INR for Razorpay processing)
  const USD_TO_INR = 85;

  const handleBack = () => {
    const jd = sessionStorage.getItem("jobDescription");
    router.push(jd ? "/room" : "/setup");
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: any) => {
    if (!user) return;
    
    setLoading(plan.id);
    try {
      const res = await loadRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setLoading(null);
        return;
      }

      // Calculate price in INR (Razorpay takes subunits like paise)
      const basePrice = billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
      const totalAmount = Math.round(basePrice * quantity * USD_TO_INR * 100); 

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
        name: "Chintu Intelligence",
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
            document.body.classList.remove("light-mode");
            setSuccessPlan(plan);
            setShowSuccess(true);
            
            // Start countdown to redirect
            let timer = 5;
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
          ondismiss: function() {
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

  const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

  const handleMinimize = () => {
    if (isElectron && (window as any).electronAPI?.minimize) {
      (window as any).electronAPI.minimize();
    }
  };


  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("dark");
  
  useEffect(() => {
    // Check initial theme
    if (typeof document !== "undefined") {
      setCurrentTheme(document.body.classList.contains("light-mode") ? "light" : "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    if (newTheme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  };

  if (!isLoaded) return <div className="h-screen bg-[#f8f9fa] flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;


  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 flex flex-col">
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
                labelName="Chintu AI"
                labelMessage={`Welcome to the ${successPlan?.name} tier. Your account has been initialized with ${successPlan?.credits * (quantity || 1)} credits and Dark Mode has been activated.`}
                icon={successPlan?.id === 'elite' ? <Crown className="w-8 h-8 text-white" /> : <Trophy className="w-8 h-8 text-white" />}
                containerClassName="mb-8"
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
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-4">
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
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-black tracking-tighter mb-2 uppercase">Securing Connection...</h2>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sticky top-0 bg-[#f8f9fa]/90 backdrop-blur-md z-50 border-b border-gray-100 shrink-0 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
           <button 
            onClick={handleBack}
            className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-all text-[10px] font-black uppercase tracking-widest no-drag"
           >
            <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back to App
          </button>
        </div>
        
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
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
          <span className="text-sm font-black tracking-tighter uppercase">Chintu <span className="text-indigo-600">SaaS</span></span>
        </div>

        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <AnimatedThemeToggler 
            theme={currentTheme} 
            onToggle={toggleTheme} 
            className="bg-white border-gray-200 text-gray-400 hover:text-gray-900 hover:border-gray-300 shadow-sm"
          />
          {isElectron && (
            <button onClick={handleMinimize} className="w-7 h-7 rounded-lg flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-all active:scale-90">
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 pb-16 selection:bg-indigo-100">
        <div className="text-center px-4 pt-12 pb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 border border-indigo-100">
            <Sparkles className="w-3 h-3 animate-pulse" /> Premium Access
          </div>
          
          {currentPlan === 'elite' && (
            <div className="max-w-4xl mx-auto mb-12 h-[150px] rounded-[2rem] overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-500/10">
              <VideoText src="https://cdn.magicui.design/ocean-small.webm">ELITE PROTOCOL ACTIVE</VideoText>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4 text-gray-900 leading-none uppercase">Elevate Your Career.</h1>
          
          <div className="max-w-[280px] mx-auto mb-10 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
             <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">
               Select Multiplier (Quantity)
             </label>
             <div className="flex items-center justify-between">
                <button onClick={() => setQuantity(q => Math.max(minQty, q - 1))} disabled={quantity <= minQty} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"><Minus className="w-3 h-3" /></button>
                <span className="text-lg font-black">{quantity}x</span>
                <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"><Plus className="w-3 h-3" /></button>
             </div>
             <p className="text-[8px] font-bold text-gray-400 uppercase mt-2">Credits & Price will be multiplied by {quantity}</p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${billingCycle === "monthly" ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
            <button onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")} className="w-12 h-6 bg-gray-200 rounded-full relative p-1 transition-colors">
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 transform ${billingCycle === "annual" ? "translate-x-6 bg-indigo-600" : "translate-x-0"}`} />
            </button>
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${billingCycle === "annual" ? "text-gray-900" : "text-gray-400"}`}>
              Annual <span className="text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded ml-1 border border-emerald-100">SAVE UP TO 75%</span>
            </span>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl group/tooltip relative cursor-help">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Credit System Explained</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white p-3 rounded-xl text-[9px] font-bold leading-relaxed opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all shadow-xl z-[60]">
               <div className="flex justify-between border-b border-white/10 pb-1.5 mb-1.5">
                 <span>1 TEXT / VOICE CHAT</span>
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
            <div key={plan.id} className={`group relative flex flex-col bg-white rounded-[2rem] border-2 transition-all duration-300 ${plan.popular ? "border-indigo-600 shadow-xl shadow-indigo-500/5 scale-105 z-10" : "border-gray-100 shadow-sm"} p-6 sm:p-8`}>

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
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{plan.name}</h3>
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-1">{totalCredits} Credits/mo</p>
                
                <div className="mt-4 flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    {oldPriceTotal && oldPriceTotal > totalPrice && (
                      <span className="text-gray-400 text-sm line-through decoration-red-500/50 decoration-2 tracking-tighter">
                        ${oldPriceTotal.toLocaleString()}
                      </span>
                    )}
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">
                      ${totalPrice.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-[9px] font-black uppercase">{isMonthly ? "/month" : "/year"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">≈ ₹{(totalPrice * USD_TO_INR).toLocaleString()} INR</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-indigo-50/50 text-indigo-600 px-2 py-0.5 rounded-md w-fit border border-indigo-100/50">
                    <span className="text-[7px] font-black uppercase tracking-widest">Incl. 2% Gateway Fee</span>
                  </div>
                </div>
                {billingCycle === "annual" && plan.annualPrice > 0 && (
                  <p className="text-emerald-500 text-[8px] font-black uppercase mt-1">Billed annually (${(plan.annualPrice * quantity).toFixed(2)})</p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[11px] font-bold text-gray-600">
                    <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.color === 'emerald' ? 'text-emerald-500' : plan.color === 'indigo' ? 'text-indigo-500' : 'text-amber-500'}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <InteractiveHoverButton
                onClick={() => handleSubscribe(plan)}
                disabled={(currentPlan === 'elite' && (plan.id === 'pro' || plan.id === 'elite')) || (currentPlan === 'pro' && plan.id === 'pro') || loading === plan.id}
                className={`w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${currentPlan === plan.id ? "bg-gray-100 text-gray-400 border border-gray-200" : plan.popular ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-gray-900 text-white"}`}
              >
                {loading === plan.id ? "Connecting..." : currentPlan === plan.id ? "Current Plan" : plan.cta}
              </InteractiveHoverButton>
            </div>
          )})}
        </div>
        
        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-12">
          Secure Payments by Razorpay • Global Access Enabled
        </p>
      </div>

      {/* Footer */}
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
        
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-50 flex flex-col sm:row justify-between items-center gap-4">
          <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.2em]">
            © 2026 CHINTU INTELLIGENCE ECOSYSTEM • ALL RIGHTS RESERVED
          </p>
        </div>
      </footer>
    </div>
  );
}
