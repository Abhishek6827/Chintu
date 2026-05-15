import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/privacy',
  '/terms',
  '/about',
  '/blog',
  '/faq',
  '/download',
  '/support',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk(.*)',
  '/api/webhooks/stripe(.*)',
  '/api/webhooks/razorpay(.*)'
]);

// Origins allowed to call /api/* cross-origin (Chintu-Mobile web + APK).
const ALLOWED_ORIGINS = [
  'https://mobile.getchintu.com',
  'https://chintu-mobile.vercel.app',
  'https://www.getchintu.com',
  'https://chintu-phi.vercel.app',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost:3000',
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  const origin = req.headers.get('origin');
  const isApiRoute = url.pathname.startsWith('/api/');

  // Short-circuit CORS preflight for /api/* — no auth check, just headers.
  if (isApiRoute && req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
  }

  const { userId } = await auth();

  // App-specific redirection: App users should never see the landing page
  const isElectron = req.headers.get("user-agent")?.toLowerCase().includes("electron");

  if (isElectron && url.pathname === "/") {
    if (userId) {
      return NextResponse.redirect(new URL("/setup", req.url));
    } else {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  // Web users (non-Electron) should never see app-only routes — redirect at the
  // edge so they don't wait for the heavy client bundle to load just to bounce.
  // (Same behavior as the in-page useEffect router.push, but instant.)
  if (!isElectron && !isApiRoute) {
    const APP_ONLY_ROUTES = ["/setup", "/room", "/subscription"];
    if (APP_ONLY_ROUTES.includes(url.pathname)) {
      return NextResponse.redirect(new URL("/download", req.url));
    }
  }

  if (!isPublicRoute(req) && !userId) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: buildCorsHeaders(origin) }
      );
    }
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // Attach CORS headers to /api/* responses so cross-origin clients
  // (Chintu-Mobile web + APK) can read the body.
  if (isApiRoute) {
    const res = NextResponse.next();
    const corsHeaders = buildCorsHeaders(origin);
    for (const [k, v] of Object.entries(corsHeaders)) {
      res.headers.set(k, v);
    }
    return res;
  }
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next|about|blog|faq|download|support|privacy|terms).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
