"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface AnswerEntry {
  id: string;
  question: string;
  answer: string;
  isStreaming: boolean;
}

interface AnswerDisplayProps {
  answers: AnswerEntry[];
  fontSize?: number;
}

export default function AnswerDisplay({ answers, fontSize = 14 }: AnswerDisplayProps) {
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
        <div key={entry.id} className="animate-fade-in">
          {/* Question bubble */}
          <div className="flex justify-end mb-2">
            <div className="chat-bubble max-w-[85%] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200/50">
              <p style={{ fontSize: `${fontSize - 1}px` }} className="text-gray-700 leading-relaxed">
                {entry.question}
              </p>
            </div>
          </div>

          {/* Answer bubble */}
          <div className="flex justify-start">
            <div className={`chat-bubble max-w-[92%] ${entry.isStreaming && idx === 0 ? "chat-bubble-streaming" : ""}`}>
              <div className="markdown-answer text-gray-800 leading-[1.7]" style={{ fontSize: `${fontSize}px` }}>
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: "8px 0",
                            borderRadius: "10px",
                            fontSize: "12px",
                            padding: "14px",
                          }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-xs font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    // Style other markdown elements
                    p({ children }) {
                      return <p className="mb-2 last:mb-0">{children}</p>;
                    },
                    strong({ children }) {
                      return <strong className="font-semibold text-gray-900">{children}</strong>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="text-[0.8125rem]">{children}</li>;
                    },
                    hr() {
                      return <hr className="border-gray-200 my-3" />;
                    },
                  }}
                >
                  {entry.answer}
                </ReactMarkdown>
                {entry.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-indigo-500 ml-0.5 animate-pulse rounded-sm" />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
