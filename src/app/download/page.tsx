"use client";

import React from 'react';
import { Download, Laptop, Shield, Zap, ArrowRight, CheckCircle2, Smartphone } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

import { useThemeToggle } from '@/hooks/useThemeToggle';

const Meteors = dynamic(() => import('@/components/magicui/meteors').then(mod => mod.Meteors), { ssr: false });

export default function DownloadPage() {
  const { plan } = useThemeToggle();
  const isPremium = plan === "pro" || plan === "elite";
  const [desktopUrl, setDesktopUrl] = React.useState<string>("https://github.com/Abhishek6827/Chintu_Releases/releases");
  const [apkUrl, setApkUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("https://api.github.com/repos/Abhishek6827/Chintu_Releases/releases")
      .then(res => res.json())
      .then((releases: any[]) => {
        if (!Array.isArray(releases)) return;
        const desktopRelease = releases.find((r: any) => r.assets?.some((a: any) => a.name.endsWith(".exe")));
        if (desktopRelease) {
          const exeAsset = desktopRelease.assets.find((a: any) => a.name.endsWith(".exe"));
          if (exeAsset) setDesktopUrl(exeAsset.browser_download_url);
        }
        const mobileRelease = releases.find((r: any) => r.assets?.some((a: any) => a.name.endsWith(".apk")));
        if (mobileRelease) {
          const apkAsset = mobileRelease.assets.find((a: any) => a.name.endsWith(".apk"));
          if (apkAsset) {
            setApkUrl(apkAsset.browser_download_url);
          }
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] selection:bg-teal-500/20 flex flex-col relative overflow-x-hidden">

      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {isPremium && <Meteors number={20} />}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/20 blur-[120px] rounded-full animate-pulse [animation-delay:700ms]" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-24">
        {/* Hero Section */}
        <motion.div
          className="max-w-4xl w-full text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full mb-8 animate-fade-in">
            <Zap className="w-3 h-3 text-teal-400 fill-current" />
            <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Official Desktop &amp; Mobile Release</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-[var(--text-main)] mb-6 uppercase leading-[0.9]">
            Take Chintu <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-500">Everywhere.</span>
          </h1>

          <p className="text-[var(--text-dim)] text-sm sm:text-lg font-bold uppercase tracking-widest max-w-2xl mx-auto leading-relaxed mb-12">
            Experience the full power of Chintu on your platform of choice. Native Windows application with protected overlay, and a powerful Android companion for on-the-go intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <a
              href={desktopUrl}
              className="group relative px-10 py-5 bg-teal-600 text-white font-black uppercase tracking-[0.2em] text-[12px] rounded-3xl shadow-2xl shadow-teal-500/40 hover:bg-teal-500 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4"
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              Download for Windows
            </a>
            <a
              href={apkUrl || "https://github.com/Abhishek6827/Chintu_Releases/releases"}
              className="group relative px-10 py-5 bg-[var(--panel-bg)] text-[var(--text-main)] border border-[var(--glass-border)] font-black uppercase tracking-[0.2em] text-[12px] rounded-3xl shadow-xl hover:border-teal-500/50 hover:bg-teal-500/10 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4"
            >
              <Smartphone className="w-5 h-5 group-hover:animate-bounce" />
              Download for Android
            </a>
          </div>
          <div className="flex items-center justify-center gap-6 text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">
            <span>Windows 10 / 11 • 64-bit</span>
            <span className="w-1 h-1 bg-[var(--text-dim)] rounded-full opacity-30" />
            <span>Android 8.0+ • APK</span>
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-32">
          {[
            { icon: <Shield />, title: "Protected Overlay", desc: "Invisible to screen-sharing and proctoring software." },
            { icon: <Laptop />, title: "Native Speed", desc: "Zero-lag processing with low memory footprint." },
            { icon: <Zap />, title: "Auto Updates", desc: "Always stay synchronized with the latest intelligence." }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
              whileHover={{ scale: 1.03, y: -4 }}
              className="bg-[var(--panel-bg)] p-10 rounded-[3rem] border border-[var(--glass-border)] shadow-xl shadow-teal-500/5 hover:shadow-2xl hover:border-teal-500/50 transition-all group text-center"
            >
              <div className="w-14 h-14 bg-teal-500/10 text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                {f.icon}
              </div>
              <h3 className="font-black uppercase tracking-widest text-[12px] mb-4 text-[var(--text-main)]">{f.title}</h3>
              <p className="text-[11px] text-[var(--text-dim)] font-bold uppercase tracking-tight leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Installation Steps */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          className="max-w-3xl w-full bg-[var(--panel-bg)] rounded-[4rem] border border-[var(--glass-border)] p-12 sm:p-20 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-[4rem] -mr-10 -mt-10" />

          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)] mb-12 uppercase">Installation Guide</h2>

          <div className="space-y-10">
            {[
              { step: "01", text: "Download the Chintu-Setup.exe file using the button above." },
              { step: "02", text: "Run the installer. If Windows SmartScreen appears, click 'More Info' then 'Run Anyway'." },
              { step: "03", text: "Login with your Chintu credentials and activate protected overlay to start your mission." }
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.2, duration: 0.5 }}
                className="flex gap-6 items-start"
              >
                <span className="text-2xl font-black text-teal-500/30 tracking-tighter">{s.step}</span>
                <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-dim)] leading-relaxed pt-1.5">{s.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-[var(--glass-border)] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Verified & Secure Build</span>
            </div>
            <a href="/support" className="text-[10px] font-black uppercase tracking-widest text-teal-500 hover:text-teal-400 flex items-center gap-2">
              Trouble Installing? <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

        {/* Mobile Installation Steps */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          className="max-w-3xl w-full bg-[var(--panel-bg)] rounded-[4rem] border border-[var(--glass-border)] p-12 sm:p-20 shadow-2xl relative overflow-hidden mt-12"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[4rem] -mr-10 -mt-10" />

          <h2 className="text-3xl font-black tracking-tight text-[var(--text-main)] mb-12 uppercase">Mobile Setup</h2>

          <div className="space-y-10">
            {[
              { step: "01", text: "Download the APK using the Android button above." },
              { step: "02", text: "Open the file. If prompted, allow 'Install from unknown sources' in settings." },
              { step: "03", text: "Install and login with your Chintu credentials to sync your plan & credits." }
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + i * 0.2, duration: 0.5 }}
                className="flex gap-6 items-start"
              >
                <span className="text-2xl font-black text-emerald-500/30 tracking-tighter">{s.step}</span>
                <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-dim)] leading-relaxed pt-1.5">{s.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-[var(--glass-border)] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Signed APK • Safe Install</span>
            </div>
            <a href="/support" className="text-[10px] font-black uppercase tracking-widest text-teal-500 hover:text-teal-400 flex items-center gap-2">
              Trouble Installing? <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </main>


    </div>
  );
}
