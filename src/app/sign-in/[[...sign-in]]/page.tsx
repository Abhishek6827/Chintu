"use client";
import { SignIn, useAuth, useSignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Handle normal signed-in redirect
    if (isLoaded && isSignedIn) {
      setRedirecting(true);
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get("redirect_url") || "/setup";
      router.push(redirectUrl);
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    // 2. Handle seamless auth ticket
    const urlParams = new URLSearchParams(window.location.search);
    let ticket = urlParams.get("__clerk_ticket") || urlParams.get("ticket");
    const topRedirectUrl = urlParams.get("redirect_url") || "/setup";

    // If ticket is not at top level, check inside the redirect_url (common after middleware redirects)
    if (!ticket && urlParams.get("redirect_url")) {
      try {
        const innerUrl = new URL(urlParams.get("redirect_url")!, window.location.origin);
        const innerDeepLink = innerUrl.searchParams.get("_from_deep_link");
        if (innerDeepLink) {
          // Parse the chintu:// deep link inside the _from_deep_link param
          const deepLinkParams = new URLSearchParams(innerDeepLink.split('?')[1]);
          ticket = deepLinkParams.get("ticket") || deepLinkParams.get("__clerk_ticket");
        } else {
          ticket = innerUrl.searchParams.get("ticket") || innerUrl.searchParams.get("__clerk_ticket");
        }
      } catch {
        // Fallback or ignore
      }
    }

    if (signInLoaded && ticket && !isSignedIn) {
      const consumeTicket = async () => {
        try {
          setRedirecting(true);
          const result = await signIn.create({
            strategy: "ticket",
            ticket: ticket,
          });

          if (result.status === "complete") {
            await setActive({ session: result.createdSessionId });
            router.push(topRedirectUrl);
          }
        } catch (err: any) {
          console.error("Failed to consume seamless auth ticket:", err);
          setError("Session sync failed. Please log in manually.");
          setRedirecting(false);
        }
      };
      consumeTicket();
    }
  }, [signInLoaded, isSignedIn, signIn, setActive, router]);

  return (
    <div className="h-full bg-[#f8f9fa] flex flex-col relative overflow-hidden">
      {/* Draggable Title Bar Area (matches GlobalHeader height) */}
      <div className="h-12 w-full drag-region shrink-0 relative z-[100]" />

      {/* Background Pulse Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none no-drag flex items-center justify-center opacity-30">
        <div className="w-[600px] h-[600px] border-[1px] border-indigo-200 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute w-[400px] h-[400px] border-[1px] border-indigo-300 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-start py-8 sm:py-12 pb-20 px-4 sm:px-6 no-drag relative z-10 overflow-y-auto">
        <div className="w-full max-w-[440px] flex flex-col items-center">
          {/* Logo Section */}
          <div className="text-center mb-8 relative">
            <div className="w-20 h-20 mx-auto mb-4 drop-shadow-2xl relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full" />
              <Image src="/icon-sm.png" alt="Chintu" className="w-full h-full object-contain relative z-10 rounded-full" width={40} height={40} />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-gray-900">Chintu</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">AI Interview Assistant</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-indigo-50 py-1.5 px-3 rounded-full border border-indigo-100">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                {redirecting ? "Redirecting..." : "Secure Login Portal"}
              </p>
            </div>
          </div>
          
          {error && (
            <div className="w-full mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center animate-in fade-in slide-in-from-top-2">
              <p className="text-xs font-bold text-red-500">{error}</p>
            </div>
          )}

          <div className="w-full mb-8 relative z-0">
            <SignIn 
              fallbackRedirectUrl="/setup"
              forceRedirectUrl="/setup"
              appearance={{
                elements: {
                  rootBox: "w-full flex justify-center",
                  cardBox: "w-full shadow-none border-none bg-transparent",
                  card: "bg-white rounded-[32px] border border-gray-200 shadow-2xl shadow-indigo-500/5 w-full transition-all duration-500 hover:shadow-indigo-500/10",
                  header: "!hidden",
                  badge: "!hidden",
                  developmentBadge: "!hidden",
                  headerTitle: "!hidden",
                  headerSubtitle: "!hidden",
                  socialButtonsBlockButton: "border-gray-200 hover:bg-indigo-50 text-gray-700 font-bold h-12 transition-all relative",
                  formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-sm font-bold uppercase tracking-widest h-12 transition-all",
                  footerActionLink: "text-indigo-600 hover:text-indigo-500 font-black",
                  formFieldInput: "h-12 rounded-xl border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium",
                  dividerText: "text-[10px] font-black text-gray-400 uppercase tracking-widest",
                  dividerRow: "before:bg-gray-100 after:bg-gray-100",
                  footer: "bg-gray-50/50 border-t border-gray-100 p-6 rounded-b-[32px]",
                  main: "p-6 sm:p-8",
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
            </svg>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-50">
              Secure Connection Active
            </p>
          </div>
        </div>
      </div>

      {/* Loading Overlay when redirecting */}
      {redirecting && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Authentication Confirmed</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Redirecting to Dashboard...</p>
        </div>
      )}
    </div>
  );
}
