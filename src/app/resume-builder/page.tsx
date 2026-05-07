"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { 
  ArrowLeft, Sparkles, Upload, ChevronRight, Check, 
  FileCode, Printer, Zap, Layout, FileUp, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateLaTeX } from "@/utils/latex-converter";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";

const isElectron = typeof window !== "undefined" && !!(window as any).electronAPI;

type BuilderState = "selection" | "input" | "processing" | "result";
type FlowType = "enhance" | "new";

interface ProfileData {
  name: string;
  title: string;
  summary: string;
  experience: { role: string; company: string; duration: string; highlights: string[] }[];
  projects: { name: string; description: string; tech: string[] }[];
  skills: { languages: string[]; frameworks: string[]; tools: string[]; other: string[] };
  education: { degree: string; institution: string; year: string }[];
  certifications: string[];
  achievements: string[];
}

export default function ResumeBuilderPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  
  const [state, setState] = useState<BuilderState>("selection");
  const [flow, setFlow] = useState<FlowType | null>(null);
  
  // Input states
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  // Result states
  const [tailoredProfile, setTailoredProfile] = useState<ProfileData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/resume-builder");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      setUploadError("Currently we only support .txt files for direct upload. For PDF/Docx, please copy and paste the text.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    
    try {
      const text = await file.text();
      setResumeText(text);
    } catch {
      setUploadError("Failed to read file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartTailoring = async () => {
    if (!resumeText.trim() || !jdText.trim()) {
      setError("Please provide both your resume and the job description.");
      return;
    }

    setState("processing");
    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jdText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to tailor resume");
      }

      const data = await res.json();
      setTailoredProfile(data.profile);
      setState("result");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setState("input");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTex = () => {
    if (!tailoredProfile) return;
    const tex = generateLaTeX(tailoredProfile, selectedTemplate);
    const blob = new Blob([tex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(tailoredProfile.name || 'Resume').replace(/\s+/g, '_')}_tailored.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openPdfPreview = () => {
    const previewUrl = `/resume-preview?template=${selectedTemplate}`;
    const fullUrl = `${window.location.origin}${previewUrl}`;
    if (isElectron) (window as any).electronAPI.openExternal(fullUrl);
    else window.open(previewUrl, "_blank");
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col">
      <GlobalHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Selection */}
          {state === "selection" && (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto text-center space-y-12 py-12"
            >
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                  AI Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">Architect.</span>
                </h1>
                <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest text-xs md:text-sm">
                  Choose your path to a perfect ATS-optimized resume.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Enhance Path */}
                <button
                  onClick={() => { setFlow("enhance"); setState("input"); }}
                  className="group relative p-8 bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-[2.5rem] text-left hover:border-indigo-500/50 transition-all hover:scale-[1.02] overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-24 h-24 text-indigo-500" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                      <FileUp className="w-7 h-7 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Enhance Current</h3>
                      <p className="text-xs text-[var(--text-dim)] font-medium leading-relaxed">
                        Upload your existing resume and a JD. Our AI will tailor every bullet point to match the specific role.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 pt-4">
                      Get Started <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </button>

                {/* New Path */}
                <button
                  onClick={() => { setFlow("new"); setState("input"); }}
                  className="group relative p-8 bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-[2.5rem] text-left hover:border-purple-500/50 transition-all hover:scale-[1.02] overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Layout className="w-24 h-24 text-purple-500" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                      <Zap className="w-7 h-7 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Build From Scratch</h3>
                      <p className="text-xs text-[var(--text-dim)] font-medium leading-relaxed">
                        No resume? No problem. Input your details and a JD, and we&apos;ll craft a premium resume from the ground up.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-400 pt-4">
                      Choose Templates <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Input */}
          {state === "input" && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <button 
                onClick={() => setState("selection")}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Choice
              </button>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Resume Source */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black uppercase tracking-tight">
                      {flow === "enhance" ? "1. Your Current Resume" : "1. Your Professional Info"}
                    </h2>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">
                      <Zap className="w-2.5 h-2.5 inline mr-1" /> Fastest via Paste
                    </span>
                  </div>
                  
                  <div className="bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-3xl p-6 space-y-4">
                    <textarea 
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder={flow === "enhance" ? "Paste your current resume content here..." : "Describe your experience, skills, and projects in plain text. AI will structure it."}
                      className="w-full h-80 bg-[var(--bg-app)] border border-[var(--glass-border)] rounded-2xl p-5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none font-medium placeholder:text-[var(--text-dim)]/50"
                    />
                    
                    {flow === "enhance" && (
                      <div className="pt-4 border-t border-[var(--glass-border)]">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">Or Upload File (.txt only)</p>
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".txt"
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--glass-bg)]/80 transition-all active:scale-95"
                          >
                            <Upload className="w-3.5 h-3.5" /> {isUploading ? "Reading..." : "Upload TXT"}
                          </button>
                        </div>
                        {uploadError && <p className="text-red-400 text-[10px] mt-2 font-bold uppercase">{uploadError}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* JD Source */}
                <div className="space-y-4">
                  <h2 className="text-xl font-black uppercase tracking-tight">2. Target Job Description</h2>
                  <div className="bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-3xl p-6">
                    <textarea 
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      placeholder="Paste the Job Description (JD) you are targeting. AI will optimize your resume for these specific requirements."
                      className="w-full h-80 bg-[var(--bg-app)] border border-[var(--glass-border)] rounded-2xl p-5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-none font-medium placeholder:text-[var(--text-dim)]/50"
                    />
                    
                    <div className="mt-6">
                      <button 
                        onClick={handleStartTailoring}
                        disabled={!resumeText.trim() || !jdText.trim() || isProcessing}
                        className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                          resumeText.trim() && jdText.trim() && !isProcessing
                            ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.01]"
                            : "bg-[var(--glass-bg)] text-[var(--text-dim)] cursor-not-allowed opacity-50"
                        }`}
                      >
                        {isProcessing ? "✨ Engineering Tailored Resume..." : <>✨ Build Tailored Resume <ArrowRight className="w-4 h-4" /></>}
                      </button>
                      {error && <p className="text-red-400 text-center text-[10px] mt-4 font-bold uppercase">{error}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Processing */}
          {state === "processing" && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 space-y-8"
            >
              <div className="relative flex items-center justify-center w-40 h-40">
                <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/30 animate-[spin_3s_linear_infinite]"></div>
                <div className="absolute inset-2 rounded-full border-[3px] border-t-purple-500 border-purple-500/20 animate-[spin_1.5s_ease-in-out_infinite_reverse]"></div>
                <div className="absolute inset-4 rounded-full border-[3px] border-b-cyan-500 border-cyan-500/20 animate-[spin_2s_linear_infinite]"></div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl animate-pulse">
                  📄
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 animate-pulse">
                  AI is Tailoring Your Success...
                </h2>
                <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">
                  Aligning keywords • Optimizing impact • Engineering precision
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Result */}
          {state === "result" && tailoredProfile && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8"
            >
              {/* Left: Template & Preview Controls */}
              <div className="lg:col-span-4 space-y-8">
                <div className="space-y-4">
                  <button 
                    onClick={() => setState("input")}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Editor
                  </button>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Select Template</h2>
                </div>

                <div className="space-y-4">
                  {[
                    { id: "modern", name: "Modern Elite", desc: "Clean, sans-serif, high-impact." },
                    { id: "classic", name: "Classic Executive", desc: "Serif, professional, traditional." },
                    { id: "minimal", name: "Minimalist Pro", desc: "Whitespace-focused, sleek, ultra-clean." }
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`w-full p-6 text-left rounded-3xl border transition-all ${
                        selectedTemplate === tpl.id 
                          ? "bg-indigo-600/10 border-indigo-600/50 shadow-lg shadow-indigo-600/10" 
                          : "bg-[var(--panel-bg)] border-[var(--glass-border)] hover:border-indigo-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black uppercase tracking-tight">{tpl.name}</span>
                        {selectedTemplate === tpl.id && <Check className="w-4 h-4 text-indigo-500" />}
                      </div>
                      <p className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-widest">{tpl.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="pt-8 border-t border-[var(--glass-border)] space-y-4">
                  <p className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">Export & Download</p>
                  
                  {isElectron ? (
                    <div className="grid gap-3">
                      <button 
                        onClick={downloadTex}
                        className="flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                      >
                        <FileCode className="w-4 h-4" /> Download .TEX
                      </button>
                      <button 
                        onClick={openPdfPreview}
                        className="flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                      >
                        <Printer className="w-4 h-4" /> Download PDF
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-relaxed">
                        Downloads are only available in the Chintu Desktop App.
                      </p>
                    </div>
                  )}
                  <p className="text-[8px] font-bold text-[var(--text-dim)] opacity-50 uppercase tracking-widest text-center px-4 leading-relaxed">
                    PDF is generated via LaTeX for maximum ATS compatibility.
                  </p>
                </div>
              </div>

              {/* Right: Live Preview */}
              <div className="lg:col-span-8">
                <div className="sticky top-24 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Live Interactive Preview</p>
                    <span className="text-[8px] font-black text-[var(--text-dim)] uppercase tracking-widest">A4 Layout • Optimized</span>
                  </div>
                  
                  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden aspect-[1/1.41] overflow-y-auto custom-scrollbar">
                    {/* Simplified Web Preview */}
                    <div className={`p-12 text-black space-y-6 ${selectedTemplate === 'classic' ? 'font-serif' : 'font-sans'}`}>
                      <div className="text-center space-y-2">
                        <h1 className={`text-3xl font-black uppercase tracking-tight ${selectedTemplate === 'minimal' ? 'text-left' : ''}`}>
                          {tailoredProfile.name}
                        </h1>
                        <p className={`text-sm font-bold text-gray-500 uppercase tracking-widest ${selectedTemplate === 'minimal' ? 'text-left border-b pb-4' : ''}`}>
                          {tailoredProfile.title}
                        </p>
                      </div>

                      <div className="space-y-4 pt-4">
                        <h2 className="text-xs font-black uppercase tracking-widest border-b pb-1">Professional Summary</h2>
                        <p className="text-xs leading-relaxed font-medium text-gray-700">
                          {tailoredProfile.summary}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest border-b pb-1">Experience</h2>
                        {tailoredProfile.experience.map((exp, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <p className="text-xs font-bold">{exp.role} @ {exp.company}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">{exp.duration}</p>
                            </div>
                            <ul className="list-disc pl-4 space-y-1">
                              {exp.highlights.map((h, j) => (
                                <li key={j} className="text-[10px] text-gray-600 leading-relaxed">{h}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest border-b pb-1">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                          {[
                            ...tailoredProfile.skills.languages,
                            ...tailoredProfile.skills.frameworks,
                            ...tailoredProfile.skills.tools,
                            ...tailoredProfile.skills.other
                          ].map((s, i) => (
                            <span key={i} className="text-[9px] bg-gray-100 px-2 py-1 rounded-md font-bold uppercase tracking-tight">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <GlobalFooter />
    </div>
  );
}
