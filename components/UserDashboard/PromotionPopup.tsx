"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ChartSpline, TrendingUp, ShieldCheck } from "lucide-react";


// const IMAGES = [
//   "https://i.postimg.cc/gkW8VrZk/Banner-1.jpg",
//   "https://i.postimg.cc/jS8fYX3G/Banner-2.jpg",
//   "https://i.postimg.cc/7LdTfLkX/Banner-3.jpg",
//   "https://i.postimg.cc/15BnDBSY/Banner-4.webp",
//   "https://i.postimg.cc/gjdjZXBs/Banner-5.jpg",
//   "https://i.postimg.cc/Zqd5sFG6/Banner-6.jpg",
// ];
const IMAGES = [
  "https://i.postimg.cc/ZnDX5Ff3/5.jpg",
  "https://i.postimg.cc/VvF1MffN/Bull-and-Bear.jpg",
  "https://i.postimg.cc/9Q9sc9yF/6.jpg",
];

export default function GiftMember({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Automatic Image Slider - Fixed to prevent memory leaks
  useEffect(() => {
    if (isOpen) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
      }, 4000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOpen]); // Only run interval when open

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        className="relative w-full max-w-[400px] bg-card rounded-[1.5rem] overflow-hidden shadow-2xl border border-border/50 transition-shadow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Image Slider Section */}
        <div className="relative h-[200px] overflow-hidden group">
          <AnimatePresence initial={false} mode="wait">
            <motion.img
              key={currentIndex}
              src={IMAGES[currentIndex]}
              // Change: initial opacity to 0, but since they animate 
              // at the same time, crossfade will be seamless.
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 1, // Slightly longer duration makes the crossfade smoother
                ease: "easeInOut" 
              }}
              className="absolute inset-0 w-full h-full object-cover"
              alt="Trading Empowerment"
            />
          </AnimatePresence>

          {/* Overlays & Badges - Ensure these stay ABOVE images */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-black/20 z-[1]" />
  
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute cursor-pointer top-5 right-5 w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
  
          <div className="absolute top-5 left-5 flex gap-2 z-20">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
              Rewards
            </span>
            <span className="px-3 py-1 bg-primary/80 backdrop-blur-md rounded-full text-[10px] font-bold text-primary-foreground uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secure
            </span>
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {IMAGES.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrentIndex(i)} // Added clickability for convenience
                className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 lg:8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tighter">
              <ChartSpline className="w-4 h-4" />
              <span>Market Predictions Live</span>
            </div>
            <h2 className="text-2xl font-black text-foreground leading-tight tracking-tight">
              Predict Gold Price
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium">
              Test your market analysis skills. Predict if gold prices will go up or down. Win predictions to earn $5 daily.
            </p>
          </div>

          {/* Stats/Info Row */}
          <div className="flex items-center justify-between py-4 border-y border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Rewards</p>
                <p className="text-sm font-bold">$5 Per Win</p>
              </div>
            </div>
            <div className="text-right font-mono text-sm font-black text-primary">
              DAILY CHALLENGE
            </div>
          </div>

          {/* Action Button */}
          <Link href="/user-dashboard/predict">
            <button className="group relative w-full cursor-pointer bg-[#D4AF37] text-black font-bold py-3 px-6 rounded-2xl flex items-center justify-between overflow-hidden transition-all hover:pr-8 active:scale-[0.98]">
              <span className="relative z-10">Predict XAUUSD</span>
              <div className="h-8 w-8 bg-background/20 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}