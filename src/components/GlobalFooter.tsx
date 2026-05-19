"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Shield, Zap } from "lucide-react";
import React from "react";

/* ─── Footer link clusters (single source of truth) ───────
 * Anchor-style hrefs (e.g. /#pricing) deep-link into the
 * landing page sections that expose those id="..." anchors.
 */
type FooterLink = { label: string; href: string; external?: boolean };
type FooterCluster = { title: string; links: FooterLink[] };

const footerClusters: FooterCluster[] = [
  {
    title: "Product",
    links: [
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Features", href: "/#power-tools" },
      { label: "Mock Interview", href: "/#power-tools" },
      { label: "AI Resume Builder", href: "/#power-tools" },
      { label: "Authentic Voice", href: "/#authentic-voice" },
      { label: "Compare", href: "/#compare" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Use Cases",
    links: [
      { label: "Live Coding Interviews", href: "/#platforms" },
      { label: "System Design", href: "/#power-tools" },
      { label: "Behavioral Rounds", href: "/#authentic-voice" },
      { label: "Online Proctored Exams", href: "/#platforms" },
      { label: "MCQs & Aptitude", href: "/#power-tools" },
      { label: "Campus Placements", href: "/#hired-at" },
    ],
  },
  {
    title: "Platforms",
    links: [
      { label: "Zoom", href: "/#platforms" },
      { label: "Google Meet", href: "/#platforms" },
      { label: "Microsoft Teams", href: "/#platforms" },
      { label: "HireVue", href: "/#platforms" },
      { label: "HackerRank", href: "/#platforms" },
      { label: "LeetCode", href: "/#platforms" },
      { label: "CoderPad", href: "/#platforms" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Blog", href: "/blog" },
      { label: "About", href: "/about" },
      { label: "Download", href: "/download" },
      { label: "Support", href: "/support" },
      { label: "Creator Program", href: "/#creators" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/terms" },
      { label: "Contact", href: "mailto:contact@getchintu.com", external: true },
    ],
  },
];

/* ─── Social handles — replace href values with the team's
 * real profile URLs once they are live. */
const socialLinks: { label: string; href: string; svg: React.ReactNode }[] = [
  {
    label: "X (Twitter)",
    href: "https://twitter.com/chintuai",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/chintu-ai",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.4v1.57h.05c.48-.91 1.65-1.87 3.4-1.87 3.63 0 4.3 2.39 4.3 5.5zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/chintuai",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.95c-3.15 0-3.5.01-4.74.07-1.07.05-1.66.23-2.05.38-.51.2-.88.44-1.27.83-.39.39-.63.76-.83 1.27-.15.39-.33.97-.38 2.05-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.07.23 1.66.38 2.05.2.51.44.88.83 1.27.39.39.76.63 1.27.83.39.15.97.33 2.05.38 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.07-.05 1.66-.23 2.05-.38.51-.2.88-.44 1.27-.83.39-.39.63-.76.83-1.27.15-.39.33-.97.38-2.05.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.07-.23-1.66-.38-2.05-.2-.51-.44-.88-.83-1.27-.39-.39-.76-.63-1.27-.83-.39-.15-.97-.33-2.05-.38-1.24-.06-1.59-.07-4.74-.07zm0 3.31a4.58 4.58 0 1 1 0 9.16 4.58 4.58 0 0 1 0-9.16zm0 7.55a2.97 2.97 0 1 0 0-5.94 2.97 2.97 0 0 0 0 5.94zm5.83-7.73a1.07 1.07 0 1 1-2.14 0 1.07 1.07 0 0 1 2.14 0z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@chintuai",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.13-2.14C19.49 3.5 12 3.5 12 3.5s-7.49 0-9.37.55A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.13 2.14c1.88.55 9.37.55 9.37.55s7.49 0 9.37-.55a3.02 3.02 0 0 0 2.13-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.6 15.6V8.4l6.24 3.6z" />
      </svg>
    ),
  },
];

export default function GlobalFooter() {
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const isElectron = typeof window !== "undefined" &&
    (!!(window as any).electronAPI || navigator.userAgent.toLowerCase().includes('electron'));

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Don't show on Electron platform or on print-only pages
  if (!mounted || isElectron || pathname === '/resume-preview') return null;

  return (
    <footer
      role="contentinfo"
      aria-label="Chintu Ji site footer"
      className="bg-[var(--bg-app)] border-t border-[var(--glass-border)] pt-20 pb-10 px-6 sm:px-12 relative z-10"
    >
      <div className="max-w-7xl mx-auto">
        {/* ─── Top: Brand + Link Clusters ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand block */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" aria-label="Chintu Ji homepage" className="inline-flex items-center gap-3 mb-5 hover:opacity-90 transition-opacity">
              <Image
                src="/icon-sm.png"
                alt="Chintu Ji logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-xl font-black tracking-tighter uppercase text-[var(--text-main)] dark:text-white">
                Chintu <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-teal-500 to-cyan-400">AI</span>
              </span>
            </Link>

            <p className="text-[11px] text-[var(--text-dim)] font-bold leading-relaxed uppercase tracking-wider mb-5 max-w-xs">
              The world&rsquo;s fastest, most affordable real-time AI copilot for interviews, online exams and technical assessments. Sub-200ms. 63+ languages. Universal stealth.
            </p>

            {/* Trust mini-strip */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-[8px] font-black text-emerald-500 uppercase tracking-[0.25em]">
                <Shield className="w-2.5 h-2.5" /> 7-Day Refund
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 text-[8px] font-black text-teal-500 uppercase tracking-[0.25em]">
                <Zap className="w-2.5 h-2.5" /> &lt;200ms
              </span>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2" aria-label="Chintu Ji social profiles">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chintu Ji on ${s.label}`}
                  className="w-8 h-8 rounded-full border border-[var(--glass-border)] bg-[var(--panel-bg)] text-[var(--text-dim)] hover:text-teal-500 hover:border-teal-500/40 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                >
                  {s.svg}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Link clusters */}
          <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10">
            {footerClusters.map((cluster, ci) => (
              <motion.nav
                key={cluster.title}
                aria-label={`${cluster.title} navigation`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: ci * 0.05 }}
              >
                <h3 className="text-[10px] font-black text-[var(--text-main)] dark:text-white uppercase tracking-[0.35em] mb-5">
                  {cluster.title}
                </h3>
                <ul className="space-y-3">
                  {cluster.links.map((l) => (
                    <li key={l.label}>
                      {l.external ? (
                        <a
                          href={l.href}
                          className="text-[10px] text-[var(--text-dim)] hover:text-teal-500 font-black uppercase tracking-widest transition-colors inline-flex items-center gap-1.5"
                        >
                          {l.label === "Contact" && <Mail className="w-2.5 h-2.5" />}
                          {l.label}
                        </a>
                      ) : (
                        <Link
                          href={l.href}
                          className="text-[10px] text-[var(--text-dim)] dark:text-white/60 hover:text-teal-500 font-black uppercase tracking-widest transition-colors"
                        >
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.nav>
            ))}
          </div>
        </div>

        {/* ─── Long-form SEO copy block (good for keyword coverage) ─── */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mt-14 sm:mt-16 text-[10px] sm:text-[11px] text-[var(--text-dim)] font-medium leading-relaxed max-w-5xl"
        >
          Chintu Chintu Ji a real-time AI interview copilot built for serious candidates. Use it for live coding rounds on
          HackerRank, LeetCode, Codility and CoderPad, async video interviews on HireVue and micro1, behavioral and
          system design rounds on Zoom, Google Meet, Microsoft Teams and Webex, plus online proctored exams including
          GMAT, GRE, SAT, CAT, JEE, NEET and campus placement aptitude tests. Sub-200ms latency, 63+ languages, fully
          stealth across screen sharing and recording, with mock interview practice and an AI resume builder bundled
          on every paid plan.
        </motion.p>

        {/* ─── Bottom bar ─────────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-[var(--glass-border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[9px] text-[var(--text-dim)] font-black uppercase tracking-[0.3em] text-center sm:text-left">
            © {new Date().getFullYear()} Chintu Ji · All rights reserved · Made with focus
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="text-[9px] text-[var(--text-dim)] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              Global Status: Optimal
            </span>
            <Link href="/privacy" className="text-[9px] text-[var(--text-dim)] hover:text-teal-500 font-black uppercase tracking-[0.2em] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-[9px] text-[var(--text-dim)] hover:text-teal-500 font-black uppercase tracking-[0.2em] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
