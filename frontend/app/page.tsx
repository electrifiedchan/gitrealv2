"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Terminal,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  Send,
  Wifi,
  Lock,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
  ArrowRight,
  FileText,
  Code,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  Github
} from 'lucide-react';
import axios from 'axios';

// --- CUSTOM CSS (Merged: Matrix Theme + User's Glitch/Typewriter Effects) ---
const customStyles = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');

:root {
  --neon-green: #00FF41;
  --neon-red: #FF1744;
  --neon-blue: #00FFFF;
  --neon-yellow: #FFFF33;
  --dark-bg: #050505;
}

body {
  background-color: var(--dark-bg);
  color: var(--neon-green);
  font-family: 'JetBrains Mono', monospace;
  overflow-x: hidden;
}

/* --- CRT & GLOBAL GLITCH EFFECTS --- */
.scanlines::before {
  content: " ";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    to bottom,
    rgba(18, 16, 16, 0) 50%,
    rgba(0, 0, 0, 0.25) 50%
  );
  background-size: 100% 4px;
  z-index: 10;
  pointer-events: none;
}

@keyframes flicker {
  0% { opacity: 0.99; }
  5% { opacity: 0.98; }
  10% { opacity: 0.97; }
  15% { opacity: 0.98; }
  20% { opacity: 0.99; }
  50% { opacity: 0.98; }
  100% { opacity: 0.99; }
}

.crt-flicker {
  animation: flicker 0.2s infinite;
}

/* Scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #000; }
::-webkit-scrollbar-thumb { background: #003300; border: 1px solid #00FF41; }

/* --- MORPHEUS SPECIFIC STYLES --- */
.morpheus-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* --- PREMIUM GLITCH EFFECT (User Provided) --- */
.glasses-text {
  position: absolute;
  top: 13%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2.5rem;
  font-weight: 1000;
  letter-spacing: 3px;
  z-index: 20;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 0px; /* Reduced gap */
  align-items: center;
  /* Ensure container doesn't block clicks if needed, though text is pointer-events: none usually */
  pointer-events: none;
}

.glitch {
  position: relative;
  color: white; /* Base color */
  mix-blend-mode: hard-light;
  background: black;
  /* Equalize box sizes */
  width: 100px;
  text-align: center;
  display: inline-block;
}

.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black; /* Opaque background masks the original */
}

.glitch::before {
  left: 2px;
  text-shadow: -1px 0 red;
  animation: noise-anim 2s infinite linear alternate-reverse;
}

.glitch::after {
  left: -2px;
  text-shadow: -1px 0 blue;
  animation: noise-anim 2s infinite linear alternate-reverse;
  animation-delay: 1s; /* Offset for variation */
}

@keyframes noise-anim {
  0% { clip-path: inset(40% 0 61% 0); }
  20% { clip-path: inset(92% 0 1% 0); }
  40% { clip-path: inset(43% 0 1% 0); }
  60% { clip-path: inset(25% 0 58% 0); }
  80% { clip-path: inset(54% 0 7% 0); }
  100% { clip-path: inset(58% 0 43% 0); }
}

/* Specific Colors for GIT and REAL */
.text-git {
  color: #FF1744;
}
.text-real {
  color: #00FFFF;
}

/* Override shadows for the glitch layers to match the text color roughly or keep red/blue as requested? 
   User code had red/blue hardcoded. I will keep red/blue as per user snippet. 
   But the base text has specific colors. 
   I will let the base text color shine through or be overridden?
   User said "don't make text glitch but background will be glitch".
   The pseudo elements have background: black. 
   So they will cover the text.
   And they have text-shadow.
   So the visible text will be the pseudo-elements mostly?
   Or the clip-path reveals the underlying text?
   clip-path: inset(...) cuts the element.
   So the pseudo-element is mostly invisible (clipped out), revealing the base text.
   Where it is NOT clipped, it shows black background + colored text shadow.
   This creates the "glitch" effect on top of the base text.
   Correct.
*/

.pill-zone {
  position: absolute;
  width: 14%;
  height: 14%;
  border-radius: 50%;
  cursor: pointer;
  z-index: 30;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Pill Pulse Ring Animation */
@keyframes pill-pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}

.pill-zone::before {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0;
  animation: pill-pulse 2s ease-out infinite;
}

.pill-zone:hover::before {
  opacity: 1;
}

/* RED PILL (User's LEFT / Morpheus' Right Hand) */
.pill-red {
  top: 77%;
  left: 12%;
  box-shadow: 0 0 20px rgba(255, 23, 68, 0.3);
  animation: red-glow-idle 2s ease-in-out infinite;
}

@keyframes red-glow-idle {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 23, 68, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 23, 68, 0.5); }
}

.pill-red:hover {
  animation: none;
  box-shadow: 0 0 100px rgba(255, 23, 68, 1), 0 0 150px rgba(255, 23, 68, 0.5), inset 0 0 30px rgba(255, 23, 68, 0.3);
  background: radial-gradient(circle, rgba(255,23,68,0.5) 0%, rgba(0,0,0,0) 70%);
  transform: scale(1.15);
}

.pill-red::before {
  border-color: #FF1744;
}

/* BLUE PILL (User's RIGHT / Morpheus' Left Hand) */
.pill-blue {
  top: 77%;
  right: 11%;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
  animation: cyan-glow-idle 2s ease-in-out infinite;
}

@keyframes cyan-glow-idle {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.3); }
  50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.5); }
}

.pill-blue:hover {
  animation: none;
  box-shadow: 0 0 100px rgba(0, 255, 255, 1), 0 0 150px rgba(0, 255, 255, 0.5), inset 0 0 30px rgba(0, 255, 255, 0.3);
  background: radial-gradient(circle, rgba(0,255,255,0.5) 0%, rgba(0,0,0,0) 70%);
  transform: scale(1.15);
}

.pill-blue::before {
  border-color: #00FFFF;
}

.tooltip {
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'JetBrains Mono';
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
  background: rgba(0,0,0,0.95);
  border: 2px solid currentColor;
  padding: 10px 16px;
  pointer-events: none;
  z-index: 40;
  backdrop-filter: blur(10px);
}

.pill-zone:hover .tooltip {
  opacity: 1;
}

@keyframes fadeInText {
  to { opacity: 1; }
}

