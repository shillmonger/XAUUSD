"use client";

import { useRouter } from "next/navigation";
import { Check, X, Info, Sparkles, Infinity as InfinityIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SubscriptionPage() {
  const router = useRouter();

  const commonFeatures = [
    "24/7 Customer Support",
    "Cancel Anytime",
    "Upgrade to Another Plan Anytime",
  ];

  const accessPlans = [
    {
      amount: 0,
      type: "Free",
      period: "No expiry",
      description: "Practice XAUUSD automation on a demo account, risk-free.",
      accountSize: "Demo account",
      duration: "Unlimited",
      lotSize: "0.01",
      maxTrades: 5,
      targetLabel: "Practice",
      popular: false,
      isFree: true,
      planFeatures: [
        "Full bot access on demo",
        "Demo balance never expires",
        "Lot Size: 0.01",
        "No live capital at risk",
      ],
      note:
        "The Free plan runs exclusively on a demo MT5 account so you can test SHILLMONGER's execution and behavior with zero risk, for as long as you like.",
    },
    {
      amount: 10,
      type: "Days",
      period: "per 5 days",
      description: "Short-term automated access for smaller live accounts.",
      accountSize: "$50 – $200",
      duration: "5 Days",
      lotSize: "0.01",
      maxTrades: 5,
      targetLabel: "Up to 40%",
      popular: false,
      isFree: false,
      planFeatures: [
        "Maximum 5 Open Trades",
        "Unlimited Profit Potential",
        "Lot Size: 0.01",
        "Duration: 5 Days",
      ],
      note:
        "The bot only trades when a valid trading opportunity is detected, so the target is not guaranteed within the subscription period. Quality entries are prioritized over trade frequency.",
    },
    {
      amount: 20,
      type: "Weeks",
      period: "per 14 days",
      description: "Our most popular plan for consistent, ongoing automation.",
      accountSize: "$200 – $500",
      duration: "14 Days",
      lotSize: "0.02",
      maxTrades: 10,
      targetLabel: "Up to 60%",
      popular: true,
      isFree: false,
      planFeatures: [
        "Maximum 10 Open Trades",
        "Unlimited Profit Potential",
        "Lot Size: 0.02",
        "Duration: 14 Days",
      ],
      note:
        "The bot only trades when valid opportunities are available, so the target is not guaranteed. Trades are never forced simply to reach it.",
    },
    {
      amount: 50,
      type: "Months",
      period: "per month",
      description: "Full-scale access for larger accounts, no profit cap.",
      accountSize: "$500 – $1,000",
      duration: "1 Month",
      lotSize: "0.03",
      maxTrades: 10,
      targetLabel: "Unlimited",
      popular: false,
      isFree: false,
      planFeatures: [
        "Maximum 10 Open Trades",
        "Unlimited Profit Potential",
        "Lot Size: 0.03",
        "Duration: 1 Month",
      ],
      note:
        "Unlike the Days and Weeks plans, the Months plan has no profit cap. The bot trades for the full subscription period whenever valid opportunities exist; profits depend entirely on market conditions and are not guaranteed.",
    },
  ];

  const comparisonData = [
    {
      metric: "Execution Speed",
      manual: "Slow, limited by human reaction",
      automated: "Instant, algorithmic execution",
    },
    {
      metric: "Strategy",
      manual: "Driven by greed and FOMO",
      automated: "Guided by predefined rules",
    },
    {
      metric: "Consistency",
      manual: "Depends on mood and focus",
      automated: "Stable and rules-based",
    },
    {
      metric: "Availability",
      manual: "Active only when the trader is online",
      automated: "Runs 24/5 without interruptions",
    },
    {
      metric: "Setup & Ease",
      manual: "Complex analysis and a steep learning curve",
      automated: "AI Presets with ready-made GRID/DCA setups",
    },
  ];

  const handleSelectPlan = (plan: string, amount: number) => {
    if (plan === "Free") {
      router.push("/auth-page/register");
      return;
    }
    router.push("/auth-page/login");
  };

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground font-sans pb-24">
      {/* Hero Header */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-10 pt-15 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[10px] font-bold uppercase tracking-widest mb-2 text-[#B8912A] dark:text-[#D4AF37]">
          {/* <Sparkles className="w-3.5 h-3.5" /> */}
          <span>XAUUSD Automated Trading Plans</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-foreground">
          Choose Your <span className="text-[#D4AF37]">Trading Rhythm</span>
        </h1>

        <p className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed mx-auto font-normal">
          Start free on demo, then scale into Days, Weeks, or Months access as your
          account grows. Every paid plan includes automated execution, 24/7 support,
          upgrade flexibility, and risk-managed trading on XAUUSD.
        </p>
      </section>

      {/* Plans Grid */}
      <section className="max-w-[1500px] mx-auto px-4 lg:px-8 pb-10 lg:pb-16 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {accessPlans.map((plan, i) => (
            <Card
              key={i}
              className={`flex flex-col cursor-pointer justify-between rounded-3xl transition-all duration-300 overflow-hidden relative border bg-card text-card-foreground p-6
                ${
                  plan.popular
                    ? "lg:scale-[1.04] z-10 border-[#D4AF37]/60 shadow-2xl shadow-[#D4AF37]/10 ring-1 ring-[#D4AF37]/40"
                    : plan.isFree
                    ? "border-dashed border-border shadow-sm opacity-95 hover:opacity-100"
                    : "border-border shadow-sm opacity-95 hover:opacity-100"
                }
                hover:border-[#D4AF37]/40 group
              `}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-semibold text-foreground">
                    {plan.type}
                  </span>

                  {plan.popular && (
                    <div className="bg-[#D4AF37] text-black text-[10px] font-bold tracking-wider px-3 py-1 rounded-full shadow-sm">
                      Popular
                    </div>
                  )}
                  {plan.isFree && (
                    <div className="bg-muted text-muted-foreground text-[10px] font-bold tracking-wider px-3 py-1 rounded-full">
                      Demo
                    </div>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-extrabold tracking-tight text-foreground">
                    ${plan.amount}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{plan.period}</p>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6 min-h-[40px]">
                  {plan.description}
                </p>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan(plan.type, plan.amount)}
                  className={`w-full cursor-pointer text-sm py-3 px-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 font-bold
                    ${
                      plan.popular
                        ? "bg-[#D4AF37] hover:bg-[#C9A22E] text-black shadow-lg shadow-[#D4AF37]/20"
                        : "bg-foreground text-background hover:opacity-90"
                    }
                  `}
                >
                  {plan.isFree ? (
                    <>
                      {/* <InfinityIcon className="w-4 h-4" /> */}
                      <span>Start Free Demo</span>
                    </>
                  ) : (
                    <span>Choose this plan</span>
                  )}
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-grow flex flex-col justify-between gap-5 mt-6">
                {/* Stats row */}
                <div className="space-y-3 pt-5 border-t border-border">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Account Size</span>
                    <span className="text-foreground font-semibold">{plan.accountSize}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Target</span>
                    <span className="font-semibold px-2.5 py-0.5 rounded-md text-[11px] bg-[#D4AF37]/10 text-[#B8912A] dark:text-[#D4AF37]">
                      {plan.targetLabel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Lot Size &middot; Max Trades</span>
                    <span className="text-foreground font-semibold">
                      {plan.lotSize} &middot; {plan.maxTrades}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 border-t border-border pt-4">
                  {[...commonFeatures, ...plan.planFeatures].map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#D4AF37] stroke-[2.5] shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground font-normal leading-tight">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Important note */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50 border border-border">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#D4AF37]" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-normal">
                    {plan.note}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Comparison Section (Automated vs Manual) */}
      <section className="max-w-[1500px] mx-auto px-4 lg:px-8 mt-6 w-full">
        <div className="max-w-3xl mx-auto pb-8 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Automated vs Manual
          </h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mx-auto font-normal">
            Choose a plan and let our advanced trading systems work for you.
            Earnings topped up automatically every 24 hours.
          </p>
        </div>

        {/* Flat Modern Container Table */}
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-3 border-b border-border bg-muted p-5 text-xs font-bold uppercase tracking-wider">
            <div className="text-foreground">Metric</div>
            <div className="text-rose-500">Manual Trading</div>
            <div className="text-emerald-500">Automated Trading</div>
          </div>

          {/* Table Body rows */}
          <div className="divide-y divide-border">
            {comparisonData.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-3 p-5 gap-3 md:gap-4 items-center hover:bg-muted/40 transition-colors"
              >
                {/* Metric Label */}
                <div className="text-sm font-semibold text-foreground">
                  {row.metric}
                </div>

                {/* Manual Column */}
                <div className="flex items-start gap-2.5 md:pr-4">
                  <span className="md:hidden text-xs font-semibold text-rose-500 block mb-1">
                    Manual:
                  </span>
                  <div className="flex items-start gap-2">
                    <X className="w-4 h-4 stroke-[2.5] text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm text-muted-foreground font-normal leading-relaxed">
                      {row.manual}
                    </span>
                  </div>
                </div>

                {/* Automated Column */}
                <div className="flex items-start gap-2.5">
                  <span className="md:hidden text-xs font-semibold text-emerald-500 block mb-1">
                    Automated:
                  </span>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 stroke-[2.5] text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm text-foreground font-medium leading-relaxed">
                      {row.automated}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}