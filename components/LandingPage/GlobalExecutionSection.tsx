"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Layers, Target } from "lucide-react";
import { IBM_Plex_Mono } from "next/font/google";

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export default function GlobalExecutionSection() {
  return (
    <section className="hidden lg:block relative w-full overflow-hidden py-20 md:py-0">
      {/* Ambient gold glow, consistent with rest of the site */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[700px] rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-[1500px] px-5 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
            Execution <span className="text-primary">Infrastructure</span>
          </h2>

          <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Network Intelligence
          </div>
        </motion.div>

        {/* ── Content Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-6 max-w-lg"
          >
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Most bots run from a single server, exposed to slippage, requotes,
              and delayed fills whenever the connection to your broker isn't optimized.
              Latency is rarely measured, and almost never engineered for.
            </p>
            <p className="mt-4 text-muted-foreground text-sm md:text-base leading-relaxed">
              <span className="text-white font-semibold bg-primary/10 px-2 py-1 rounded bg-gradient-to-br from-[#14123B] via-[#1D1B4B] to-[#2A2678]">SHILLMONGER</span> runs
              on a distributed VPS network positioned close to major broker servers,
              translating proximity into faster fills and tighter execution on every
              XAUUSD trade.
            </p>
          </motion.div>

          {/* Right stat cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-6 grid grid-cols-2 gap-4 w-full lg:max-w-md lg:ml-auto"
          >
            <div className="rounded-2xl border border-[#D4AF37]/15 bg-gradient-to-br from-[#14123B] via-[#1D1B4B] to-[#2A2678] p-5">
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-black text-white">12 Nodes</span>
                <div className="h-9 w-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-[#D4AF37]" />
                </div>
              </div>
              <p className={`${plexMono.className} text-[10px] uppercase tracking-widest text-white/40`}>
                Global VPS Network
              </p>
            </div>

            <div className="rounded-2xl border border-[#D4AF37]/15 bg-gradient-to-br from-[#14123B] via-[#1D1B4B] to-[#2A2678] p-5">
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-black text-white">0.3s</span>
                <div className="h-9 w-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-[#D4AF37]" />
                </div>
              </div>
              <p className={`${plexMono.className} text-[10px] uppercase tracking-widest text-white/40`}>
                Avg. Execution Edge
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Map ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative mt-5 md:mt-0"
        >

          <div className="relative w-full aspect-[16/8] md:aspect-[16/7]">
            {/* Gold-tinted VPS map graphic */}
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]">
              <Image
                src="/map_vps.svg"
                alt="Global VPS execution network map"
                fill
                className="object-contain object-top opacity-90"
                style={{ filter: "grayscale(0) brightness(0.9)" }}
              />
              <div className="absolute inset-0 mix-blend-color pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}