"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Send, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Meteors } from "@/components/magicui/meteors";
import ConfirmationMessage from "@/components/animata/feature-cards/confirmation-message";

export default function SupportPage() {
  const { user, isLoaded } = useUser();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = "Support | Chintu Ji";
  }, []);

  const handleSubmit = async () => {
    if (!message.trim() || !user) return;
    setSending(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim() || "General Inquiry",
          message: message.trim(),
          userEmail: user.primaryEmailAddress?.emailAddress || "unknown",
          userId: user.id,
          userName: user.fullName || user.username || "Anonymous",
        }),
      });

      if (res.ok) {
        setSent(true);
        setSubject("");
        setMessage("");
      } else {
        alert("Failed to send. Please try again.");
      }
    } catch {
      alert("Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-[var(--bg-app)]" />;

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] selection:bg-indigo-500/20 flex flex-col relative overflow-x-hidden" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <Meteors number={12} />
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/[0.05] blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-purple-500/[0.05] blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>


      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-16 sm:pb-20 pt-8 sm:pt-12">
        <div className="w-full max-w-md" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Title Area */}
          <motion.div
            className="text-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-indigo-500/5 shadow-xl border border-indigo-500/20">
              <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-main)] mb-2 uppercase px-2">How can we help?</h1>
            <div className="flex items-center justify-center gap-2 text-[var(--text-dim)]">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Active Response Grid: Under 24h</p>
            </div>
          </motion.div>

          {sent ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
            >
              <ConfirmationMessage
                successMessage="Transmission Received"
                labelName="Chintu Support"
                labelMessage="Your inquiry has been deployed to our elite support team. Stand by for a response within 24 hours."
                icon={<CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
                containerClassName="mb-4 sm:mb-6"
              />
              <div className="text-center">
                <button
                  onClick={() => setSent(false)}
                  className="px-6 sm:px-8 py-3 sm:py-3.5 bg-[var(--panel-bg)] text-indigo-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] rounded-xl sm:rounded-2xl border border-[var(--glass-border)] hover:border-indigo-500/50 transition-all active:scale-95"
                >
                  Send New Message
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-4 sm:space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {/* Subject */}
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Strategy Focus</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Billing, Technical, Feedback..."
                  className="w-full bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-[var(--text-dim)] shadow-sm font-medium text-[var(--text-main)]"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1">Detail Report</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full h-36 sm:h-48 bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-xs sm:text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none placeholder:text-[var(--text-dim)] shadow-sm font-medium leading-relaxed text-[var(--text-main)]"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className={`w-full py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] text-[11px] sm:text-[12px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] transition-all flex items-center justify-center gap-2 sm:gap-3 ${message.trim() && !sending
                    ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95"
                    : "bg-[var(--panel-bg)] text-[var(--text-dim)] border border-[var(--glass-border)] cursor-not-allowed"
                  }`}
              >
                {sending ? "Processing..." : (
                  <>
                    Deploy Message <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </>
                )}
              </button>

              {/* User info footer */}
              <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[8px] sm:text-[9px] text-[var(--text-dim)] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                  Identity: {user?.primaryEmailAddress?.emailAddress || "Unknown Unit"}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