/* Cursor Blink */
.cursor-blink {
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Glitch Text Effect */
.glitch {
  position: relative;
}
.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.glitch::before {
  left: 2px;
  text-shadow: -1px 0 var(--neon-red);
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim 5s infinite linear alternate-reverse;
}
.glitch::after {
  left: -2px;
  text-shadow: -1px 0 var(--neon-green);
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim2 5s infinite linear alternate-reverse;
}

@keyframes glitch-anim {
  0% { clip: rect(42px, 9999px, 44px, 0); }
  5% { clip: rect(12px, 9999px, 59px, 0); }
  10% { clip: rect(48px, 9999px, 29px, 0); }
  15% { clip: rect(42px, 9999px, 73px, 0); }
  20% { clip: rect(63px, 9999px, 27px, 0); }
  25% { clip: rect(34px, 9999px, 55px, 0); }
  30% { clip: rect(86px, 9999px, 73px, 0); }
  35% { clip: rect(20px, 9999px, 20px, 0); }
  40% { clip: rect(26px, 9999px, 60px, 0); }
  45% { clip: rect(25px, 9999px, 66px, 0); }
  50% { clip: rect(57px, 9999px, 98px, 0); }
  55% { clip: rect(5px, 9999px, 46px, 0); }
  60% { clip: rect(82px, 9999px, 31px, 0); }
  65% { clip: rect(54px, 9999px, 27px, 0); }
  70% { clip: rect(28px, 9999px, 99px, 0); }
  75% { clip: rect(45px, 9999px, 69px, 0); }
  80% { clip: rect(23px, 9999px, 85px, 0); }
  85% { clip: rect(54px, 9999px, 84px, 0); }
  90% { clip: rect(45px, 9999px, 47px, 0); }
  95% { clip: rect(37px, 9999px, 20px, 0); }
  100% { clip: rect(4px, 9999px, 91px, 0); }
}
@keyframes glitch-anim2 {
  0% { clip: rect(65px, 9999px, 100px, 0); }
  100% { clip: rect(0px, 9999px, 30px, 0); }
}
@keyframes loading-bar {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}

/* MATRIX RAIN ANIMATION - Proper falling effect */
@keyframes matrix-fall {
  0% {
    transform: translateY(-100vh);
  }
  100% {
    transform: translateY(100vh);
  }
}

@keyframes matrix-glow {
  0%, 100% { text-shadow: 0 0 5px #00FF41, 0 0 10px #00FF41; }
  50% { text-shadow: 0 0 20px #00FF41, 0 0 30px #00FF41, 0 0 40px #00FF41; }
}

.matrix-column {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  color: #00FF41;
  text-shadow: 0 0 10px #00FF41;
  user-select: none;
  animation: matrix-fall linear infinite;
}

.matrix-char {
  font-size: 16px;
  line-height: 1.1;
  text-align: center;
}

.matrix-char-bright {
  color: #FFFFFF !important;
  text-shadow: 0 0 20px #00FF41, 0 0 30px #FFFFFF !important;
}

/* ============================================
   PREMIUM INTERACTIVE BUTTON EFFECTS
   ============================================ */

/* Base Matrix Button */
.matrix-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
}

.matrix-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.5), 0 0 40px rgba(0, 255, 65, 0.3);
}

.matrix-btn:active {
  transform: scale(0.98);
}

/* Glow Pulse Effect */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 65, 0.5); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 65, 0.8), 0 0 30px rgba(0, 255, 65, 0.4); }
}

.matrix-btn-glow {
  animation: glow-pulse 2s ease-in-out infinite;
}

.matrix-btn-glow:hover {
  animation: none;
  box-shadow: 0 0 30px rgba(0, 255, 65, 1), 0 0 60px rgba(0, 255, 65, 0.5);
}

/* Ripple Effect */
.matrix-btn .ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 255, 65, 0.4);
  transform: scale(0);
  animation: ripple-effect 0.6s linear;
  pointer-events: none;
}

@keyframes ripple-effect {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Border Chase Animation */
.matrix-btn-border {
  position: relative;
}

.matrix-btn-border::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid transparent;
  background: linear-gradient(90deg, #00FF41, #00FF41) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.matrix-btn-border:hover::before {
  opacity: 1;
  animation: border-chase 1s linear infinite;
}

@keyframes border-chase {
  0% { clip-path: inset(0 100% 100% 0); }
  25% { clip-path: inset(0 0 100% 0); }
  50% { clip-path: inset(0 0 0 100%); }
  75% { clip-path: inset(100% 0 0 0); }
  100% { clip-path: inset(0 100% 0 0); }
}

/* Glitch Text on Hover */
.matrix-btn-glitch:hover {
  animation: btn-glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite;
}

@keyframes btn-glitch {
  0% { transform: scale(1.05) translate(0); }
  20% { transform: scale(1.05) translate(-2px, 2px); }
  40% { transform: scale(1.05) translate(-2px, -2px); }
  60% { transform: scale(1.05) translate(2px, 2px); }
  80% { transform: scale(1.05) translate(2px, -2px); }
  100% { transform: scale(1.05) translate(0); }
}

/* Red Danger Button */
.matrix-btn-danger {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.matrix-btn-danger:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.5), 0 0 40px rgba(255, 0, 0, 0.3);
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
}

/* Cyan/Blue Button */
.matrix-btn-cyan {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.matrix-btn-cyan:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3);
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
}

/* ============================================
   SCAN LINE EFFECT
   ============================================ */
@keyframes scan-line {
  0% { top: -10%; }
  100% { top: 110%; }
}

.animate-scan-line {
  animation: scan-line 3s linear infinite;
}

/* ============================================
   CARD HOVER EFFECTS
   ============================================ */
.hover-card {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hover-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 10px 40px rgba(0, 255, 65, 0.2);
}

/* Stagger animation for cards */
@keyframes card-slide-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-animate {
  animation: card-slide-in 0.5s ease-out forwards;
  opacity: 0;
}

