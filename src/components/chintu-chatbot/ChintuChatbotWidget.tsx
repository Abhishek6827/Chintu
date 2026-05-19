'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import ChatWindow from './ChatWindow';
import CartoonAvatar from './CartoonAvatar';

export default function ChintuChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Hide tooltip after 5 seconds
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Floating Widget Button */}
      <div className="fixed bottom-4 left-4 z-[90]">
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              className="absolute bottom-full left-0 mb-2 whitespace-nowrap"
            >
              <div className="bg-gray-900 dark:bg-gray-800 text-white text-sm px-3 py-2 
                              rounded-lg shadow-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Need help? Ask Chintu!</span>
                <button 
                  onClick={() => setShowTooltip(false)}
                  className="ml-1 text-gray-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
                {/* Arrow */}
                <div className="absolute -bottom-1 left-6 w-2 h-2 bg-gray-900 dark:bg-gray-800 
                                transform rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!hasOpened) setHasOpened(true);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-12 h-14 sm:w-14 sm:h-16 flex items-end justify-center
                      transition-all duration-300 bg-transparent border-0 ${
                        isOpen 
                          ? 'rotate-45' 
                          : ''
                      }`}
          style={{
            filter: isOpen ? 'none' : 'drop-shadow(0 8px 16px rgba(20,184,166,0.35))',
          }}
        >
          {/* Icon */}
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shadow-lg">
                  <X className="w-5 h-5 text-white" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative flex items-end justify-center"
              >
                <CartoonAvatar size="lg" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification dot - can be used for unread messages */}
          {!isOpen && !hasOpened && (
            <div className="absolute -top-1 right-0 w-4 h-4 bg-red-500 rounded-full
                            border-2 border-white dark:border-gray-900 flex items-center justify-center z-10 animate-bounce">
              <span className="text-[8px] text-white font-bold">1</span>
            </div>
          )}
        </motion.button>

        {/* Label below button */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1"
          >
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/80 
                             dark:bg-gray-800/80 px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
              Ask Chintu
            </span>
          </motion.div>
        )}
      </div>

      {/* Chat Window */}
      <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
