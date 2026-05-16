'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Paperclip, Trash2, History, 
  Plus, Sparkles, AlertCircle 
} from 'lucide-react';
import { ChatSession, ChatMessage, Attachment } from './types';
import { 
  getSessions, saveSession, deleteSession, 
  createNewSession, generateMessageId, getCurrentSessionId, setCurrentSessionId 
} from './storage';
import ChintuMessage from './ChintuMessage';
import CartoonAvatar from './CartoonAvatar';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = getSessions();
    setSessions(loadedSessions);
    
    const currentId = getCurrentSessionId();
    if (currentId) {
      const session = loadedSessions.find(s => s.id === currentId);
      if (session) {
        setCurrentSession(session);
      } else {
        startNewChat();
      }
    } else {
      startNewChat();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const startNewChat = () => {
    const newSession = createNewSession();
    setCurrentSession(newSession);
    setCurrentSessionId(newSession.id);
    setAttachments([]);
    setShowSidebar(false);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSession(session);
    setCurrentSessionId(session.id);
    setShowSidebar(false);
  };

  const clearCurrentChat = () => {
    if (currentSession) {
      const updated = { ...currentSession, messages: [], updatedAt: Date.now() };
      setCurrentSession(updated);
      saveSession(updated);
      setAttachments([]);
      setIsOffline(false);
    }
  };

  const deleteChat = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      deleteSession(sessionId);
      const updatedSessions = getSessions();
      setSessions(updatedSessions);
      
      if (currentSession?.id === sessionId) {
        startNewChat();
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      
      newAttachments.push({
        id: `att-${Date.now()}-${i}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url,
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const sendMessage = async (directText?: string) => {
    const text = directText ?? input;
    if ((!text.trim() && attachments.length === 0) || isLoading || !currentSession) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: text.trim() || '(Shared files)',
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const updatedMessages = [...currentSession.messages, userMessage];
    const updatedSession = {
      ...currentSession,
      messages: updatedMessages,
      updatedAt: Date.now(),
      title: currentSession.messages.length === 0 
        ? text.slice(0, 30) || 'New Chat' 
        : currentSession.title,
    };

    setCurrentSession(updatedSession);
    saveSession(updatedSession);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: currentSession.messages,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: data.response || 'Sorry, I could not process your request.',
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalSession = { ...updatedSession, messages: finalMessages };
      
      setCurrentSession(finalSession);
      saveSession(finalSession);
      setIsOffline(data.offline || false);

      // Refresh sessions list
      setSessions(getSessions());

    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Sorry, I am currently offline. Please check your connection or try again later.',
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, errorMessage];
      const finalSession = { ...updatedSession, messages: finalMessages };
      
      setCurrentSession(finalSession);
      saveSession(finalSession);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-20 sm:bottom-24 left-2 sm:left-4 right-2 sm:right-auto 
                     w-[calc(100vw-16px)] sm:w-[360px] h-[60vh] sm:h-[520px] max-h-[520px] 
                     bg-white dark:bg-gray-900 rounded-2xl shadow-2xl 
                     border border-gray-200 dark:border-gray-700 
                     flex flex-col overflow-hidden z-[100]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r 
                          from-emerald-500 to-teal-600 text-white">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <History className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <CartoonAvatar size="sm" />
                <div>
                  <h3 className="font-semibold text-sm">Chintu</h3>
                  {isOffline && (
                    <span className="text-xs text-white/70 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Offline
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {currentSession && currentSession.messages.length > 0 && (
                <button 
                  onClick={clearCurrentChat}
                  className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
                  title="End chat and show options"
                >
                  End Chat
                </button>
              )}
              <button 
                onClick={startNewChat}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="New chat"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <AnimatePresence>
            {showSidebar && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                className="absolute left-0 top-[60px] bottom-0 w-64 bg-gray-50 dark:bg-gray-800 
                           border-r border-gray-200 dark:border-gray-700 z-10 flex flex-col"
              >
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={startNewChat}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-500 
                               hover:bg-emerald-600 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">New Chat</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {sessions.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-4">
                      No conversations yet
                    </p>
                  ) : (
                    sessions.sort((a, b) => b.updatedAt - a.updatedAt).map(session => (
                      <div
                        key={session.id}
                        onClick={() => loadSession(session)}
                        className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer
                                   ${currentSession?.id === session.id 
                                     ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                                     : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <Sparkles className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 text-sm truncate">{session.title}</span>
                        <button
                          onClick={(e) => deleteChat(session.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 
                                     hover:text-red-600 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900">
            {currentSession?.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="mb-4 overflow-visible">
                  <CartoonAvatar size="lg" />
                </div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
                  Hello! I am Chintu
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px]">
                  Your AI assistant. Ask me anything about interviews, resumes, or using the app!
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {[
                    { text: 'How to use app?', icon: '❓' },
                    { text: 'Interview tips', icon: '💡' },
                    { text: 'Resume help', icon: '📝' },
                  ].map((suggestion) => (
                    <button
                      key={suggestion.text}
                      onClick={() => sendMessage(suggestion.text)}
                      className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 
                                 border border-gray-200 dark:border-gray-700 rounded-full
                                 hover:border-emerald-500 hover:text-emerald-600 
                                 transition-colors flex items-center gap-1"
                    >
                      <span>{suggestion.icon}</span>
                      <span>{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              currentSession?.messages.map((message) => (
                <ChintuMessage key={message.id} message={message} />
              ))
            )}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 mb-4"
              >
                <CartoonAvatar size="sm" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" 
                        style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" 
                        style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" 
                        style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 
                            dark:border-gray-700 flex gap-2 overflow-x-auto">
              {attachments.map(att => (
                <div 
                  key={att.id}
                  className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 
                             border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                >
                  <span className="truncate max-w-[100px]">{att.name}</span>
                  <button 
                    onClick={() => removeAttachment(att.id)}
                    className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions - only show when no messages */}
          {(!currentSession || currentSession.messages.length === 0) && (
            <div className="px-3 pt-2 pb-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-1.5 flex-wrap pb-1">
                {[
                  { label: 'Interview Prep', icon: '💼' },
                  { label: 'Resume Builder', icon: '📄' },
                  { label: 'How to use app', icon: '🚀' },
                  { label: 'Pricing', icon: '💰' },
                  { label: 'Account Help', icon: '⚙️' },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      sendMessage(action.label);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] 
                               bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300
                               border border-emerald-200 dark:border-emerald-800 rounded-full
                               hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    <span>{action.icon}</span>
                    <span className="whitespace-nowrap">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 
                           dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  rows={1}
                  className="w-full px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-emerald-500
                             text-xs resize-none max-h-[80px]"
                  style={{ minHeight: '32px' }}
                />
              </div>

              <button
                onClick={() => sendMessage()}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 
                           hover:from-emerald-600 hover:to-teal-700
                           text-white rounded-lg transition-all disabled:opacity-50 
                           disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