/* List item stagger */
@keyframes list-item-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.list-item-animate {
  animation: list-item-in 0.3s ease-out forwards;
  opacity: 0;
}
`;

// --- HELPER COMPONENTS ---

// Premium Interactive Button with Ripple Effect
const MatrixButton = ({
  children,
  onClick,
  className = "",
  variant = "default", // default, danger, cyan, glow
  disabled = false
}: {
  children: React.ReactNode,
  onClick?: () => void,
  className?: string,
  variant?: "default" | "danger" | "cyan" | "glow",
  disabled?: boolean
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = btnRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    onClick?.();
  };

  const variantClasses = {
    default: "matrix-btn",
    danger: "matrix-btn matrix-btn-danger",
    cyan: "matrix-btn matrix-btn-cyan",
    glow: "matrix-btn matrix-btn-glow"
  };

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// Animated Counter - Numbers count up from 0 to target
const AnimatedCounter = ({ target, duration = 2000, className = "" }: { target: number, duration?: number, className?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;

    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function for smooth slowdown
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <span className={className}>{count}</span>;
};

// Typewriter Effect - Text types out character by character
const TypewriterText = ({ text, speed = 30, className = "" }: { text: string, speed?: number, className?: string }) => {
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayText("");
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        // Blink cursor after typing complete
        setTimeout(() => setShowCursor(false), 1000);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayText}
      {showCursor && <span className="animate-pulse">▌</span>}
    </span>
  );
};

// Matrix Rain Effect - Proper falling animation like the movie
const MatrixRain = ({ opacity = 0.7 }: { opacity?: number }) => {
  const matrixChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const columns = 40; // Number of rain columns

  // Pre-generate columns for SSR compatibility
  const columnData = useMemo(() => {
    return [...Array(columns)].map((_, colIndex) => {
      const charCount = 10 + Math.floor(Math.random() * 15);
      const duration = 4 + Math.random() * 6; // 4-10s fall speed
      const delay = Math.random() * 8;
      const left = (colIndex / columns) * 100 + (Math.random() - 0.5) * 3; // Spread with variance
      const chars = Array.from({ length: charCount }, () =>
        matrixChars[Math.floor(Math.random() * matrixChars.length)]
      );
      return { charCount, duration, delay, left, chars };
    });
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      {columnData.map((col, colIndex) => (
        <div
          key={colIndex}
          className="matrix-column"
          style={{
            left: `${col.left}%`,
            animationDuration: `${col.duration}s`,
            animationDelay: `${col.delay}s`,
          }}
        >
          {col.chars.map((char, charIndex) => (
            <span
              key={charIndex}
              className={`matrix-char ${charIndex === col.chars.length - 1 ? 'matrix-char-bright' : ''}`}
              style={{
                opacity: 0.2 + (charIndex / col.chars.length) * 0.8,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

// Matrix Loading Screen - Reusable component with proper rain
const MatrixLoader = ({
  title = "PROCESSING...",
  subtitle = "PLEASE WAIT...",
  showRain = true
}: {
  title?: string,
  subtitle?: string,
  showRain?: boolean
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Matrix Rain Background */}
      {showRain && <MatrixRain opacity={0.4} />}

      {/* Main Content */}
      <div className="relative z-10 text-[#00FF41] font-mono flex flex-col items-center gap-6">
        {/* Spinning Terminal Icon */}
        <div className="relative">
          <Terminal size={64} className="animate-pulse" />
          <div className="absolute inset-0 border-2 border-[#00FF41] rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
        </div>

        {/* Title with glitch effect */}
        <div className="text-2xl md:text-3xl font-bold tracking-wider text-center drop-shadow-[0_0_10px_rgba(0,255,65,0.8)]">
          <span className="animate-pulse">{title}</span>
        </div>

        {/* Subtitle */}
        <div className="text-sm text-green-500 tracking-widest">
          {subtitle}
        </div>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-[#003300] overflow-hidden border border-[#00FF41]/30">
          <div
            className="h-full bg-[#00FF41]"
            style={{
              width: '100%',
              animation: 'loading-bar 2s ease-in-out infinite',
              boxShadow: '0 0 10px #00FF41, 0 0 20px #00FF41'
            }}
          ></div>
        </div>

        {/* Status dots */}
        <div className="flex gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-[#00FF41] rounded-full"
              style={{
                animationDelay: `${i * 0.15}s`,
                animation: 'pulse 1s ease-in-out infinite',
                boxShadow: '0 0 5px #00FF41'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Typewriter = ({ text, speed = 50, onComplete }: { text: string, speed?: number, onComplete?: () => void }) => {
  const [displayText, setDisplayText] = useState('');
  const onCompleteRef = useRef(onComplete);

  // Update ref when onComplete changes to avoid re-triggering effect
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setDisplayText(''); // Clear text on start
    let index = 0;

    const interval = setInterval(() => {
      // Use slice to ensure we don't duplicate text on re-renders
      index++;
      setDisplayText(text.slice(0, index));

      if (index >= text.length) {
        clearInterval(interval);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayText}
      {/* Updated Cursor: Larger height and width to match 6xl text */}
      <span
        className="cursor-blink inline-block bg-[#00FF41] ml-1 align-middle mb-2"
        style={{ width: '12px', height: '40px', display: 'inline-block' }}
      ></span>
    </span>
  );
};

// --- VIEW 1: UPLOAD LANDING (Typewriter + Upload) ---
const UploadLanding = ({ onUploadComplete }: { onUploadComplete: (file: File) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const handleSubmit = () => {
    if (!file) return;
    setLoading(true);
    // Simulate upload/processing
    setTimeout(() => {
      setLoading(false);
      onUploadComplete(file);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-20">
      <div className="mb-12 text-center max-w-4xl">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-[#00FF41] drop-shadow-[0_0_10px_rgba(0,255,65,0.5)] mb-8">
          <Typewriter
            text="RECRUITERS ARE LYING TO YOU. WAKE UP."
            speed={75}
            onComplete={() => setShowUpload(true)}
          />
        </h1>
      </div>

      {showUpload && (
        <>
          <div className="w-full max-w-xl mx-auto border-2 border-[#00FF41] bg-black p-8 shadow-[0_0_40px_rgba(0,255,65,0.2)] animate-fade-in">
            <h3 className="text-xl mb-8 border-b-2 border-[#00FF41] pb-3 flex items-center gap-3">
              <Terminal size={24} /> UPLOAD_CANDIDATE_DATA
            </h3>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-sm uppercase flex items-center gap-2 text-gray-300 font-bold">
                  <FileText size={16} /> Upload Resume (PDF)
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full bg-[#0a0a0a] border-2 border-[#003300] p-4 text-sm focus:border-[#00FF41] outline-none text-gray-300 transition-colors cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00FF41] file:text-black hover:file:bg-white"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !file}
                className="w-full bg-[#00FF41] text-black font-bold py-4 text-lg hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,255,65,0.5)] hover:shadow-[0_0_50px_rgba(0,255,65,0.8)]"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="animate-spin">⟳</span> INITIALIZING...
                  </span>
                ) : (
                  <>INITIALIZE SYSTEM <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </div>
          <div className="absolute bottom-8 font-mono text-xs text-green-900 tracking-widest animate-fade-in">
            SYSTEM VERSION 4.2.4 // UNAUTHORIZED ACCESS DETECTED
          </div>
        </>
      )
      }


    </div >
  );
};

// --- VIEW 2: MORPHEUS CHOICE ---
const MorpheusChoice = ({ onNavigate, onModeSelect }: { onNavigate: (view: string) => void, onModeSelect: (mode: 'roast' | 'rewrite') => void }) => {

  const handleRoast = () => {
    onModeSelect('roast');
    onNavigate('project-select');
  };

  const handleRewrite = () => {
    onModeSelect('rewrite');
    onNavigate('project-select');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-20 overflow-hidden">
      {/* Matrix Rain Background */}
      <MatrixRain opacity={0.15} />

      {/* Back Button - Top Left */}
      <button
        onClick={() => onNavigate('landing')}
        className="absolute top-6 left-6 text-[#00FF41] hover:text-white transition-colors text-sm font-mono flex items-center gap-2 border border-[#003300] hover:border-[#00FF41] px-3 py-2 z-30"
      >
        ← BACK
      </button>

      <div className="mb-6 text-center text-[#00FF41] animate-pulse font-mono text-sm md:text-base tracking-[0.2em] relative z-20">
        CHOOSE YOUR REALITY
      </div>

      <div className="morpheus-container relative z-20">
        <img
          src="/morpheus.png"
          alt="Morpheus"
          className="w-full h-auto object-contain opacity-90 drop-shadow-[0_0_30px_rgba(0,255,65,0.3)]"
        />

        {/* Glasses Text with Premium Glitch */}
        <div className="glasses-text">
          <span className="text-git glitch" data-text="GIT">GIT</span>
          <span className="text-real glitch" data-text="REAL">REAL</span>
        </div>

        {/* Red Pill (Roast) - Goes to project selection */}
        <div
          className="pill-zone pill-red"
          onClick={handleRoast}
        >
          <div className="tooltip text-red-500 border-red-500 shadow-[0_0_20px_red]">
            [ ROAST ME ]
            <br />
            <span className="text-[10px] text-gray-400">See the harsh truth</span>
          </div>
        </div>

        {/* Blue Pill (Rewrite) - Goes to project selection */}
        <div
          className="pill-zone pill-blue"
          onClick={handleRewrite}
        >
          <div className="tooltip text-cyan-400 border-cyan-400 shadow-[0_0_20px_cyan]">
            [ REWRITE ME ]
            <br />
            <span className="text-[10px] text-gray-400">Upgrade your career</span>
          </div>
        </div>
      </div>

      <div className="mt-8 font-mono text-xs text-green-900 relative z-20">
        HOVER OVER A PILL TO SEE OPTIONS...
      </div>
    </div>
  );
};

// --- VIEW 2.5: PROJECT SELECTION ---
interface Project {
  name: string;
  description: string;
  github_url: string | null;
  technologies: string[];
}

const ProjectSelection = ({
  onNavigate,
  uploadedFile,
  onProjectSelect,
  mode = 'roast'
}: {
  onNavigate: (view: string) => void,
  uploadedFile: File | null,
  onProjectSelect: (project: Project) => void,
  mode?: 'roast' | 'rewrite'
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [manualUrl, setManualUrl] = useState('');

  const isRoast = mode === 'roast';

  useEffect(() => {
    const extractProjects = async () => {
      if (!uploadedFile) {
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", uploadedFile);

      try {
        const res = await axios.post("http://localhost:8000/extract_projects", formData);
        if (res.data.status === "success") {
          setProjects(res.data.projects || []);
        }
      } catch (e) {
        console.error("Error extracting projects:", e);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    extractProjects();
  }, [uploadedFile]);

  const handleContinue = () => {
    const targetView = isRoast ? 'dashboard' : 'chat';
    if (selectedProject) {
      onProjectSelect(selectedProject);
      onNavigate(targetView);
    } else if (manualUrl) {
      onProjectSelect({
        name: "Manual Entry",
        description: "User provided GitHub URL",
        github_url: manualUrl,
        technologies: []
      });
      onNavigate(targetView);
    }
  };

  if (loading) {
    return (
      <MatrixLoader
        title="SCANNING RESUME..."
        subtitle="EXTRACTING PROJECTS WITH GEMINI OCR"
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-20">
      <div className="w-full max-w-2xl mx-auto">
        <h2 className={`text-2xl md:text-3xl mb-2 flex items-center gap-3 ${isRoast ? 'text-red-500' : 'text-cyan-400'}`}>
          <Code className="w-8 h-8" />
          {isRoast ? 'SELECT PROJECT TO ROAST' : 'SELECT PROJECT TO REWRITE'}
        </h2>
        <p className="text-green-700 text-sm mb-8">
          {isRoast
            ? 'Choose which project you want GitReal to analyze and critique'
            : 'Choose which project you want to update/improve on your resume'}
        </p>

        {/* Project List */}
        <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar">
          {projects.length > 0 ? (
            projects.map((project, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedProject(project)}
                className={`card-animate p-4 border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                  selectedProject?.name === project.name
                    ? 'border-[#00FF41] bg-[#00FF41]/10 shadow-[0_0_30px_rgba(0,255,65,0.4)] scale-[1.02]'
                    : 'border-[#003300] bg-black hover:border-[#00FF41]/70 hover:bg-[#001100] hover:translate-x-1'
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Selection indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${
                  selectedProject?.name === project.name ? 'bg-[#00FF41]' : 'bg-transparent group-hover:bg-[#00FF41]/50'
                }`} />

                {/* Hover scan effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FF41]/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                <div className="flex justify-between items-start relative z-10">
                  <div className="pl-2">
                    <h3 className={`font-bold text-lg transition-colors ${
                      selectedProject?.name === project.name ? 'text-[#00FF41]' : 'text-[#00FF41]/80 group-hover:text-[#00FF41]'
                    }`}>{project.name}</h3>
                    <p className="text-green-700 text-sm mt-1">{project.description}</p>
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {project.technologies.map((tech, i) => (
                          <span
                            key={i}
                            className="text-xs bg-[#003300] text-green-400 px-2 py-1 rounded hover:bg-[#00FF41]/20 transition-colors cursor-default"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {project.github_url ? (
                    <span className="text-xs text-green-500 bg-[#001100] px-2 py-1 rounded border border-green-800 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      GitHub ✓
                    </span>
                  ) : (
                    <span className="text-xs text-yellow-600 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-800 flex items-center gap-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      No Link
                    </span>
                  )}
                </div>
                {project.github_url && (
                  <p className="text-xs text-green-800 mt-2 truncate pl-2">{project.github_url}</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-green-700 card-animate">
              <p>No projects found in resume.</p>
              <p className="text-sm mt-2">Enter a GitHub URL manually below.</p>
            </div>
          )}
        </div>

        {/* Manual URL Entry */}
        <div className="border-t border-[#003300] pt-6 mb-6">
          <label className="text-sm text-green-700 mb-2 block">Or enter GitHub URL manually:</label>
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => {
              setManualUrl(e.target.value);
              setSelectedProject(null);
            }}
            placeholder="https://github.com/username/repo"
            className="w-full bg-[#0a0a0a] border-2 border-[#003300] p-3 text-sm focus:border-[#00FF41] outline-none text-gray-300"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => onNavigate('morpheus')}
            className="flex-1 border-2 border-[#003300] text-green-700 py-3 hover:border-[#00FF41] hover:text-[#00FF41] transition-all"
          >
            ← BACK
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedProject && !manualUrl}
            className={`flex-1 text-black font-bold py-3 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isRoast
                ? 'bg-red-500 shadow-[0_0_20px_rgba(255,0,0,0.5)]'
                : 'bg-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.5)]'
            }`}
          >
            {isRoast ? 'ROAST THIS PROJECT →' : 'REWRITE THIS PROJECT →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- VIEW 3: DASHBOARD (ROAST) ---
const Dashboard = ({ onNavigate, uploadedFile, selectedProject }: { onNavigate: (view: string) => void, uploadedFile: File | null, selectedProject: Project | null }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!uploadedFile) {
        setData({
          matches: ["No resume uploaded"],
          red_flags: ["Unable to verify"],
          missing_gems: ["Please upload a resume"],
          summary: "No data available."
        });
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append("file", uploadedFile);

      // Pass the selected project's GitHub URL and name
      if (selectedProject?.github_url) {
        formData.append("github_url", selectedProject.github_url);
      }
      if (selectedProject?.name) {
        formData.append("project_name", selectedProject.name);
      }

      try {
        const res = await axios.post("http://localhost:8000/analyze", formData);
        const responseData = res.data.data;
        setData(typeof responseData === 'string' ? JSON.parse(responseData) : responseData);
      } catch (e) {
        console.error(e);
        setData({
          matches: [],
          red_flags: ["Error analyzing project - Could not verify claims."],
          missing_gems: [],
          summary: "Analysis failed. Try again with a different project."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uploadedFile, selectedProject]);

  if (loading || !data) {
    return (
      <MatrixLoader
        title={`ROASTING: ${selectedProject?.name || "PROJECT"}...`}
        subtitle={selectedProject?.github_url ? `FETCHING FROM GITHUB...` : "ANALYZING RESUME DATA..."}
      />
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-12 relative z-20">
      <header className="flex justify-between items-center mb-12 border-b border-[#003300] pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('project-select')}
            className="text-xs hover:text-[#00FF41] border border-[#003300] hover:border-[#00FF41] px-3 py-1 transition-colors"
          >
            ← PROJECTS
          </button>
          <h2 className="text-xl md:text-2xl text-[#00FF41] flex items-center gap-3">
            <Lock className="w-5 h-5 animate-pulse" />
            FORENSIC AUDIT: <span className="text-red-500">{selectedProject?.name || "PROJECT"}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <MatrixButton onClick={() => onNavigate('morpheus')} className="text-xs text-[#00FF41] border border-[#003300] px-3 py-1">[ MENU ]</MatrixButton>
          <MatrixButton onClick={() => onNavigate('landing')} variant="danger" className="text-xs text-red-500 border border-red-900 px-3 py-1">[ DISCONNECT ]</MatrixButton>
        </div>
      </header>

      {/* Credibility Score + Verdict Banner */}
      <div className="mb-8 p-6 bg-black border-2 border-[#00FF41] shadow-[0_0_30px_rgba(0,255,65,0.3)] relative overflow-hidden">
        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-[#00FF41] to-transparent opacity-50 animate-scan-line" />
        </div>

        {/* Credibility Score */}
        {data.credibility_score !== undefined && (
          <div className="flex items-center justify-center gap-4 mb-4 relative z-10">
            <span className="text-gray-400 font-mono text-sm tracking-wider">CREDIBILITY SCORE:</span>
            <div className="relative w-48 h-5 bg-gray-800 border border-gray-600 overflow-hidden">
              {/* Animated bar fill */}
              <div
                className={`h-full transition-all duration-[2000ms] ease-out ${
                  data.credibility_score >= 70 ? 'bg-[#00FF41]' :
                  data.credibility_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${data.credibility_score}%`,
                  boxShadow: data.credibility_score >= 70
                    ? '0 0 20px #00FF41, 0 0 40px #00FF41'
                    : data.credibility_score >= 40
                      ? '0 0 20px #eab308, 0 0 40px #eab308'
                      : '0 0 20px #ef4444, 0 0 40px #ef4444'
                }}
              />
              {/* Glowing edge */}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 animate-pulse" style={{ left: `${data.credibility_score}%` }} />
            </div>
            <div className={`font-mono text-3xl font-bold ${
              data.credibility_score >= 70 ? 'text-[#00FF41]' :
              data.credibility_score >= 40 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              <AnimatedCounter target={data.credibility_score} duration={2000} /><span className="text-gray-500">/100</span>
            </div>
          </div>
        )}

        {/* Verdict with Typewriter */}
        {data.verdict && (
          <div className="text-[#00FF41] font-mono text-center text-lg border-t border-gray-700 pt-4 relative z-10">
            <span className="text-2xl mr-2">⚖️</span>
            <span className="font-bold text-white">VERDICT:</span>{" "}
            <TypewriterText text={data.verdict} speed={25} className="text-[#00FF41]" />
          </div>
        )}

        {/* Fallback to summary if no verdict */}
        {!data.verdict && data.summary && (
          <div className="text-[#00FF41] font-mono text-center text-lg relative z-10">
            <span className="text-2xl mr-2">📋</span>
            <span className="font-bold text-white">SUMMARY:</span>{" "}
            <TypewriterText text={data.summary} speed={20} className="text-[#00FF41]" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

        {/* Verified Matches (Green) */}
        <div className="hover-card card-animate bg-black border border-[#00FF41] p-6 shadow-[0_0_15px_rgba(0,255,65,0.1)]" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#00FF41]">
            <CheckCircle className="w-5 h-5 animate-pulse" /> VERIFIED SKILLS
          </h3>
          <ul className="space-y-2 text-sm text-green-300/80 font-mono">
            {data.matches?.length > 0 ? data.matches.map((m: string, i: number) => (
              <li key={i} className="list-item-animate flex items-start gap-2 hover:bg-[#00FF41]/10 p-1 transition-colors" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <div className="w-2 h-2 bg-[#00FF41] mt-1.5 rounded-full"></div>
                <span>{m}</span>
              </li>
            )) : <li className="text-gray-500">No verified matches found.</li>}
          </ul>
        </div>

        {/* Red Flags (Red - PHANTOMWARE) */}
        <div className="hover-card card-animate bg-black border-2 border-red-600 p-6 shadow-[0_0_20px_rgba(255,50,50,0.3)]" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500 glitch" data-text="🚩 RED FLAGS">
            <ShieldAlert className="w-5 h-5 animate-bounce" /> 🚩 RED FLAGS
          </h3>
          <ul className="space-y-3 text-sm text-red-300 font-mono">
            {data.red_flags?.length > 0 ? data.red_flags.map((m: string, i: number) => (
              <li key={i} className="list-item-animate flex items-start gap-2 bg-red-900/20 p-2 border-l-2 border-red-500 hover:bg-red-900/40 transition-colors cursor-pointer" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                <div className="w-2 h-2 bg-red-500 mt-1.5 rounded-full animate-pulse"></div>
                <span>{m}</span>
              </li>
            )) : <li className="text-green-500">✅ No red flags detected! Clean record.</li>}
          </ul>
        </div>

        {/* Missing Gems (Yellow) */}
        <div className="hover-card card-animate bg-black border border-yellow-400 p-6 shadow-[0_0_15px_rgba(255,255,50,0.1)]" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" /> 💎 HIDDEN GEMS
          </h3>
          <ul className="space-y-2 text-sm text-yellow-200/80 font-mono">
            {data.missing_gems?.length > 0 ? data.missing_gems.map((m: string, i: number) => (
              <li key={i} className="list-item-animate flex items-start gap-2 hover:bg-yellow-500/10 p-1 transition-colors" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <div className="w-2 h-2 bg-yellow-500 mt-1.5 rounded-full"></div>
                <span>{m}</span>
              </li>
            )) : <li className="text-gray-500">No hidden gems found.</li>}
          </ul>
        </div>

      </div>

      <div className="flex justify-center gap-6 mt-8">
        {/* The Rewrite Button (Blue Pill) */}
        <MatrixButton
          onClick={() => onNavigate('chat')}
          variant="cyan"
          className="relative px-8 py-4 bg-transparent border-2 border-cyan-500 text-cyan-500 font-bold text-lg flex items-center gap-2"
        >
          <Wifi className="w-5 h-5" />
          REWRITE RESUME
        </MatrixButton>

        {/* The DEFENSE MODE Button - VOICE INTERVIEW */}
        <MatrixButton
          onClick={() => onNavigate('voice-interview')}
          variant="danger"
          className="relative px-8 py-4 bg-gradient-to-r from-[#FF1744] to-purple-600 text-white font-bold text-lg flex items-center gap-2"
        >
          <Mic className="w-5 h-5 animate-pulse" />
          🎤 VOICE INTERVIEW
          <span className="absolute -top-2 -right-2 bg-green-500 text-black text-xs px-2 py-1 rounded-full font-bold animate-pulse">LIVE</span>
        </MatrixButton>
      </div>
    </div>
  );
};

