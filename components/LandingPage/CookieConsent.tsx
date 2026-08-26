"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { IBM_Plex_Mono } from "next/font/google";

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<"accepted" | "declined" | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("cookieConsent") as
      | "accepted"
      | "declined"
      | null;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const [closed, setClosed] = useState(false);

  const handleClose = () => {
    setClosed(true);
    // Re-show after 5 minutes
    setTimeout(() => setClosed(false), 5 * 60 * 1000);
  };

  const handleConsent = (value: "accepted" | "declined") => {
    localStorage.setItem("cookieConsent", value);
    setConsent(value);
  };

  return (
    <AnimatePresence>
      {mounted && consent === null && !closed && (
        <>
          {/* 1. BLUR OVERLAY */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-600 bg-black/70 dark:bg-black/80 backdrop-blur-md"
          />

          {/* 2. CENTERED CARD */}
          <div className="fixed inset-0 z-600 flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-[400px] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 dark:shadow-black/70 ring-1 ring-border dark:ring-border/50 bg-card dark:bg-card"
            >
              {/* Candlestick chart backdrop — same signature motif as the Hero card */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <svg
                  className="absolute inset-0 h-full w-full opacity-[0.12]"
                  viewBox="0 0 440 420"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline
                    points="0,340 30,320 60,350 90,290 120,310 150,250 180,275 210,220 240,245 270,190 300,210 330,160 360,185 390,140 420,165 440,120"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="2"
                  />
                  {[30, 90, 150, 210, 270, 330, 390].map((x, i) => (
                    <rect
                      key={x}
                      x={x - 5}
                      y={i % 2 === 0 ? 330 - i * 24 : 310 - i * 24}
                      width="10"
                      height="28"
                      fill={i % 3 === 0 ? "#EF4444" : "#22C55E"}
                      opacity="0.55"
                    />
                  ))}
                </svg>

                {/* Ambient gold glow, echoes the hero card */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-[200px] w-[200px] rounded-full bg-[#D4AF37]/15 blur-[80px]" />
                <div className="absolute right-0 bottom-0 h-[160px] w-[160px] rounded-full bg-indigo-400/10 blur-[70px]" />
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                aria-label="Dismiss"
                className="absolute top-4 right-4 z-20 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-all p-2 rounded-full border border-transparent hover:border-border"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10 p-6 md:p-8">
                {/* Live status strip — trading-terminal touch */}
                <div className={`${plexMono.className} flex items-center justify-center gap-2 mb-5 text-[10px] uppercase tracking-widest text-primary dark:text-primary`}>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Session Encrypted
                </div>

                {/* Icon */}
                <div className="relative z-10 flex justify-center mb-2">
                <img
                  src="https://i.postimg.cc/L5wkcDJ6/cookie.png"
                  alt="Cookie"
                  className="w-36 h-36 object-contain filter"
                />
              </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">
                    Your Data, Protected
                  </h3>

                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    SHILLMONGER uses essential cookies to secure your session, protect
                    your MT5 account connections, and keep your XAUUSD trading dashboard
                    running smoothly. Continuing means you agree to this.
                  </p>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleConsent("declined")}
                      className="w-full py-3.5 rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-sm tracking-wide border border-border transition-all duration-300 cursor-pointer order-2 sm:order-1"
                    >
                      No thanks
                    </button>
                    <button
                      onClick={() => handleConsent("accepted")}
                      className="w-full py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#C9A22E] text-black font-semibold text-sm tracking-wide transition-all duration-300 cursor-pointer order-1 sm:order-2 hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#D4AF37]/20"
                    >
                      Accept
                    </button>
                  </div>

                  <p className={`${plexMono.className} mt-5 text-[9px] uppercase tracking-widest text-muted-foreground/40`}>
                    256-bit Encryption • MT4/MT5 Secure Link
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}