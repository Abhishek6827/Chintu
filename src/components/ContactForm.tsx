"use client";

import React, { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmationMessage from '@/components/animata/feature-cards/confirmation-message';

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.name,
          userEmail: formData.email,
          message: formData.message,
          subject: "Landing Page Contact"
        }),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error("ContactForm: Submission failed", err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
      >
        <ConfirmationMessage
          successMessage="Message Transmitted"
          labelName="Chintu Ji"
          labelMessage="Our elite support team will respond within 24 hours. Stand by."
          icon={<CheckCircle2 className="w-8 h-8 text-white" />}
          containerClassName="mb-6"
        />
        <div className="text-center">
          <button
            onClick={() => setStatus('idle')}
            className="px-8 py-3.5 bg-[var(--panel-bg)] text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-[var(--glass-border)] hover:border-indigo-500/50 transition-all active:scale-95"
          >
            Send another message
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] ml-4">Full Name</label>
          <input
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Protected User"
            className="w-full bg-[var(--bg-app)] border border-[var(--glass-border)] px-6 py-4 rounded-2xl text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] ml-4">Email Address</label>
          <input
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@getchintu.com"
            className="w-full bg-[var(--bg-app)] border border-[var(--glass-border)] px-6 py-4 rounded-2xl text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-dim)] ml-4">Message</label>
        <textarea
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="How can we help your interview strategy?"
          className="w-full bg-[var(--bg-app)] border border-[var(--glass-border)] px-6 py-4 rounded-2xl text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[11px] py-5 rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Initiate Contact
            <Send className="w-3.5 h-3.5" />
          </>
        )}
      </button>
      {status === 'error' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center mt-2"
        >
          Transmission Failed. Please try again.
        </motion.p>
      )}
    </motion.form>
  );
}
