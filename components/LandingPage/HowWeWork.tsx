"use client";
// components/landing-page/why-platform-section.tsx
import React from "react";
import {
  UserPlus,
  CreditCard,
  Link as LinkIcon,
  TestTubeDiagonal,
  ArrowUpFromLine,
  RefreshCw,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function WhyPlatformSection() {
  const steps = [
    {
      step: "01",
      title: "Create Account",
      desc: "Join SHILLMONGER in seconds. Our registration is fast, encrypted, and built to protect your identity from day one.",
      icon: <UserPlus className="w-[18px] h-[18px] text-blue-500" />,
    },
    {
      step: "02",
      title: "Connect & Test Demo",
      desc: "Connect and test on a demo account first to ensure everything works perfectly before using real funds.",
      icon: <TestTubeDiagonal className="w-[18px] h-[18px] text-emerald-500" />,
    },
    {
      step: "03",
      title: "Buy Bot Subscription",
      desc: "Purchase a bot subscription plan that suits your trading goals and budget.",
      icon: <CreditCard className="w-[18px] h-[18px] text-purple-500" />,
    },
    {
      step: "04",
      title: "Fund & Connect MT5",
      desc: "Fund real money on your broker, connect to MT5 and link it to your account for automated trading.",
      icon: <LinkIcon className="w-[18px] h-[18px] text-orange-500" />,
    },
    {
      step: "05",
      title: "Withdraw Profits",
      desc: "Withdraw your profits at the end of your subscription period to your preferred payment method.",
      icon: <ArrowUpFromLine className="w-[18px] h-[18px] text-amber-500" />,
    },
    {
      step: "06",
      title: "Renew or Upgrade",
      desc: "At the end of each subscription, buy a new one or upgrade to continue using our bot and maximize your trading potential.",
      icon: <RefreshCw className="w-[18px] h-[18px] text-rose-500" />,
    },
  ];

  return (
    <section
      id="why-this-platform"
      className="mx-auto max-w-[1500px] px-4 lg:px-8 py-20 lg:py-0 w-full"
    >
      {/* Header */}
      <div className="mb-5">

        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2">
          How It Works
        </h2>

        <p className="text-muted-foreground max-w-lg text-base md:text-lg font-light leading-relaxed">
          A streamlined 6-step journey — from sign-up to subscription renewal
          with institutional-grade efficiency.
        </p>
      </div>

      {/* Desktop / Tablet Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {steps.map((step, index) => (
          <StepCard key={index} step={step} />
        ))}
      </div>

      {/* Mobile Carousel */}
      <div className="md:hidden">
        <Carousel className="w-full">
          <CarouselContent>
            {steps.map((step, i) => (
              <CarouselItem key={i}>
                <StepCard step={step} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-8 flex items-center justify-center gap-6">
            <CarouselPrevious className="static translate-y-0 w-11 h-11 bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-xl" />
            <CarouselNext className="static translate-y-0 w-11 h-11 bg-primary/8 hover:bg-primary/15 border border-primary/20 rounded-xl" />
          </div>
        </Carousel>
      </div>

      {/* Footer rule */}
      <div className="mt-5 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium whitespace-nowrap">
          Start your journey today
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </section>
  );
}

// ─── Step Card Sub-component ──────────────────────────────────────────────────

type Step = {
  step: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
};

function StepCard({ step }: { step: Step }) {
  return (
    <div className="group relative rounded-2xl cursor-pointer border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.15)] cursor-default overflow-hidden">
      {/* Top accent line — visible on hover */}
      <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-primary to-primary/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* Step label + Icon */}
      <div className="flex items-start justify-between mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
          Step {step.step}
        </span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-[10px] border transition-colors duration-200 group-hover:opacity-80 ${
          step.step === "01" ? "border-blue-500/20 bg-blue-500/10 text-blue-500" :
          step.step === "02" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" :
          step.step === "03" ? "border-purple-500/20 bg-purple-500/10 text-purple-500" :
          step.step === "04" ? "border-orange-500/20 bg-orange-500/10 text-orange-500" :
          step.step === "05" ? "border-amber-500/20 bg-amber-500/10 text-amber-500" :
          "border-rose-500/20 bg-rose-500/10 text-rose-500"
        }`}>
          {step.icon}
        </div>
      </div>

      {/* Text */}
      <h3 className="font-bold text-[1rem] tracking-tight text-foreground mb-2">
        {step.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed font-light">
        {step.desc}
      </p>
    </div>
  );
}