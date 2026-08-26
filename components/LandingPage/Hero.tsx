"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, MoreVertical } from "lucide-react";
import { Montserrat, IBM_Plex_Mono } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export default function HeroSection() {
  const navPills = [
    { label: "Automated", active: true },
    { label: "Deriv", active: false },
    { label: "MT5", active: false },
  ];

  const bullets = [
    "Connect your MetaTrader 5 account to our automated trading system.",
    "Our bot executes trades when valid market conditions are detected.",
  ];

  return (
    <section className="relative w-full pt-10 lg:pt-10 py-0 lg:py-20 overflow-hidden transition-colors">
      <div className="mx-auto max-w-[1500px] px-4">
        {/* Top Nav Pills (Outside the card) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`${plexMono.className} mb-3 flex items-center gap-2 overflow-x-auto`}
        >
          {navPills.map((pill) => (
            <button
              key={pill.label}
              className={`shrink-0 cursor-pointer rounded-full px-6 py-2 text-xs font-medium tracking-wide transition-colors ${
                pill.active
                  ? "bg-[#D4AF37] text-black"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </motion.div>

        {/* Main Hero Card Container — REMOVED overflow-hidden so children can break out */}
        <div className="relative rounded-[2rem] bg-gradient-to-br from-[#14123B] via-[#1D1B4B] to-[#2A2678] px-4 py-6 md:p-12 lg:p-10 lg:min-h-[550px] flex items-center">

          {/* Background Elements Container — keeps SVG and glows clipped to the card bounds */}
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] overflow-hidden">
            {/* Signature background: faint candlestick chart line */}
            <svg
              className="absolute inset-0 h-full w-full opacity-[0.14]"
              viewBox="0 0 1200 550"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points="0,420 60,400 120,430 180,360 240,380 300,300 360,330 420,260 480,290 540,220 600,250 660,180 720,210 780,150 840,190 900,120 960,160 1020,100 1080,140 1140,80 1200,110"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
              />
              {[60, 180, 300, 420, 540, 660, 780, 900, 1020, 1140].map((x, i) => (
                <rect
                  key={x}
                  x={x - 6}
                  y={i % 2 === 0 ? 400 - i * 28 : 380 - i * 28}
                  width="12"
                  height="34"
                  fill={i % 3 === 0 ? "#EF4444" : "#22C55E"}
                  opacity="0.6"
                />
              ))}
            </svg>

            {/* Subtle glow effects */}
            <div className="absolute left-1/3 top-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-[#D4AF37]/10 blur-[110px]" />
            <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-indigo-400/10 blur-[100px]" />
          </div>

          {/* Grid Layout */}
          <div className="relative grid w-full lg:w-4xl grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left Content Column */}
            <div className="lg:col-span-7 z-10 max-w-xl">
              {/* Bullet Points */}
              <ul className="mb-8 lg:mb-10 space-y-1">
                {bullets.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-xs md:text-sm text-white/70 font-medium leading-relaxed">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#D4AF37]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {/* Main Headline */}
              <h1 className={`${montserrat.className} font-black text-5xl md:text-6xl uppercase tracking-tight text-white leading-[1.05] mb-8 lg:mb-10`}>
                The Smarter Way to Trade XAUUSD -{" "}
                <span className="bg-gradient-to-r from-[#F5C451] via-[#D4AF37] to-[#F5C451] bg-clip-text text-transparent">
                  GOLD
                </span>
              </h1>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-4 lg:gap-6">

                <Link
                  href="/auth-page/login"
                  className="w-full sm:w-auto text-center rounded-full cursor-pointer bg-white px-7 py-4 font-bold uppercase tracking-widest text-sm text-black transition-transform hover:scale-105 active:scale-95"
                >
                  Sign in Account
                </Link>
                <Link href="/auth-page/register" className="flex text-center justify-center w-full sm:w-auto rounded-full cursor-pointer bg-[#D4AF37] px-7 py-4 font-bold uppercase tracking-widest text-sm text-black ring-1 ring-white/10 transition-all hover:scale-105 hover:ring-[#D4AF37]/50 active:scale-95">
                    Start free trial
                                <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Right Column: Mobile Phone image & desktop spacer */}
            <div className="lg:col-span-5 relative">
              {/* Mobile / tablet inline image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative mx-auto h-[500px] w-full overflow-hidden rounded-0xl lg:hidden"
              >
                <Image
                  src="/phone-half.png"
                  alt="Phone Screen App Interface"
                  fill
                  priority
                  className="object-cover object-top"
                />
              </motion.div>

              {/* Mobile stat pills under the image */}
              <div className={`${plexMono.className} mt-5 flex flex-wrap justify-center gap-3 lg:hidden`}>
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-medium text-neutral-800">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  +45 pips • $320
                </div>
                <div className="flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2 text-[11px] font-semibold text-black">
                  Profit +$1,245.00
                </div>
              </div>

              {/* Desktop-only reserved space */}
              <div className="hidden lg:block h-[500px]" />
            </div>

          </div>

          {/* ------------------------------------------------------------- */}
          {/* OVERLAY ELEMENTS (Breakout Phone Mockup & Floating Cards) */}
          {/* ------------------------------------------------------------- */}

          {/* 1. Trading Activity Floating Box (Left of Phone) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden xl:block absolute left-[46%] top-1/2 -translate-y-1/2 z-60 w-[240px] rounded-2xl bg-white p-4 text-neutral-800 text-xs"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 mb-3 font-semibold">
              <span className="rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] text-black">
                Trading Activity
              </span>
              <span className={`${plexMono.className} text-[10px] text-neutral-400`}>Today</span>
            </div>

            <div className={`${plexMono.className} space-y-2.5 text-[11px]`}>
              <div>
                <div className="flex items-center justify-between font-medium">
                  <span>XAUUSD Buy Order</span>
                  <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[9px] text-[#16A34A] font-semibold">Profit</span>
                </div>
                <p className="text-[10px] text-neutral-400">+45 pips • $320</p>
              </div>

              <div>
                <div className="flex items-center justify-between font-medium">
                  <span>XAUUSD Sell Order</span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] text-indigo-600 font-semibold">Active</span>
                </div>
                <p className="text-[10px] text-neutral-400">Entry: 2345.50</p>
              </div>

              <div className="pl-3 space-y-2 border-l-2 border-neutral-100">
                <div className="flex items-center justify-between">
                  <span>Trade #3: Gold Scalp</span>
                  <span className="h-3.5 w-3.5 rounded-full bg-[#22C55E] flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </span>
                </div>

                <div className="rounded-full bg-black text-white p-2 font-medium">
                  Trade #4: Breakout
                </div>

                <div className="text-neutral-500">
                  Trade #5: Pending
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. Phone Mockup Frame (Now cleanly extends outside top & bottom via z-50) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block lg:absolute lg:right-[17%] lg:-top-15 lg:-bottom-15 z-50 w-full max-w-[350px] mx-auto lg:mx-0 rounded-[2rem] overflow-hidden ring-white/10"
          >
            <div className="relative w-full h-full min-h-[580px]">
              <Image
                src="/Trade.png"
                alt="Phone Screen App Interface"
                fill
                priority
                className="object-cover rounded-[2rem]"
              />
            </div>
          </motion.div>

          {/* 3. Right Floating Overlay Stack */}
          <div className="hidden lg:flex flex-col gap-4 absolute right-4 xl:right-20 top-12 z-60">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-[210px] rounded-full bg-white p-1.5 flex items-center gap-3 text-xs"
            >
              <div className="h-10 w-10 relative rounded-full overflow-hidden shrink-0 ring-2 ring-[#D4AF37]/40">
                <Image
                  src="/pfp.png"
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <div className={`${plexMono.className} min-w-0`}>
                <p className="text-[10px] text-neutral-400 font-sans">Trade Executed</p>
                <p className="font-semibold text-neutral-800 text-[11px] truncate">
                  XAUUSD Buy at 2342.15
                </p>
                <span className="text-[9px] text-neutral-400">9:45 AM</span>
              </div>
            </motion.div>
          </div>

          {/* 4. Bottom Trading Stats Card */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="hidden lg:block absolute right-[6%] bottom-0 z-60 w-[210px] rounded-2xl bg-white p-3 text-xs space-y-2"
          >
            <div className="flex items-center justify-between text-neutral-800 font-semibold">
              <span>Today's Stats</span>
              <button className="flex items-center gap-0.5 text-[9px] border border-neutral-200 rounded-full px-2 py-0.5 text-neutral-500 hover:border-neutral-300 transition-colors">
                <Plus className="h-2.5 w-2.5" /> View
              </button>
            </div>

            <div className="rounded-xl border border-neutral-100 p-2 flex justify-between items-center">
              <div>
                <p className="font-semibold text-neutral-800 text-[11px]">Total Trades</p>
                <p className={`${plexMono.className} text-[9px] text-neutral-400`}>12 executed</p>
              </div>
              <MoreVertical className="h-3 w-3 text-neutral-400" />
            </div>

            <div className="rounded-xl bg-[#D4AF37] p-2 flex justify-between items-center text-black">
              <div>
                <p className="font-semibold text-[11px]">Profit</p>
                <p className={`${plexMono.className} text-[9px] text-black/70`}>+$1,245.00</p>
              </div>
              <MoreVertical className="h-3 w-3 text-black/70" />
            </div>
          </motion.div> */}

        </div>
      </div>
    </section>
  );
}