"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Info, ChevronDown, Sparkles, Cpu, Clock, RotateCcw } from "lucide-react";
import AIProcessing from "./AIProcessing";
import { VideoText } from "./magicui/video-text";

interface AnswerEntry {
  id: string;
  question: string;
  answer: string;
  isStreaming: boolean;
  mode?: string;
  model?: string;
  startTime?: number;
  timeTaken?: number;
}

interface AnswerDisplayProps {
  answers: AnswerEntry[];
  fontSize?: number;
  isLightMode?: boolean;
  onUndo?: (id: string, question: string) => void;
  showReadingGuide?: boolean;
  userPlan?: string;
}

const parseAnswer = (text: string) => {
  const thinkMatch = text.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
  if (!thinkMatch) return { think: null, main: text, isThinking: false };
  
  const think = thinkMatch[1].trim();
  const main = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/, "").trim();
  const isThinking = text.includes('<think>') && !text.includes('</think>');
  
  return { think, main, isThinking };
};

export default function AnswerDisplay({ answers, fontSize = 14, isLightMode = false, onUndo, showReadingGuide = false, userPlan = "free" }: AnswerDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getSafeModelName = (modelId: string) => {
    if (!modelId) return "";
    
    const id = modelId.toLowerCase();
    
    // Check if it's a vision-augmented response (Scout)
    const isScout = id.includes("scout") || id.includes("vision-preview");
    let baseModel = id;
    
    if (id.includes("+")) {
      baseModel = id.split("+").pop()?.trim() || "";
    }

    const mapping: Record<string, string> = {
      "llama-3.3-70b": "Standard Engine",
      "gpt-oss-120b": "Pro Engine",
      "qwen3-coder": "Coding Specialist",
      "nemotron-3": "Titan Engine",
      "qwen3.6": "Turbo Engine",
      "scout": "Vision Engine",
      "llama-4": "Vision Engine"
    };

    // Find the closest match in our safe names
    const safeName = Object.entries(mapping).find(([key]) => baseModel.includes(key))?.[1];
    
    if (isScout) {
      return safeName ? `SCOUT + ${safeName}` : "SCOUT ENGINE";
    }
    
    return safeName || "NEURAL SYNC";
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (answers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-dim)]">
        <div 
          className="rounded-2xl sm:rounded-[2.5rem] bg-[var(--input-bg)] border border-[var(--glass-border)] flex items-center justify-center transition-all duration-300 shadow-2xl"
          style={{ 
            width: 'clamp(40px, 12vh, 120px)', 
            height: 'clamp(40px, 12vh, 120px)',
            marginBottom: 'clamp(8px, 3vh, 32px)'
          }}
        >
            <Sparkles 
              style={{ 
                width: 'clamp(20px, 6vh, 60px)', 
                height: 'clamp(20px, 6vh, 60px)' 
              }} 
              className="opacity-20" 
            />
        </div>
        <div 
          className="font-black uppercase mb-3 text-center px-4"
        >
          {userPlan === "elite" ? (
            <div className="w-[380px] h-[120px] rounded-[2rem] overflow-hidden shadow-2xl border border-indigo-500/30 relative flex items-center justify-center">
              <VideoText 
                src="https://cdn.magicui.design/ocean-small.webm"
                className="h-full w-full"
              >
                <div className="water-text-wrapper" style={{ scale: '1.4', letterSpacing: '0.2em' }}>
                  <div className="water-text-content">
                    <span className="water-text-bg">ELITE PROTOCOL ACTIVE</span>
                    <span className="water-text-fill">ELITE PROTOCOL ACTIVE</span>
                    <span className="water-text-fill-secondary">ELITE PROTOCOL ACTIVE</span>
                  </div>
                </div>
              </VideoText>
            </div>
          ) : userPlan !== "free" ? (
            <div className="water-text-wrapper" style={{ fontSize: 'clamp(10px, 2.2vh, 18px)', letterSpacing: '0.4em' }}>
              <div className="water-text-content">
                <span className="water-text-bg">{userPlan} Plan Active</span>
                <span className="water-text-fill">{userPlan} Plan Active</span>
                <span className="water-text-fill-secondary">{userPlan} Plan Active</span>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 'clamp(10px, 2.5vh, 20px)', letterSpacing: '0.4em' }} className="text-[var(--text-main)] opacity-40">Chintu is Ready</span>
          )}
        </div>
        <p 
          style={{ 
            fontSize: 'clamp(7px, 1.5vh, 12px)'
          }} 
          className="font-bold uppercase tracking-widest opacity-40 italic text-center px-4"
        >
          Hold Space to initiate synthesis
        </p>
      </div>
    );
  }

  return (
    <div 
      className="pb-12"
      style={{ 
        gap: 'clamp(20px, 5vh, 40px)', 
        display: 'flex', 
        flexDirection: 'column',
        paddingLeft: 'clamp(8px, 3vw, 24px)',
        paddingRight: 'clamp(8px, 3vw, 24px)'
      }}
    >
      {answers.map((entry, idx) => (
        <div key={entry.id} className="animate-fade-in relative group">
          
          {/* Question bubble - Elegant Minimalist */}
          <div className="flex justify-end items-center gap-2 mb-4 group/q">
            {onUndo && (
              <button
                onClick={() => onUndo(entry.id, entry.question)}
                className="opacity-0 group-hover/q:opacity-100 p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--glass-border)] text-[var(--text-dim)] hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                title="Rollback and Edit"
              >
                <RotateCcw style={{ width: 'clamp(12px, 1.8vh, 16px)', height: 'clamp(12px, 1.8vh, 16px)' }} />
              </button>
            )}
            <div 
              className="max-w-[85%] bg-[var(--bubble-bg)] border border-[var(--glass-border)] rounded-2xl backdrop-blur-md shadow-xl"
              style={{ 
                padding: 'clamp(12px, 2vh, 20px) clamp(16px, 3vw, 24px)' 
              }}
            >
              <p style={{ fontSize: `calc(${Math.max(10, fontSize - 1) / 14} * 1rem)` }} className="text-[var(--text-main)] opacity-100 leading-relaxed font-bold">
                {entry.question}
              </p>
            </div>
          </div>

          {/* Answer Area */}
          <div className="flex justify-start">
            <div className={`w-full max-w-[95%] relative transition-opacity duration-500 ${entry.isStreaming && idx === 0 ? "opacity-100" : "opacity-90"}`}>
              
              {/* Header Info */}
              <div className="flex items-center gap-2 mb-3 ml-2">
                <div 
                  className="rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center"
                  style={{ width: 'clamp(18px, 3vh, 28px)', height: 'clamp(18px, 3vh, 28px)' }}
                >
                  <Sparkles style={{ width: 'clamp(10px, 1.8vh, 16px)', height: 'clamp(10px, 1.8vh, 16px)' }} className="text-indigo-400" />
                </div>
                <span style={{ fontSize: 'clamp(6px, 1.5vw, 10px)' }} className="font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">Chintu Response</span>
              </div>

              {/* Main Content Bubble */}
              <div 
                className="bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-[2.5rem] backdrop-blur-3xl shadow-2xl shadow-black/10 relative overflow-hidden"
                style={{ 
                  padding: 'clamp(16px, 4vh, 32px) clamp(16px, 4vw, 32px)' 
                }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500/50 via-purple-500/20 to-transparent" />
                
                <div className={`markdown-answer ${showReadingGuide && idx === answers.length - 1 ? 'reading-guide-active' : ''}`} style={{ fontSize: `clamp(9px, calc(${fontSize / 14} * 1rem), 20px)` }}>
                  {(() => {
                    if (entry.isStreaming && !entry.answer) {
                      return (
                        <div className="py-2">
                          <AIProcessing />
                        </div>
                      );
                    }
                    const { think, main, isThinking } = parseAnswer(entry.answer);
                    return (
                      <>
                        {think && (
                          <div className="mb-6 overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--panel-bg)]">
                            <details className="group" open={isThinking}>
                              <summary 
                                className="cursor-pointer bg-[var(--glass-bg)] text-indigo-300 font-black uppercase tracking-[0.3em] hover:bg-[var(--input-bg)] transition-all flex items-center gap-4 select-none"
                                style={{ 
                                  padding: 'clamp(10px, 2vh, 16px) clamp(12px, 2.5vw, 20px)',
                                  fontSize: 'clamp(8px, 1.2vh, 10px)'
                                }}
                              >
                                <Info style={{ width: 'clamp(12px, 1.8vh, 18px)', height: 'clamp(12px, 1.8vh, 18px)' }} />
                                {isThinking ? "Recursive Reasoning..." : "Thinking Process"}
                                <ChevronDown style={{ width: 'clamp(12px, 1.8vh, 18px)', height: 'clamp(12px, 1.8vh, 18px)' }} className="ml-auto group-open:rotate-180 transition-transform" />
                              </summary>
                              <div 
                                className="text-[var(--text-dim)] whitespace-pre-wrap border-t border-[var(--glass-border)] font-mono leading-relaxed italic opacity-80"
                                style={{ 
                                  padding: 'clamp(12px, 3vh, 24px)',
                                  fontSize: 'clamp(10px, 1.4vh, 12px)'
                                }}
                              >
                                {think}
                              </div>
                            </details>
                          </div>
                        )}
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code(props: any) {
                              const { children, className, ...rest } = props;
                              const match = /language-(\w+)/.exec(className || "");
                              const isBlock = match || String(children).includes("\n");
                              const language = match ? match[1] : "javascript";

                              return isBlock ? (
                                <div className="relative my-8 rounded-3xl overflow-hidden border border-[var(--glass-border)] shadow-2xl bg-[var(--panel-bg)] group/code">
                                  <div className="bg-[var(--glass-bg)] px-6 py-3 border-b border-[var(--glass-border)] flex justify-between items-center">
                                    <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-widest">{language}</span>
                                    <button 
                                      onClick={() => handleCopy(entry.id + "-code", String(children))}
                                      className="text-[var(--text-dim)] hover:text-[var(--text-main)] transition-colors"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <SyntaxHighlighter
                                    style={(isLightMode ? oneLight : vscDarkPlus) as any}
                                    language={language}
                                    PreTag="div"
                                    customStyle={{
                                      margin: 0,
                                      background: "transparent",
                                      padding: "clamp(12px, 3vh, 24px)",
                                      fontSize: `clamp(9px, calc(${Math.max(10, fontSize - 2) / 14} * 1rem), 16px)`,
                                      lineHeight: "1.5"
                                    }}
                                    {...rest}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code
                                  className={`${className || ""} ${isLightMode ? "text-indigo-700 bg-indigo-50" : "text-indigo-300 bg-[var(--glass-bg)]"} px-2 py-0.5 rounded-md font-mono border border-[var(--glass-border)]`}
                                  style={{ fontSize: `calc(${Math.max(10, fontSize - 1) / 14} * 1rem)` }}
                                  {...rest}
                                >
                                  {children}
                                </code>
                              );
                            },
                            p({ children }) {
                              return <p className="mb-5 last:mb-0 leading-relaxed text-[var(--text-main)] font-semibold opacity-100">{children}</p>;
                            },
                            strong({ children }) {
                              return <strong className="font-black text-[var(--text-main)]">{children}</strong>;
                            },
                            ul({ children }) {
                              return <ul className="list-disc list-outside ml-7 mb-6 space-y-3 text-[var(--text-dim)]">{children}</ul>;
                            },
                            li({ children }) {
                              return <li className="pl-2 leading-relaxed text-[var(--text-main)] font-semibold opacity-100">{children}</li>;
                            },
                            hr() {
                              return <hr className="border-[var(--glass-border)] my-8" />;
                            },
                            table({ children }) {
                              return (
                                <div className={`overflow-x-auto my-8 rounded-[2rem] border border-[var(--glass-border)] shadow-xl ${isLightMode ? 'bg-white' : 'bg-black/20'}`}>
                                  <table className="w-full text-left border-collapse min-w-[500px]">
                                    {children}
                                  </table>
                                </div>
                              );
                            },
                            thead({ children }) {
                              return <thead className={`${isLightMode ? 'bg-indigo-50/50 text-indigo-700' : 'bg-[var(--glass-bg)] text-indigo-400'} font-black uppercase tracking-widest border-b border-[var(--glass-border)] text-[10px]`}>{children}</thead>;
                            },
                            th({ children }) {
                              return <th className="px-6 py-4 font-black">{children}</th>;
                            },
                            td({ children }) {
                              return <td className={`px-6 py-4 text-sm border-b border-[var(--glass-border)] transition-colors ${isLightMode ? 'text-gray-700 font-medium' : 'text-[var(--text-dim)] opacity-90'}`}>{children}</td>;
                            },
                          }}
                        >
                          {main}
                        </ReactMarkdown>
                        {entry.isStreaming && !isThinking && (
                          <span className="inline-block w-2.5 h-5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] ml-2 animate-pulse rounded-sm" />
                        )}
                      </>
                    );
                  })()}
                </div>
                
                {/* Footer Actions */}
                <div 
                  className="flex items-center justify-between gap-4 border-t border-[var(--glass-border)]"
                  style={{ 
                    marginTop: 'clamp(16px, 4vh, 32px)',
                    paddingTop: 'clamp(12px, 3vh, 24px)'
                  }}
                >
                  <div className="flex gap-2">
                    {entry.model && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--glass-border)]">
                        <Cpu style={{ width: 'clamp(10px, 1.4vh, 12px)', height: 'clamp(10px, 1.4vh, 12px)' }} className="text-indigo-400" />
                        <span style={{ fontSize: 'clamp(7px, 1vh, 9px)' }} className="font-black text-[var(--text-dim)] uppercase tracking-[0.2em]">{getSafeModelName(entry.model)}</span>
                      </div>
                    )}
                    {entry.timeTaken !== undefined && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--input-bg)] border border-[var(--glass-border)]">
                        <Clock style={{ width: 'clamp(10px, 1.4vh, 12px)', height: 'clamp(10px, 1.4vh, 12px)' }} className="text-[var(--text-dim)]" />
                        <span style={{ fontSize: 'clamp(7px, 1vh, 9px)' }} className="font-black text-[var(--text-dim)] uppercase tracking-widest">{entry.timeTaken.toFixed(1)}s</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(entry.id, entry.answer)}
                      className="flex items-center gap-2 font-black tracking-[0.2em] uppercase rounded-2xl transition-all duration-300 border bg-[var(--input-bg)] hover:bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-dim)] hover:text-[var(--text-main)]"
                      style={{ 
                        padding: 'clamp(8px, 1.5vh, 12px) clamp(12px, 2vw, 20px)',
                        fontSize: 'clamp(8px, 1.2vh, 10px)'
                      }}
                    >
                      {copiedId === entry.id ? (
                        <>
                          <Check style={{ width: 'clamp(12px, 1.8vh, 16px)', height: 'clamp(12px, 1.8vh, 16px)' }} className="text-emerald-400" />
                          <span className="text-emerald-400">Archived</span>
                        </>
                      ) : (
                        <>
                          <Copy style={{ width: 'clamp(12px, 1.8vh, 16px)', height: 'clamp(12px, 1.8vh, 16px)' }} />
                          <span>Extract</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