// --- VIEW 4: VOICE INTERVIEW (Deepgram Voice) ---
const VoiceInterview = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Click START CALL to begin voice interview');
  const [messages, setMessages] = useState<{type: string, text: string}[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Play audio from blob
  const playAudio = (audioBlob: Blob): Promise<void> => {
    return new Promise((resolve) => {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  };

  // Send audio to Deepgram for transcription, then get AI response
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setStatus('Processing your speech...');

    try {
      // 1. Send audio to Deepgram STT
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const sttRes = await axios.post('http://localhost:8000/listen', formData);
      const transcript = sttRes.data.text;

      if (!transcript) {
        setStatus('Could not hear you. Try again.');
        setIsProcessing(false);
        return;
      }

      console.log('Transcribed:', transcript);
      setMessages(prev => [...prev, { type: 'user', text: transcript }]);

      // 2. Get AI response
      const chatRes = await axios.post('http://localhost:8000/voice_chat', { text: transcript });
      const aiResponse = chatRes.data.response;

      setMessages(prev => [...prev, { type: 'ai', text: aiResponse }]);
      setStatus('AI is speaking...');
      setIsSpeaking(true);

      // 3. Get TTS audio from Deepgram
      const ttsForm = new FormData();
      ttsForm.append('text', aiResponse);
      const ttsRes = await axios.post('http://localhost:8000/speak', ttsForm, {
        responseType: 'blob'
      });

      // 4. Play the audio
      await playAudio(ttsRes.data);

      setIsSpeaking(false);
      setStatus('Your turn! Hold mic to speak.');

    } catch (e) {
      console.error('Process error:', e);
      setStatus('Error. Try again.');
    }
    setIsProcessing(false);
  };

  // Start the voice interview
  const startCall = async () => {
    setIsCallActive(true);
    setStatus('Starting interview...');
    setIsProcessing(true);

    try {
      // Get opening question from backend
      const res = await axios.post('http://localhost:8000/interview_start_voice');
      const question = res.data.question || 'Tell me about yourself.';

      setMessages([{ type: 'ai', text: question }]);
      setStatus('AI is speaking...');
      setIsSpeaking(true);

      // Get TTS for opening question
      const ttsForm = new FormData();
      ttsForm.append('text', question);
      const ttsRes = await axios.post('http://localhost:8000/speak', ttsForm, {
        responseType: 'blob'
      });

      await playAudio(ttsRes.data);

      setIsSpeaking(false);
      setStatus('Your turn! Hold mic to speak.');
    } catch (e) {
      console.error('Start error:', e);
      setStatus('Failed to start. Is backend running?');
      setIsCallActive(false);
    }
    setIsProcessing(false);
  };

  // Start recording (hold to talk)
  const startListening = async () => {
    if (isSpeaking || isProcessing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setStatus('🎤 LISTENING... Release to send');
    } catch (e) {
      console.error('Mic error:', e);
      setStatus('Microphone access denied!');
    }
  };

  // Stop recording
  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setStatus('Processing...');
    }
  };

  // End the call
  const endCall = () => {
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop(); } catch(e) {}
    }
    setIsCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setStatus('Call ended. Click START CALL to begin again.');
    setMessages([]);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 relative z-20">
      {/* Navigation Header */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-30">
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-[#00FF41] hover:text-white transition-colors text-sm font-mono flex items-center gap-2 border border-[#003300] hover:border-[#00FF41] px-3 py-2"
        >
          ← DASHBOARD
        </button>
        <div className="flex gap-3">
          <button onClick={() => onNavigate('morpheus')} className="text-xs hover:text-[#00FF41] border border-[#003300] hover:border-[#00FF41] px-3 py-2 transition-colors">[ MENU ]</button>
          <button onClick={() => onNavigate('landing')} className="text-xs text-red-500 hover:text-white border border-red-900 hover:border-red-500 px-3 py-2 transition-colors">[ EXIT ]</button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#FF1744] glitch-text mb-2">🎤 VOICE INTERVIEW</h1>
        <p className="text-gray-500 text-sm">Deepgram Voice • Hold mic to speak</p>
      </div>

      {/* Main Call Interface */}
      <div className="w-full max-w-2xl bg-black/80 border-2 border-[#FF1744] rounded-lg p-8 shadow-[0_0_50px_rgba(255,23,68,0.3)]">

        {/* Status */}
        <div className="text-center mb-6">
          <div className={`text-lg font-mono ${isProcessing ? 'text-yellow-500 animate-pulse' : isSpeaking ? 'text-[#00FF41] animate-pulse' : isListening ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
            {status}
          </div>
        </div>

        {/* Audio Visualizer */}
        <div className="flex justify-center items-center gap-1 h-16 mb-6">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`w-2 rounded-full transition-all duration-100 ${
                isSpeaking ? 'bg-[#00FF41]' : isListening ? 'bg-red-500' : 'bg-gray-700'
              }`}
              style={{
                height: (isSpeaking || isListening)
                  ? `${Math.random() * 50 + 15}px`
                  : '8px',
              }}
            />
          ))}
        </div>

        {/* Messages Display */}
        <div className="mb-6 max-h-40 overflow-y-auto space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`p-3 rounded border ${
              msg.type === 'ai'
                ? 'border-[#00FF41]/50 bg-[#001100] text-[#00FF41]'
                : 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400'
            }`}>
              <div className="text-xs mb-1 opacity-70">
                {msg.type === 'ai' ? 'INTERVIEWER:' : 'YOU:'}
              </div>
              <div className="text-sm">{msg.text}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-6">
          {!isCallActive ? (
            <MatrixButton
              onClick={startCall}
              variant="glow"
              className="flex items-center gap-2 px-8 py-4 bg-[#00FF41] text-black font-bold rounded-full"
            >
              <Phone className="w-6 h-6" />
              START LIVE CALL
            </MatrixButton>
          ) : (
            <>
              {/* Hold-to-Talk Mic Button */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-2 tracking-wider">
                  {isProcessing ? '⏳ PROCESSING...' : isSpeaking ? '🔊 AI SPEAKING...' : isListening ? '🎤 RECORDING...' : 'HOLD TO SPEAK'}
                </div>
                <button
                  onMouseDown={startListening}
                  onMouseUp={stopListening}
                  onMouseLeave={stopListening}
                  onTouchStart={startListening}
                  onTouchEnd={stopListening}
                  disabled={isSpeaking || isProcessing}
                  className={`p-8 rounded-full border-4 transition-all duration-200 relative ${
                    isListening
                      ? 'border-red-500 bg-red-900 scale-125 shadow-[0_0_50px_red,0_0_100px_rgba(255,0,0,0.5)]'
                      : 'border-[#00FF41] bg-black hover:bg-[#003300] hover:scale-110 hover:shadow-[0_0_30px_rgba(0,255,65,0.5)]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {/* Pulse ring when recording */}
                  {isListening && (
                    <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-30" />
                  )}
                  <Mic className={`w-12 h-12 ${isListening ? 'text-white animate-pulse' : 'text-[#00FF41]'}`} />
                </button>
              </div>

              {/* End Call */}
              <button
                onClick={endCall}
                className="p-4 rounded-full bg-red-600 text-white hover:bg-red-500 transition-all"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Instructions */}
        {isCallActive && (
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>🎤 HOLD mic to speak • Release to send • Deepgram voice</p>
          </div>
        )}
      </div>

    </div>
  );
};

// --- VIEW 5: CHAT (TEXT MODE) ---
const ChatInterface = ({ onNavigate, uploadedFile, mode, selectedProject }: { onNavigate: (view: string) => void, uploadedFile: File | null, mode: string, selectedProject: Project | null }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  // Repo Input State
  const [showRepoInput, setShowRepoInput] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [repoLoading, setRepoLoading] = useState(false);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const interviewInitialized = useRef(false);
  const previousMode = useRef(mode);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Check for interview loading
  useEffect(() => {
    const loading = typeof window !== 'undefined' ? localStorage.getItem('interview_loading') : null;
    setIsInterviewLoading(loading === 'true');
  }, [messages]);

  // Reset when mode changes (but not on initial mount)
  useEffect(() => {
    if (previousMode.current !== mode) {
      // Clear messages when switching modes
      setMessages([]);
      setInitialized(false);
      interviewInitialized.current = false;
      previousMode.current = mode;
    }
  }, [mode]);

  // Check for Interview Mode question on load
  useEffect(() => {
    const interviewQuestion = typeof window !== 'undefined' ? localStorage.getItem('interview_intro') : null;
    if (interviewQuestion && !interviewInitialized.current) {
      // INTERVIEW MODE - Don't call handleInit
      interviewInitialized.current = true;
      setInitialized(true);
      setMessages([
        { id: 1, type: 'system', text: '⚠️ DEFENSE MODE INITIATED. INTERROGATION LOGGED.' },
        { id: 2, type: 'ai', text: interviewQuestion }
      ]);
      localStorage.removeItem('interview_intro');
    } else if (uploadedFile && !initialized && !interviewQuestion && mode === 'chat') {
      // CHAT MODE ONLY - Initialize with file and selected project
      handleInit(uploadedFile, selectedProject?.github_url || "");
    }
  }, [uploadedFile, mode, selectedProject]);

  // Listen for storage events (when interview question is loaded)
  useEffect(() => {
    const handleStorageChange = () => {
      const interviewQuestion = localStorage.getItem('interview_intro');
      if (interviewQuestion && mode === 'interview' && !interviewInitialized.current) {
        interviewInitialized.current = true;
        setInitialized(true);
        setMessages([
          { id: 1, type: 'system', text: '⚠️ DEFENSE MODE INITIATED. INTERROGATION LOGGED.' },
          { id: 2, type: 'ai', text: interviewQuestion }
        ]);
        localStorage.removeItem('interview_intro');
        localStorage.removeItem('interview_loading');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mode]);

  useEffect(scrollToBottom, [messages]);

  const handleInit = async (file: File, url: string) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("github_url", url);

    try {
      const res = await axios.post("http://localhost:8000/analyze", formData);
      setInitialized(true);
      const starAnalysis = res.data.initial_chat || "Analysis complete.";
      const projectInfo = selectedProject ? `📁 PROJECT: ${selectedProject.name}` : '';
      setMessages(prev => [
        { id: 1, type: 'system', text: 'ENCRYPTED CHANNEL ESTABLISHED.' },
        ...(projectInfo ? [{ id: 1.5, type: 'system', text: projectInfo }] : []),
        { id: 2, type: 'system', text: 'ASSETS ANALYZED. MEMORY LOADED.' },
        { id: 3, type: 'ai', text: starAnalysis }
      ]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: 3, type: 'system', text: `❌ ERROR: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent | null, overrideInput?: string) => {
    if (e) e.preventDefault();
    const textToSend = overrideInput || input;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), type: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const history = messages.filter(m => m.type !== 'system').map(m => ({ type: m.type, text: m.text }));
      const res = await axios.post("http://localhost:8000/chat", {
        message: textToSend,
        history: history
      });
      const aiResponse = res.data.response;
      const aiMsg = { id: Date.now() + 1, type: 'ai', text: aiResponse };
      setMessages(prev => [...prev, aiMsg]);

    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now(), type: 'system', text: 'CONNECTION DROPPED. RETRY.' }]);
    }
  };

  // Add Repo Logic (Kept same)
  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoUrl) return;
    setRepoLoading(true);
    setShowRepoInput(false);
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: `Scanning Repo: ${newRepoUrl}` }]);

    try {
      const res = await axios.post("http://localhost:8000/add_repo", { github_url: newRepoUrl });
      const bullets = res.data.bullets;
      const msgText = `Extracted Data:\n\n${bullets}\n\nAdd this to 'Projects'?`;
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: msgText }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'system', text: "FAILED TO ACCESS REPO." }]);
    } finally {
      setRepoLoading(false);
      setNewRepoUrl("");
    }
  }

  // --- COMPILE ATS RESUME ---
  const handleCompile = async () => {
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: "COMPILE FINAL ATS DRAFT" }]);
    setMessages(prev => [...prev, { id: Date.now() + 1, type: 'system', text: "COMPILING DATA STREAMS... PLEASE WAIT..." }]);

    try {
      const res = await axios.post("http://localhost:8000/generate_resume");
      const resumeText = res.data.resume;

      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        type: 'ai',
        isResume: true, // Special Flag
        text: resumeText
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 3, type: 'system', text: "COMPILATION FAILED." }]);
    }
  };

  // Show loading screen when initializing chat
  if (loading && !initialized) {
    return (
      <MatrixLoader
        title={`ANALYZING: ${selectedProject?.name || "PROJECT"}...`}
        subtitle={selectedProject?.github_url ? "FETCHING CODE FROM GITHUB..." : "LOADING RESUME DATA..."}
      />
    );
  }

  return (
    <div className="h-screen p-4 md:p-8 flex flex-col md:flex-row gap-6 relative z-20">

      {/* Left: Project Info & Suggestions Panel */}
      <div className="w-full md:w-1/2 bg-[#0a0a0a] border border-[#003300] flex flex-col relative overflow-hidden hidden md:flex">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00FF41]/50"></div>

        {/* Header */}
        <div className="bg-[#0f0f0f] p-3 border-b border-[#003300] flex justify-between items-center">
          <span className="text-xs text-[#00FF41] font-mono flex items-center gap-2">
            <Code className="w-4 h-4" />
            PROJECT INTEL
          </span>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50 animate-pulse"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {isInterviewLoading ? (
            // LOADING ANIMATION
            <div className="flex flex-col items-center justify-center h-full">
              <MatrixRain opacity={0.3} />
              <div className="text-[#00FF41] text-center space-y-6 relative z-10">
                <div className="text-2xl font-bold animate-pulse">ANALYZING CODE...</div>
                <div className="text-sm opacity-70">GENERATING INTERROGATION PROTOCOL</div>
                <div className="w-48 h-2 bg-[#001100] mx-auto relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FF41] to-transparent animate-[loading-bar_1.5s_linear_infinite]"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Project Card */}
              {selectedProject && (
                <div className="hover-card border border-[#00FF41]/30 bg-[#001100] p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-[#00FF41] font-bold text-lg">{selectedProject.name}</h3>
                    {selectedProject.github_url && (
                      <a
                        href={selectedProject.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Github className="w-3 h-3" /> View
                      </a>
                    )}
                  </div>
                  <p className="text-green-700 text-sm mb-3">{selectedProject.description}</p>

                  {/* Tech Stack */}
                  {selectedProject.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="text-xs bg-[#003300] text-green-400 px-2 py-1 rounded hover:bg-[#00FF41]/20 transition-colors"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Tips Section */}
              <div className="border border-yellow-500/30 bg-yellow-900/10 p-4">
                <h4 className="text-yellow-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  QUICK IMPROVEMENT TIPS
                </h4>
                <ul className="space-y-2 text-xs text-yellow-200/80">
                  <li className="flex items-start gap-2 list-item-animate" style={{ animationDelay: '0.1s' }}>
                    <span className="text-yellow-500">→</span>
                    Quantify achievements with metrics (%, $, time saved)
                  </li>
                  <li className="flex items-start gap-2 list-item-animate" style={{ animationDelay: '0.2s' }}>
                    <span className="text-yellow-500">→</span>
                    Use action verbs: Built, Designed, Implemented, Led
                  </li>
                  <li className="flex items-start gap-2 list-item-animate" style={{ animationDelay: '0.3s' }}>
                    <span className="text-yellow-500">→</span>
                    Include tech stack in project descriptions
                  </li>
                  <li className="flex items-start gap-2 list-item-animate" style={{ animationDelay: '0.4s' }}>
                    <span className="text-yellow-500">→</span>
                    Add GitHub links to verify your claims
                  </li>
                </ul>
              </div>

              {/* ATS Keywords Section */}
              <div className="border border-cyan-500/30 bg-cyan-900/10 p-4">
                <h4 className="text-cyan-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  ATS POWER KEYWORDS
                </h4>
                <div className="flex flex-wrap gap-2">
                  {['Agile', 'CI/CD', 'REST API', 'Microservices', 'Cloud', 'Docker', 'Git', 'Testing', 'Scalable', 'Performance'].map((keyword, i) => (
                    <span
                      key={i}
                      className="text-xs bg-cyan-900/30 text-cyan-300 px-2 py-1 rounded border border-cyan-700/30 hover:bg-cyan-500/20 cursor-pointer transition-colors"
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText(keyword);
                      }}
                      title="Click to copy"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Click to copy keyword</p>
              </div>

              {/* Command Shortcuts */}
              <div className="border border-[#00FF41]/30 bg-[#001100] p-4">
                <h4 className="text-[#00FF41] font-bold text-sm mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  QUICK COMMANDS
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center p-2 bg-black/50 hover:bg-[#00FF41]/10 cursor-pointer transition-colors" onClick={() => setInput("Rewrite my project description with metrics")}>
                    <span className="text-gray-400">"Rewrite with metrics"</span>
                    <span className="text-[#00FF41]">→</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-black/50 hover:bg-[#00FF41]/10 cursor-pointer transition-colors" onClick={() => setInput("Make my experience sound more senior")}>
                    <span className="text-gray-400">"Sound more senior"</span>
                    <span className="text-[#00FF41]">→</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-black/50 hover:bg-[#00FF41]/10 cursor-pointer transition-colors" onClick={() => setInput("Add relevant keywords for ATS")}>
                    <span className="text-gray-400">"Add ATS keywords"</span>
                    <span className="text-[#00FF41]">→</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-black/50 hover:bg-[#00FF41]/10 cursor-pointer transition-colors" onClick={() => setInput("Generate a professional summary")}>
                    <span className="text-gray-400">"Generate summary"</span>
                    <span className="text-[#00FF41]">→</span>
                  </div>
                </div>
              </div>

              {/* Stats Mock */}
              <div className="border border-purple-500/30 bg-purple-900/10 p-4">
                <h4 className="text-purple-400 font-bold text-sm mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  SESSION STATS
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-black/30 rounded">
                    <div className="text-2xl font-bold text-[#00FF41]">{messages.filter(m => m.type === 'user').length}</div>
                    <div className="text-xs text-gray-500">Questions</div>
                  </div>
                  <div className="text-center p-2 bg-black/30 rounded">
                    <div className="text-2xl font-bold text-cyan-400">{messages.filter(m => m.type === 'ai').length}</div>
                    <div className="text-xs text-gray-500">Responses</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-[#00FF41]/30 to-transparent animate-scan-line"></div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex flex-col border border-[#00FF41] bg-black/90 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative">

        {/* REPO POPUP */}
        {showRepoInput && (
          <div className="absolute bottom-20 left-4 right-4 bg-black border border-[#00FF41] p-4 shadow-[0_0_20px_rgba(0,255,65,0.2)] z-50 animate-fade-in">
            <div className="text-xs text-[#00FF41] mb-2 font-bold">PASTE REPOSITORY LINK:</div>
            <form onSubmit={handleAddRepo} className="flex gap-2">
              <input type="text" value={newRepoUrl} onChange={(e) => setNewRepoUrl(e.target.value)} placeholder="https://github.com/..." className="flex-1 bg-[#0a0a0a] border border-[#003300] p-2 text-sm text-white focus:border-[#00FF41] outline-none" autoFocus />
              <button type="submit" className="bg-[#003300] text-[#00FF41] px-4 py-2 text-xs hover:bg-[#00FF41] hover:text-black transition-colors">{repoLoading ? "SCANNING..." : "SCAN"}</button>
              <button type="button" onClick={() => setShowRepoInput(false)} className="text-red-500 text-xs px-2">X</button>
            </form>
          </div>
        )}

        <div className="p-4 border-b border-[#00FF41] flex justify-between items-center bg-[#001100]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('project-select')}
              className="text-xs hover:text-[#00FF41] border border-[#003300] hover:border-[#00FF41] px-2 py-1 transition-colors"
            >
              ← PROJECTS
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00FF41] rounded-full animate-pulse"></div>
              <span className="text-sm font-bold tracking-widest">{mode === 'interview' ? 'INTERVIEW MODE' : 'REWRITE MODE'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-xs hover:text-[#00FF41] transition-colors border border-[#003300] hover:border-[#00FF41] px-2 py-1"
            >
              [ DASHBOARD ]
            </button>
            <button onClick={() => onNavigate('morpheus')} className="text-xs hover:text-[#00FF41] border border-[#003300] hover:border-[#00FF41] px-2 py-1 transition-colors">[ MENU ]</button>
            <button onClick={() => onNavigate('landing')} className="text-xs text-red-500 hover:text-white border border-red-900 hover:border-red-500 px-2 py-1 transition-colors">[ EXIT ]</button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-sm custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[95%] p-4 ${msg.type === 'user'
                ? 'border border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : msg.isResume
                  ? 'bg-white text-black font-sans border-4 border-green-500 shadow-[0_0_30px_rgba(255,255,255,0.2)]' // RESUME PAPER STYLE
                  : msg.type === 'system'
                    ? 'border-none text-gray-500 italic text-xs w-full text-center'
                    : 'border-[#00FF41] text-[#00FF41] bg-[#001100]'
                }`}>
                {!msg.isResume && (
                  <span className="font-bold opacity-50 mr-2 block mb-2">
                    {msg.type === 'user' ? '> USER' : msg.type === 'ai' ? '> GITREAL' : ''}
                  </span>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className="p-4 border-t border-[#00FF41] bg-black">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setShowRepoInput(!showRepoInput)} className="text-xs text-gray-500 hover:text-cyan-400 flex items-center gap-1 border border-gray-800 hover:border-cyan-400 px-2 py-1 transition-all"><Code className="w-3 h-3" /> Add Repo</button>
            <button onClick={handleCompile} className="text-xs text-gray-500 hover:text-green-400 flex items-center gap-1 border border-gray-800 hover:border-green-400 px-2 py-1 transition-all"><FileText className="w-3 h-3" /> COMPILE ATS DRAFT</button>
          </div>
          <form onSubmit={(e) => handleSend(e)} className="flex gap-2 items-center">
            <ChevronRight className="w-5 h-5 text-[#00FF41]" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type command..."
              className="flex-1 bg-transparent border-none outline-none text-[#00FF41] placeholder-green-900 font-mono h-10"
              autoFocus
            />

            <button type="submit" className="text-[#00FF41] hover:text-white">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [enableEffects, setEnableEffects] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedMode, setSelectedMode] = useState<'roast' | 'rewrite'>('roast'); // Track which path user chose

  const handleUploadComplete = (file: File) => {
    setUploadedFile(file);
    setCurrentView('morpheus');
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  // Update navigation to go to project selection for both roast and rewrite
  const handleNavigate = (view: string) => {
    if (view === 'dashboard') {
      setSelectedMode('roast');
      setCurrentView('project-select');
    } else if (view === 'chat') {
      setSelectedMode('rewrite');
      setCurrentView('project-select');
    } else {
      setCurrentView(view);
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-[#00FF41] font-mono selection:bg-[#00FF41] selection:text-black ${enableEffects ? 'crt-flicker' : ''}`}>
      <style>{customStyles}</style>

      {/* Background Matrix Effect */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}>
      </div>
      {enableEffects && <div className="scanlines fixed inset-0 pointer-events-none z-50"></div>}

      <div className="absolute top-4 right-4 z-50 flex gap-4 items-center">
        <button
          onClick={() => setEnableEffects(!enableEffects)}
          className="text-xs flex items-center gap-2 border border-[#003300] px-2 py-1 hover:border-[#00FF41] hover:text-[#00FF41] transition-colors text-[#003300]"
        >
          {enableEffects ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {enableEffects ? 'DISABLE FX' : 'ENABLE FX'}
        </button>
      </div>

      <main className="relative z-10">
        {currentView === 'landing' && <UploadLanding onUploadComplete={handleUploadComplete} />}
        {currentView === 'morpheus' && <MorpheusChoice onNavigate={setCurrentView} onModeSelect={setSelectedMode} />}
        {currentView === 'project-select' && (
          <ProjectSelection
            onNavigate={setCurrentView}
            uploadedFile={uploadedFile}
            onProjectSelect={handleProjectSelect}
            mode={selectedMode}
          />
        )}
        {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} uploadedFile={uploadedFile} selectedProject={selectedProject} />}
        {currentView === 'voice-interview' && <VoiceInterview onNavigate={setCurrentView} />}
        {(currentView === 'chat' || currentView === 'interview') && <ChatInterface onNavigate={setCurrentView} uploadedFile={uploadedFile} mode={currentView} selectedProject={selectedProject} />}
      </main>
    </div>
  );
}