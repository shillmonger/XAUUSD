"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Send,
  ShieldCheck,
  Zap,
  Coins,
} from "lucide-react";
import { FaTelegram, FaDiscord, FaTwitter, FaGithub, FaWhatsapp } from "react-icons/fa";
import { IBM_Plex_Mono } from "next/font/google";
import ScrollToTop from "./ScrollToTop";

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

const footerLinks = {
  Company: [
    { name: "Deriv Platform", href: "https://www.deriv.com/" },
    { name: "TradingView", href: "https://www.tradingview.com/" },
    { name: "MetaTrader 5", href: "https://www.metatrader5.com/" },
    { name: "Forex Factory", href: "https://www.forexfactory.com/" },
  ],
  Resources: [
    { name: "Customer Support", href: "/support" },
    { name: "Community Hub", href: "/community" },
    { name: "Developers Portal", href: "/developers" },
    { name: "Guides & Tutorials", href: "/guides" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Cookies Policy", href: "/cookies" },
    { name: "Refund Policy", href: "/refund" },
    { name: "Terms & Conditions", href: "/terms" },
  ],
};

export default function Footer() {
  const socialLinks = [
    { name: "Telegram", icon: <FaTelegram size={18} />, href: "#" },
    { name: "Discord", icon: <FaDiscord size={18} />, href: "#" },
    { name: "X (Twitter)", icon: <FaTwitter size={18} />, href: "#" },
    { name: "WhatsApp", icon: <FaWhatsapp size={18} />, href: "#" },
    { name: "GitHub", icon: <FaGithub size={18} />, href: "#" },
  ];

  return (
    <section className="relative mt-0 lg:mt-10 w-full text-neutral-50 font-sans lg:pb-4">
      {/* Footer Outer Container — matches Hero's navy-to-indigo gradient theme */}
      <footer className="m-0 lg:mx-[30px] relative bg-gradient-to-br from-[#14123B] via-[#1D1B4B] to-[#2A2678] border border-[#D4AF37]/10 lg:rounded-[2rem] overflow-hidden shadow-2xl shadow-black/40">

        {/* Background Elements — same signature candlestick motif as Hero, kept faint */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.07]"
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

          {/* Subtle Ambient Gold + Indigo Glow, mirroring Hero card lighting */}
          <div className="absolute left-1/4 top-0 h-[300px] w-[300px] rounded-full bg-[#D4AF37]/10 blur-[110px]" />
          <div className="absolute right-0 top-0 h-40 bg-gradient-to-b from-indigo-400/10 via-transparent to-transparent w-full pointer-events-none" />
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-[1500px] mx-auto px-5 lg:px-12 pt-10 md:pt-24 lg:pt-16 pb-5">

          {/* Top Row */}
          <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-16">

            {/* Brand details */}
            <div className="max-w-sm">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                    SHILL<span className="text-[#D4AF37]">MONGER</span>
                  </h2>
                  <p className={`${plexMono.className} text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D4AF37]`}>
                    Trading Intelligence
                  </p>
                </div>
              </Link>

              <p className="mt-4 text-sm leading-relaxed text-white/70 font-normal">
                Automate your trading with confidence. Choose a subscription plan that matches your account size and let our intelligent trading system execute trades whenever valid market opportunities arise.
              </p>

              {/* Social Icons */}
              <div className="flex gap-2.5 mt-6">
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className="w-11 h-11 rounded-xl border border-[#D4AF37]/20 bg-white/5 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all duration-300 flex items-center justify-center text-white"
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </div>

            {/* Navigation links */}
            <div className="flex flex-col lg:flex-row justify-between lg:justify-end flex-1 lg:flex-initial lg:ml-auto gap-10 lg:gap-16">
              {Object.entries(footerLinks).map(([title, items]) => (
                <div key={title} className="min-w-[140px]">
                  <h3 className={`${plexMono.className} text-xs uppercase tracking-[0.15em] font-bold text-[#D4AF37] mb-5`}>
                    {title}
                  </h3>
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-medium"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>


          {/* Trust Badges */}
          <div className="max-w-[1500px] mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-[#D4AF37]/15 pt-12">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-[#D4AF37]" size={22} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white uppercase tracking-wide">Secure Trading</h4>
                <p className="text-xs text-white/60 mt-1">Your account credentials are encrypted and never shared.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center shrink-0">
                <Zap className="text-[#D4AF37]" size={22} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white uppercase tracking-wide">Real-Time Execution</h4>
                <p className="text-xs text-white/60 mt-1">Lightning-fast trade execution on valid market conditions.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center shrink-0">
                <Coins className="text-[#D4AF37]" size={22} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white uppercase tracking-wide">MT4/MT5 Compatible</h4>
                <p className="text-xs text-white/60 mt-1">Seamlessly integrates with MetaTrader 4 and 5 platforms.</p>
              </div>
            </div>
          </div>


          {/* Financial Disclaimer */}
          <div className="max-w-[1500px] mx-auto mt-6 space-y-5 text-xs leading-relaxed text-white/60 pt-2">

            {/* Risk Disclosure */}
            <div className="space-y-2 border-t border-[#D4AF37]/15 pt-6">
              <p className="text-xs font-normal">
                <span className={`${plexMono.className} font-bold text-[#D4AF37]`}>RISK DISCLOSURE:</span>{" "}
                Trading Forex and other financial markets involves substantial risk and may not be suitable for every investor. Our automated trading bot executes trades based on predefined trading strategies and valid market conditions. While our system is designed to identify quality trading opportunities, profits are never guaranteed, and losses can occur. Users should only trade with funds they can afford to lose.
              </p>
            </div>

            {/* Service Disclaimer */}
            <div className="space-y-2 border-t border-[#D4AF37]/15 pt-6">
              <p className={`${plexMono.className} font-bold text-[#D4AF37] uppercase tracking-wider text-xs`}>
                SERVICE DISCLAIMER
              </p>

              <p className="text-xs font-normal">
                SHILLMONGER provides subscription-based access to an automated trading bot that places trades on connected MetaTrader 5 accounts according to each user's selected plan. The bot only executes trades when valid market conditions are detected and does not force trades during unfavorable market conditions. Performance targets described in each subscription plan are objectives rather than guarantees and may vary depending on market volatility and available trading opportunities.
              </p>
            </div>

            {/* User Responsibility */}
            <div className="space-y-2 border-t border-[#D4AF37]/15 pt-6">
              <p className={`${plexMono.className} font-bold text-[#D4AF37] uppercase tracking-wider text-xs`}>
                USER RESPONSIBILITY
              </p>

              <p className="text-xs font-normal">
                By subscribing, users acknowledge the risks associated with financial market trading and remain fully responsible for their trading accounts, broker selection, and deposited funds. It is the user's responsibility to ensure their account meets the minimum requirements for their selected subscription plan.
              </p>
            </div>

          </div>

          {/* Final Copyright & Details */}
          <div className="max-w-[1500px] mx-auto border-t border-[#D4AF37]/15 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/60">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
              <p className="font-semibold text-white">© {new Date().getFullYear()} SHILLMONGER. All rights reserved.</p>
              <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-start gap-x-4 gap-y-2">
                <Link href="/landing-page/privacy" className="hover:text-[#D4AF37] transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/landing-page/terms" className="hover:text-[#D4AF37] transition-colors">
                  Investor Agreement
                </Link>
                <Link href="/landing-page/refund" className="hover:text-[#D4AF37] transition-colors">
                  Refunds Policy
                </Link>
                <Link href="/landing-page/security" className="hover:text-[#D4AF37] transition-colors">
                  Security Policy
                </Link>
              </div>
            </div>
            <p className="text-center md:text-right max-w-md text-white/50 text-[11px] leading-relaxed">
              Trading involves risk and profits are never guaranteed. SHILLMONGER provides subscription-based access to an automated trading bot for MetaTrader 5. By using this platform, you acknowledge and accept our Risk Disclosure and Terms of Service.
            </p>
          </div>

        </div>
      </footer>
      <ScrollToTop />
    </section>
  );
}