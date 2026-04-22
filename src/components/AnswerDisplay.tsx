"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface AnswerEntry {
  id: string;
  question: string;
  answer: string;
  isStreaming: boolean;
  mode?: string;
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
      <div className="flex flex-col items-center justify-center py-12 text-white/50">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
        <p className="text-sm font-medium">Ask a question</p>
        <p className="text-xs mt-1 opacity-60">Hold Space → speak → release</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-2 sm:px-4">
      {answers.map((entry, idx) => (
        <div key={entry.id} className="animate-fade-in relative group">
          {/* Question bubble */}
          <div className="flex justify-end mb-2">
            <div className="chat-bubble max-w-[85%] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200/50">
              <p style={{ fontSize: `${Math.max(8, fontSize - 1)}px` }} className="text-gray-700 leading-relaxed">
                {entry.question}
              </p>
            </div>
          </div>

          {/* Answer bubble */}
          <div className="flex justify-start relative">
            <div className={`chat-bubble max-w-[92%] pb-6 ${entry.isStreaming && idx === 0 ? "chat-bubble-streaming" : ""}`}>
              <div className="markdown-answer text-gray-800 leading-[1.7]" style={{ fontSize: `${fontSize}px` }}>
                {(() => {
                  const { think, main, isThinking } = parseAnswer(entry.answer);
                  return (
                    <>
                      {think && (
                        <div className="mb-3 text-xs bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
                          <details className="group" open={isThinking}>
                            <summary className="cursor-pointer px-3 py-2 bg-gray-100 text-gray-500 font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 select-none">
                              <svg className="w-3.5 h-3.5 text-gray-400 group-open:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {isThinking ? "Thinking..." : "Thought Process"}
                              <svg className="w-3.5 h-3.5 ml-auto text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </summary>
                            <div className="p-3 text-gray-600 whitespace-pre-wrap border-t border-gray-200 bg-gray-50 font-mono text-[0.7rem] leading-relaxed opacity-80">
                              {think}
                            </div>
                          </details>
                        </div>
                      )}
                      <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code(props: any) {
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const { children, className, node, ...rest } = props;
                      const match = /language-(\w+)/.exec(className || "");
                      const isBlock = match || String(children).includes("\n");
                      const language = match ? match[1] : "javascript";

                      return isBlock ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus as any}
                          language={language}
                          PreTag="div"
                          customStyle={{
                            margin: "8px 0",
                            borderRadius: "10px",
                            padding: "14px",
                            fontSize: `${Math.max(6, fontSize - 2)}px`,
                          }}
                          codeTagProps={{
                            style: {
                              fontSize: `${Math.max(6, fontSize - 2)}px`,
                            }
                          }}
                          {...rest}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className={`${className || ""} bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded font-mono`}
                          style={{ fontSize: `${Math.max(6, fontSize - 1)}px` }}
                          {...rest}
                        >
                          {children}
                        </code>
                      );
                    },
                    // Style other markdown elements
                    p({ children }) {
                      return <p className="mb-3 last:mb-0 leading-relaxed text-gray-700">{children}</p>;
                    },
                    strong({ children }) {
                      return <strong className="font-semibold text-gray-900">{children}</strong>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5 text-gray-700">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5 text-gray-700">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="pl-1 leading-relaxed">{children}</li>;
                    },
                    hr() {
                      return <hr className="border-gray-200 my-4" />;
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-4 rounded-lg border border-gray-200/80 shadow-sm bg-white">
                          <table className="min-w-full text-left border-collapse text-sm">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    thead({ children }) {
                      return <thead className="bg-indigo-50/80 text-indigo-900 border-b border-gray-200/80">{children}</thead>;
                    },
                    tbody({ children }) {
                      return <tbody className="divide-y divide-gray-100">{children}</tbody>;
                    },
                    tr({ children }) {
                      return <tr className="hover:bg-indigo-50/40 transition-colors">{children}</tr>;
                    },
                    th({ children }) {
                      return <th className="px-4 py-3 font-semibold whitespace-nowrap">{children}</th>;
                    },
                    td({ children }) {
                      return <td className="px-4 py-3 text-gray-700 align-top">{children}</td>;
                    },
                  }}
                >
                  {main}
                </ReactMarkdown>
                {entry.isStreaming && !isThinking && (
                  <span className="inline-block w-2 h-4 bg-indigo-500 ml-0.5 animate-pulse rounded-sm" />
                )}
                    </>
                  );
                })()}
              </div>
              
              {/* Response Footer (Mode Badge + Copy Button) */}
              <div className="absolute bottom-2 right-3 flex items-center gap-2">
                {!entry.isStreaming && (
                  <button
                    onClick={() => handleCopy(entry.id, entry.answer)}
                    className="flex items-center gap-1 text-[0.6rem] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded transition-all duration-200 border bg-white/50 hover:bg-white/80 border-gray-200 text-gray-500 hover:text-gray-800"
                  >
                    {copiedId === entry.id ? (
                      <>
                        <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
                
                {entry.mode && (
                  <span className="text-[0.55rem] font-medium tracking-wide uppercase text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50 opacity-70">
                    {entry.mode}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
