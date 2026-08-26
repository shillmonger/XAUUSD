"use client";
import React, { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is SHILLMONGER and how does it work?",
    answer: "SHILLMONGER is an automated XAUUSD trading bot that integrates with your MetaTrader 4 or 5 account. Once connected, our advanced algorithms analyze gold market conditions and execute trades on your behalf, allowing you to participate in gold trading without manual intervention."
  },
  {
    question: "How do I connect my MT4/MT5 account to the bot?",
    answer: "After purchasing a subscription, you'll receive connection instructions. Simply enter your broker account credentials in our secure dashboard, and our system will link your MT4/MT5 account for automated trading execution."
  },
  {
    question: "Can I test the bot on a demo account first?",
    answer: "Absolutely! We strongly recommend testing SHILLMONGER on a demo account first to verify performance and familiarize yourself with the system before connecting a live account with real capital."
  },
  {
    question: "How do subscription plans work?",
    answer: "We offer flexible subscription plans to match different account sizes and trading goals. Each plan provides automated trading for a specified duration (typically 5 days to 1 Month). At the end of your subscription, you can renew or upgrade to continue using the bot."
  },
  {
    question: "How and when can I withdraw my profits?",
    answer: "Profits are calculated and credited to your account according to your subscription plan terms. You can withdraw your profits at any time through your broker account using your preferred payment method."
  },
  {
    question: "Is my broker account information secure?",
    answer: "Yes, security is our top priority. Your broker credentials are encrypted and never shared with third parties. We use industry-standard encryption to protect your account information at all times."
  },
  {
    question: "What lot sizes and risk settings does the bot use on XAUUSD?",
    answer: "SHILLMONGER sizes every XAUUSD trade according to your account balance and selected plan, using predefined risk parameters and stop-loss levels. The bot is built to manage drawdown responsibly rather than force trades during volatile or unfavorable gold market conditions."
  },
  {
    question: "Does the bot only trade gold, or other instruments too?",
    answer: "SHILLMONGER is purpose-built and optimized specifically for XAUUSD. Focusing exclusively on gold allows our algorithms to specialize in its unique volatility and liquidity patterns rather than spreading strategy logic across unrelated markets."
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const half = Math.ceil(faqs.length / 2);
  const leftColumnFaqs = faqs.slice(0, half);
  const rightColumnFaqs = faqs.slice(half);

  return (
    <section id="faq" className="mx-auto max-w-[1500px] px-4 lg:px-8 py-20 w-full text-neutral-900 dark:text-neutral-100 font-sans">
      <div className="text-center mb-5 relative z-10 max-w-xl mx-auto">

        {/* Main Heading */}
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2 text-foreground">
          Frequently Asked Questions
        </h2>

        {/* Centered Paragraph */}
        <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base leading-relaxed">
          Everything you need to know about the SHILLMONGER automated XAUUSD trading bot.
          From MT4/MT5 integration to subscription plans and withdrawals.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-4">
          {leftColumnFaqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {rightColumnFaqs.map((faq, index) => {
            const globalIndex = index + half;
            return (
              <FAQItem
                key={globalIndex}
                faq={faq}
                isOpen={openIndex === globalIndex}
                onClick={() => setOpenIndex(openIndex === globalIndex ? null : globalIndex)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ faq, isOpen, onClick }: { faq: any; isOpen: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`group relative transition-all duration-300 rounded-xl border cursor-pointer overflow-hidden ${
        isOpen
          ? "bg-white dark:bg-neutral-900 border-[#D4AF37]/40 shadow-lg shadow-[#D4AF37]/10"
          : "bg-white/70 dark:bg-neutral-900/70 hover:bg-white dark:hover:bg-neutral-900 border-neutral-200/80 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600 shadow-sm"
      }`}
    >
      <div className="w-full flex items-center justify-between p-4 px-5 text-left">
        <span
          className={`text-base md:text-base font-bold tracking-tight transition-colors ${
            isOpen ? "text-[#14123B] dark:text-white" : "text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white"
          }`}
        >
          {faq.question}
        </span>
        <div className="flex-shrink-0 ml-4">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
              isOpen
                ? "bg-[#D4AF37] text-black rotate-180 shadow-md shadow-[#D4AF37]/30"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700"
            }`}
          >
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="px-6 pb-6 pt-0" onClick={(e) => e.stopPropagation()}>
          <div className="h-[1px] bg-neutral-100 dark:bg-neutral-800 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-sm leading-relaxed font-normal">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
}