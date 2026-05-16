'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CartoonAvatarProps {
  size?: 'sm' | 'lg';
}

export default function CartoonAvatar({ size = 'sm' }: CartoonAvatarProps) {
  const isLarge = size === 'lg';
  const w = isLarge ? 56 : 36;
  const h = isLarge ? 64 : 40;

  return (
    <motion.div
      whileHover={{ y: -3, rotate: [0, -3, 3, 0], transition: { duration: 0.4 } }}
      style={{ perspective: '200px' }}
    >
      <motion.svg
        width={w}
        height={h}
        viewBox="0 0 36 40"
        fill="none"
        whileHover={{ rotateY: 12 }}
        transition={{ duration: 0.3 }}
        style={{ transformStyle: 'preserve-3d', display: 'block' }}
      >
        <defs>
          {/* Soft shadow */}
          <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#6366f1" floodOpacity="0.25" />
          </filter>

          {/* Body gradient - 3D shaded */}
          <radialGradient id="b" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#312e81" />
          </radialGradient>

          {/* Head sphere gradient */}
          <radialGradient id="h" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ddd6fe" />
            <stop offset="40%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#4c1d95" />
          </radialGradient>

          {/* Ear gradient */}
          <linearGradient id="e" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
        </defs>

        {/* Body / shoulders */}
        <path d="M6 40 L6 34 Q6 30 10 30 L26 30 Q30 30 30 34 L30 40 Z" fill="url(#b)" filter="url(#s)" />
        <ellipse cx="18" cy="30" rx="8" ry="1.5" fill="rgba(255,255,255,0.3)" />

        {/* Left ear */}
        <path d="M2 20 Q2 16 6 18 L7 20 L7 27 L6 29 Q2 31 2 27 Z" fill="url(#e)" filter="url(#s)" />
        {/* Right ear */}
        <path d="M34 20 Q34 16 30 18 L29 20 L29 27 L30 29 Q34 31 34 27 Z" fill="url(#e)" filter="url(#s)" />

        {/* Head sphere */}
        <circle cx="18" cy="17" r="13" fill="url(#h)" filter="url(#s)" />

        {/* 3D highlight on head */}
        <ellipse cx="14" cy="10" rx="6" ry="4" fill="rgba(255,255,255,0.35)" transform="rotate(-15 14 10)" />

        {/* Hair tuft */}
        <path d="M15 5 Q18 0 21 5 Q18 3 15 5" fill="#7c3aed" />

        {/* Left eye - 3D look */}
        <ellipse cx="13" cy="16" rx="3.5" ry="4" fill="white" />
        <ellipse cx="14" cy="16" rx="2" ry="2.5" fill="#4338ca" />
        <circle cx="15" cy="14.5" r="1.2" fill="white" />

        {/* Right eye - 3D look */}
        <ellipse cx="23" cy="16" rx="3.5" ry="4" fill="white" />
        <ellipse cx="22" cy="16" rx="2" ry="2.5" fill="#4338ca" />
        <circle cx="21" cy="14.5" r="1.2" fill="white" />

        {/* Cheeks */}
        <ellipse cx="10" cy="22" rx="2" ry="1.2" fill="#f472b6" fillOpacity="0.45" />
        <ellipse cx="26" cy="22" rx="2" ry="1.2" fill="#f472b6" fillOpacity="0.45" />

        {/* Smile */}
        <path d="M14 24 Q18 27.5 22 24" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </motion.svg>
    </motion.div>
  );
}
