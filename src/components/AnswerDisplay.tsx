"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, Info, ChevronDown, Sparkles, Cpu, Clock } from "lucide-react";

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
}

const parseAnswer = (text: string) => {
  const thinkMatch = text.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
  if (!thinkMatch) return { think: null, main: text, isThinking: false };
  
  const think = thinkMatch[1].trim();
  const main = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/, "").trim();
  const isThinking = text.includes('<think>') && !text.includes('</think>');
  
  return { think, main, isThinking };
};

export default function AnswerDisplay({ answers, fontSize = 14 }: AnswerDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (answers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-2 text-[var(--text-dim)]">
        <div className="w-10 h-10 sm:w-20 sm:h-20 rounded-xl sm:rounded-[2rem] bg-[var(--input-bg)] border border-[var(--glass-border)] flex items-center justify-center mb-2 sm:mb-6">
            <Sparkles className="w-5 h-5 sm:w-10 sm:h-10 opacity-20" />
        </div>
        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] mb-0.5 sm:mb-2 text-[var(--text-main)] text-center px-4">Neural Link Ready</p>
        <p className="text-[7px] sm:text-[9px] font-bold uppercase tracking-widest opacity-40 italic text-center px-4">Hold Space to initiate synthesis</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 px-4 pb-12">
      {answers.map((entry, idx) => (
        <div key={entry.id} className="animate-fade-in relative group">
          
          {/* Question bubble - Elegant Minimalist */}
          <div className="flex justify-end mb-5">
            <div className="max-w-[80%] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl px-6 py-4 backdrop-blur-md shadow-xl">
              <p style={{ fontSize: `calc(${Math.max(10, fontSize - 1) / 14} * 1rem)` }} className="text-[var(--text-main)] opacity-80 leading-relaxed font-medium">
                {entry.question}
              </p>
            </div>
          </div>

          {/* Answer Area */}
          <div className="flex justify-start">
            <div className={`w-full max-w-[95%] relative transition-opacity duration-500 ${entry.isStreaming && idx === 0 ? "opacity-100" : "opacity-90"}`}>
              
              {/* Header Info */}
              <div className="flex items-center gap-3 mb-3 ml-2">
                <div className="w-6 h-6 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[10px] font-black text-[var(--text-dim)] uppercase tracking-[0.3em]">Neural Response</span>
              </div>

              {/* Main Content Bubble */}
              <div className="bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-[2.5rem] px-4 py-6 sm:p-8 backdrop-blur-3xl shadow-2xl shadow-black/10 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500/50 via-purple-500/20 to-transparent" />
                
                <div className="markdown-answer" style={{ fontSize: `calc(${fontSize / 14} * 1rem)` }}>
                  {(() => {
                    if (entry.isStreaming && !entry.answer) {
                      return (
                        <div className="flex items-center gap-3 py-6">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                          </div>
                          <span className="text-indigo-400 opacity-60 font-black text-[10px] uppercase tracking-[0.4em] ml-3">Synthesizing Logic...</span>
                        </div>
                      );
                    }
                    const { think, main, isThinking } = parseAnswer(entry.answer);
                    return (
                      <>
                        {think && (
                          <div className="mb-8 overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--panel-bg)]">
                            <details className="group" open={isThinking}>
                              <summary className="cursor-pointer px-5 py-4 bg-[var(--glass-bg)] text-indigo-300 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[var(--input-bg)] transition-all flex items-center gap-4 select-none">
                                <Info className="w-4 h-4" />
                                {isThinking ? "Recursive Reasoning..." : "Neural Chain Protocol"}
                                <ChevronDown className="w-4 h-4 ml-auto group-open:rotate-180 transition-transform" />
                              </summary>
                              <div className="p-6 text-[var(--text-dim)] whitespace-pre-wrap border-t border-[var(--glass-border)] font-mono text-[12px] leading-relaxed italic opacity-80">
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
                                <div className="relative my-8 rounded-3xl overflow-hidden border border-[var(--glass-border)] shadow-2xl bg-black/40 group/code">
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
                                    style={vscDarkPlus as any}
                                    language={language}
                                    PreTag="div"
                                    customStyle={{
                                      margin: 0,
                                      background: "transparent",
                                      padding: "24px",
                                      fontSize: `calc(${Math.max(10, fontSize - 2) / 14} * 1rem)`,
                                    }}
                                    {...rest}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code
                                  className={`${className || ""} bg-[var(--glass-bg)] text-indigo-300 px-2 py-0.5 rounded-md font-mono border border-[var(--glass-border)]`}
                                  style={{ fontSize: `calc(${Math.max(10, fontSize - 1) / 14} * 1rem)` }}
                                  {...rest}
                                >
                                  {children}
                                </code>
                              );
                            },
                            p({ children }) {
                              return <p className="mb-5 last:mb-0 leading-relaxed text-[var(--text-main)] opacity-90">{children}</p>;
                            },
                            strong({ children }) {
                              return <strong className="font-black text-[var(--text-main)]">{children}</strong>;
                            },
                            ul({ children }) {
                              return <ul className="list-disc list-outside ml-7 mb-6 space-y-3 text-[var(--text-dim)]">{children}</ul>;
                            },
                            li({ children }) {
                              return <li className="pl-2 leading-relaxed text-[var(--text-main)]">{children}</li>;
                            },
                            hr() {
                              return <hr className="border-[var(--glass-border)] my-8" />;
                            },
                            table({ children }) {
                              return (
                                <div className="overflow-x-auto my-8 rounded-3xl border border-[var(--glass-border)] shadow-2xl bg-black/20">
                                  <table className="min-w-full text-left border-collapse text-[13px]">
                                    {children}
                                  </table>
                                </div>
                              );
                            },
                            thead({ children }) {
                              return <thead className="bg-[var(--glass-bg)] text-indigo-400 font-black uppercase tracking-widest border-b border-[var(--glass-border)]">{children}</thead>;
                            },
                            th({ children }) {
                              return <th className="px-6 py-4">{children}</th>;
                            },
                            td({ children }) {
                              return <td className="px-6 py-4 text-[var(--text-dim)] border-b border-[var(--glass-border)] opacity-80">{children}</td>;
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
                <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--glass-border)] pt-6">
                  <div className="flex gap-2.5">
                    {entry.model && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--glass-border)]">
                        <Cpu className="w-3 h-3 text-indigo-400" />
                        <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-[0.2em]">{entry.model}</span>
                      </div>
                    )}
                    {entry.timeTaken !== undefined && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--input-bg)] border border-[var(--glass-border)]">
                        <Clock className="w-3 h-3 text-[var(--text-dim)]" />
                        <span className="text-[9px] font-black text-[var(--text-dim)] uppercase tracking-widest">{entry.timeTaken.toFixed(1)}s</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopy(entry.id, entry.answer)}
                    className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase px-5 py-2.5 rounded-2xl transition-all duration-300 border bg-[var(--input-bg)] hover:bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-dim)] hover:text-[var(--text-main)]"
                  >
                    {copiedId === entry.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Archived</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Extract</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
