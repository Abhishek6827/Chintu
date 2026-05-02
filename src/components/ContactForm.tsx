"use client";

import React, { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';

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
      <div className="bg-white/50 backdrop-blur-xl border border-indigo-100 p-12 rounded-[3rem] text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">Message Transmitted</h3>
        <p className="text-sm text-gray-500 font-bold uppercase tracking-wide">Our intelligence team will respond shortly.</p>
        <button 
          onClick={() => setStatus('idle')}
          className="mt-8 text-indigo-600 font-black uppercase tracking-widest text-[10px] hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Full Name</label>
          <input 
            required
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ghost User" 
            className="w-full bg-white border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Email Address</label>
          <input 
            required
            type="email" 
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@getchintu.com" 
            className="w-full bg-white border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Message</label>
        <textarea 
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="How can we help your interview strategy?" 
          className="w-full bg-white border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
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
        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center mt-2">
          Transmission Failed. Please try again.
        </p>
      )}
    </form>
  );
}
