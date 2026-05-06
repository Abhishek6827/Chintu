"use client";
import { SignIn, useAuth, useSignIn, AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSSOCallback = typeof window !== "undefined" && window.location.search.includes("__clerk_status");

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
    const ticket = urlParams.get("__clerk_ticket");
    const redirectUrl = urlParams.get("redirect_url") || "/pricing";

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
            router.push(redirectUrl);
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
              <Image src="https://www.getchintu.com/icon.png" alt="Chintu" className="w-full h-full object-contain relative z-10" width={40} height={40} unoptimized />
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
            {/* Custom Social Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => signIn?.authenticateWithRedirect({
                  strategy: "oauth_google",
                  redirectUrl: "/sign-in",
                  redirectUrlComplete: "/setup",
                  // @ts-expect-error - Clerk allows additionalData for provider-specific params
                  additionalData: { prompt: "select_account" }
                })}
                className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold text-gray-700 shadow-sm shadow-gray-200/50 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
              
              <button
                onClick={() => signIn?.authenticateWithRedirect({
                  strategy: "oauth_github",
                  redirectUrl: "/sign-in",
                  redirectUrlComplete: "/setup"
                })}
                className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-sm font-bold text-gray-700 shadow-sm shadow-gray-200/50 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-gray-400 bg-[#f8f9fa] px-4">
                Or continue with email
              </div>
            </div>

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
                  socialButtonsBlockButton: "!hidden",
                  socialButtonsBlockButtonArrow: "!hidden",
                  socialButtonsBlockButtonText: "!hidden",
                  socialButtonsBlockButtonIcon: "!hidden",
                  formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500 text-sm font-bold uppercase tracking-widest h-12 transition-all",
                  footerActionLink: "text-indigo-600 hover:text-indigo-500 font-black",
                  formFieldInput: "h-12 rounded-xl border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium",
                  dividerText: "text-[10px] font-black text-gray-400 uppercase tracking-widest",
                  dividerRow: "!hidden",
                  footer: "bg-gray-50/50 border-t border-gray-100 p-6 rounded-b-[32px]",
                  main: "p-6 sm:p-8 !pt-0",
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
      {/* SSO Callback Handling */}
      {isSSOCallback && (
        <div className="fixed inset-0 z-[200] bg-[#f8f9fa] flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Authenticating Social Identity...</p>
          </div>
          <AuthenticateWithRedirectCallback />
        </div>
      )}
    </div>
  );
}
