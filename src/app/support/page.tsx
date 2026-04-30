"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SupportPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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

  if (!isLoaded) return <div className="min-h-screen bg-[#f8f9fa]" />;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 transition-all text-sm font-bold">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="" className="w-5 h-5" />
          <span className="text-sm font-black tracking-tight">Chintu</span>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex flex-col items-center justify-center px-6 pb-16 pt-8">
        <div className="w-full max-w-md" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Title */}
          <div className="text-center mb-8">
            <span className="text-4xl mb-3 block">💬</span>
            <h1 className="text-2xl font-black tracking-tight mb-1">Contact Support</h1>
            <p className="text-gray-400 text-xs font-medium">We typically respond within 24 hours</p>
          </div>

          {sent ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center shadow-sm">
              <span className="text-4xl block mb-3">✅</span>
              <h2 className="text-lg font-black text-emerald-700 mb-2">Message Sent!</h2>
              <p className="text-emerald-600 text-sm font-medium mb-6">We&apos;ll get back to you shortly.</p>
              <button
                onClick={() => setSent(false)}
                className="text-indigo-600 text-xs font-bold hover:underline"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Billing Issue, Feature Request..."
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-300 shadow-sm"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full h-40 bg-white border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none placeholder:text-gray-300 shadow-sm"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${
                  message.trim() && !sending
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-500 active:scale-95"
                    : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                }`}
              >
                {sending ? "Sending..." : "Send Message →"}
              </button>

              {/* User info footer */}
              <p className="text-center text-[10px] text-gray-300 font-medium mt-4">
                Sending as {user?.primaryEmailAddress?.emailAddress || "Unknown"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
