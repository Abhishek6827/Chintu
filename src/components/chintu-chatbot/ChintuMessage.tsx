'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { ChatMessage } from './types';
import CartoonAvatar from './CartoonAvatar';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChintuMessageProps {
  message: ChatMessage;
}

export default function ChintuMessage({ message }: ChintuMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
        {/* Avatar - only show for bot */}
        {!isUser && (
          <div className="flex-shrink-0 self-end mb-1">
            <CartoonAvatar size="sm" />
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachments.map((attachment) => (
                <div 
                  key={attachment.id}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
                >
                  {attachment.type.startsWith('image/') ? (
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-orange-500" />
                  )}
                  <span className="truncate max-w-[150px]">{attachment.name}</span>
                  <button 
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`relative px-3 py-2 rounded-2xl max-w-[240px] sm:max-w-[280px] ${
              isUser
                ? 'bg-gradient-to-r from-blue-500 to-teal-600 text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
            }`}
          >
            {isUser ? (
              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <div className="prose dark:prose-invert prose-xs leading-relaxed max-w-none" style={{ maxWidth: 'none', fontSize: '0.75rem', lineHeight: '1.5' }}>
                <ReactMarkdown
                  components={{
                    p({ children }) {
                      return <p className="whitespace-pre-wrap break-words">{children}</p>;
                    },
                    code({ inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={`${className} break-words`} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Footer with time and copy */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">
              {formatTime(message.timestamp)}
            </span>
            {!isUser && (
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
