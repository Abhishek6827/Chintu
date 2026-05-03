"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Send, MessageCircle, Clock, CheckCircle2 } from "lucide-react";

export default function SupportPage() {
  const { user, isLoaded } = useUser();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = "Support | Chintu Intelligence";
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

  if (!isLoaded) return <div className="min-h-screen bg-[#fcfdfe]" />;

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-gray-900 selection:bg-indigo-100 flex flex-col relative" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/[0.03] blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-purple-500/[0.03] blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-gray-100 px-6 py-6" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="group flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all active:scale-95"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center p-2 shadow-sm">
              <Image src="https://www.getchintu.com/icon.png" alt="" width={28} height={28} className="w-full h-full object-contain" unoptimized />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase text-gray-900">
              Chintu <span className="text-indigo-600">Support</span>
            </span>
          </div>
          
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20 pt-12">
        <div className="w-full max-w-md" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Title Area */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-indigo-500/5 shadow-xl border border-indigo-100/50">
               <MessageCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2 uppercase">How can we help?</h1>
            <div className="flex items-center justify-center gap-2 text-gray-400">
               <Clock className="w-3.5 h-3.5" />
               <p className="text-[10px] font-black uppercase tracking-widest">Active Response Grid: Under 24h</p>
            </div>
          </div>

          {sent ? (
            <div className="bg-white border border-emerald-100 rounded-[3rem] p-12 text-center shadow-2xl shadow-emerald-500/5 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight">Transmission Received</h2>
              <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed uppercase tracking-wide">Your inquiry has been deployed to our elite support team. Stand by for a response.</p>
              <button
                onClick={() => setSent(false)}
                className="px-8 py-3.5 bg-gray-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-50 transition-all active:scale-95"
              >
                Send New Message
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subject */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1">Strategy Focus</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Billing, Technical, Feedback..."
                  className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-gray-300 shadow-sm font-medium"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1">Detail Report</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full h-48 bg-white border border-gray-200 rounded-3xl p-5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none placeholder:text-gray-300 shadow-sm font-medium leading-relaxed"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className={`w-full py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
                  message.trim() && !sending
                    ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                }`}
              >
                {sending ? "Processing..." : (
                  <>
                    Deploy Message <Send className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* User info footer */}
              <div className="flex items-center justify-center gap-2 mt-6">
                 <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                 <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">
                   Identity: {user?.primaryEmailAddress?.emailAddress || "Unknown Unit"}
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
