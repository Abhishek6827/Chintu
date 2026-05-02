import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/', 
  '/privacy', 
  '/terms', 
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/api/webhooks/clerk(.*)',
  '/api/webhooks/stripe(.*)',
  '/api/webhooks/razorpay(.*)'
]);

export default function middleware(req: any, event: any) {
  const host = req.headers.get("host") || "";
  const isProd = host.includes("getchintu.com");

  // Dynamic Keys
  const secretKey = isProd 
    ? process.env.CLERK_SECRET_KEY 
    : process.env.CLERK_SECRET_KEY_SANDBOX;
  
  const publishableKey = isProd 
    ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY 
    : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_SANDBOX;

  return clerkMiddleware(
    async (auth, req) => {
      const { userId } = await auth();
      const url = new URL(req.url);
      
      // App-specific redirection: App users should never see the landing page
      const isElectron = req.headers.get("user-agent")?.toLowerCase().includes("electron");
      
      if (isElectron && url.pathname === "/") {
        if (userId) {
          return NextResponse.redirect(new URL("/setup", req.url));
        } else {
          return NextResponse.redirect(new URL("/sign-in", req.url));
        }
      }

      if (!isPublicRoute(req)) {
        (await auth()).protect();
      }
    },
    { secretKey, publishableKey }
  )(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
