// "use client";

// import React from 'react';
// import Image from 'next/image';
// import { ArrowRight } from 'lucide-react';

// interface StripeCheckoutButtonProps {
//   selectedPlan: any;
//   user: any;
//   billingCycle: 'monthly' | 'annual';
//   quantity: number;
//   setLoading: (id: string | null) => void;
//   setShowPaymentModal: (show: boolean) => void;
// }

// export const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
//   selectedPlan,
//   user,
//   billingCycle,
//   quantity,
//   setLoading,
//   setShowPaymentModal
// }) => {
//   const handleStripeCheckout = async () => {
//     if (!selectedPlan || !user) return;
    
//     setLoading(selectedPlan.id);
//     setShowPaymentModal(false);
    
//     try {
//       const priceId = billingCycle === "monthly" 
//         ? selectedPlan.stripePriceIdMonthly 
//         : selectedPlan.stripePriceIdAnnual;

//       const res = await fetch("/api/checkout", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           priceId, 
//           quantity,
//           email: user.primaryEmailAddress?.emailAddress
//         }),
//       });

//       const data = await res.json();
//       if (data.url) {
//         window.location.href = data.url;
//       } else {
//         throw new Error(data.error || "Failed to create checkout session");
//       }
//     } catch (err: any) {
//       console.error("Stripe Error:", err);
//       alert(`Stripe Error: ${err.message}`);
//       setLoading(null);
//     }
//   };

//   return (
//     <button 
//       onClick={handleStripeCheckout}
//       className="group relative w-full flex items-center gap-3.5 p-4 rounded-xl bg-[var(--panel-bg)] border border-[var(--glass-border)] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300 text-left overflow-hidden"
//     >
//       <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 transition-all" />
//       <div className="w-20 h-8 flex items-center justify-center shrink-0 transition-all duration-500">
//          <Image 
//            src="https://www.vectorlogo.zone/logos/stripe/stripe-ar21.svg" 
//            alt="Stripe" 
//            width={80} 
//            height={24} 
//            className="w-full h-full object-contain filter brightness-125"
//            unoptimized 
//          />
//       </div>
//       <div>
//         <span className="block text-xs font-black text-[var(--text-main)] uppercase tracking-tight mb-0.5">Stripe</span>
//         <span className="block text-[8px] font-bold text-[var(--text-dim)] uppercase tracking-widest opacity-60">Cards, Apple Pay, Link</span>
//       </div>
//       <div className="ml-auto bg-[var(--glass-bg)] w-8 h-8 rounded-full flex items-center justify-center border border-[var(--glass-border)] group-hover:border-indigo-500/50 group-hover:text-indigo-400 transition-all">
//         <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
//       </div>
//     </button>
//   );
// };
