"use client";

interface AnswerEntry {
  id: string;
  question: string;
  answer: string;
  isStreaming: boolean;
}

interface AnswerDisplayProps {
  answers: AnswerEntry[];
}

export default function AnswerDisplay({ answers }: AnswerDisplayProps) {
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
    <div className="space-y-3 px-4">
      {answers.map((entry, idx) => (
        <div key={entry.id} className="animate-fade-in">
          {/* Question bubble */}
          <div className="flex justify-end mb-2">
            <div className="chat-bubble max-w-[85%] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200/50">
              <p className="text-[13px] text-gray-700 leading-relaxed">
                {entry.question}
              </p>
            </div>
          </div>

          {/* Answer bubble */}
          <div className="flex justify-start">
            <div className={`chat-bubble max-w-[92%] ${entry.isStreaming && idx === 0 ? "chat-bubble-streaming" : ""}`}>
              <p className="text-[14px] text-gray-800 leading-[1.7] whitespace-pre-wrap">
                {entry.answer}
                {entry.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-indigo-500 ml-0.5 animate-pulse rounded-sm" />
                )}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
