"use client";

import { useState } from "react";
import {
  Plug,
  Unplug,
  ShieldCheck,
  Zap,
  Activity,
  Rocket,
  AlertCircle,
  CheckCircle2,
  Play,
  Pause,
  Power,
  Wallet,
  Crown,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const GOLD = "#D4AF37";

function StatusBadge({
  status,
}: {
  status: "CONNECTED" | "DISCONNECTED" | "ACTIVE" | "PAUSED" | "OFF" | "DEMO" | "LIVE";
}) {
  const isPositive = ["CONNECTED", "ACTIVE", "DEMO", "LIVE"].includes(status);
  const isWarning = ["PAUSED"].includes(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
        isPositive
          ? "border-emerald-500/20 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : isWarning
            ? "border-amber-500/20 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
            : "border-red-500/20 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isPositive && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            isPositive ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-red-500"
          }`}
        />
      </span>
      {status}
    </span>
  );
}

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-[#D4AF37] shadow-[0_0_0_1px_rgba(212,175,55,0.15)] dark:bg-zinc-100">
      {children}
    </div>
  );
}

export default function ConnectDerivPage() {
  // Mock state management
  const [derivConnected, setDerivConnected] = useState(false);
  const [accountId, setAccountId] = useState("CR****1234");
  const [accountType, setAccountType] = useState<"DEMO" | "LIVE">("DEMO");
  const [accountStatus, setAccountStatus] = useState("Active");
  const [botStatus, setBotStatus] = useState<"ACTIVE" | "PAUSED" | "OFF">("OFF");
  const [subscriptionStatus, setSubscriptionStatus] = useState(false);

  // Mock connect/disconnect functionality
  const handleConnectDeriv = () => {
    setDerivConnected(true);
    setAccountType("DEMO");
    setAccountStatus("Active");
  };

  const handleDisconnectDeriv = () => {
    setDerivConnected(false);
    setBotStatus("OFF");
  };

  // Mock account type switching
  const handleSwitchAccountType = (type: "DEMO" | "LIVE") => {
    setAccountType(type);
    if (type === "DEMO") {
      setBotStatus("OFF");
    }
  };

  // Mock bot control
  const handleToggleBot = () => {
    if (botStatus === "OFF") {
      if (accountType === "LIVE" && !subscriptionStatus) {
        return; // Cannot start without subscription
      }
      setBotStatus("ACTIVE");
    } else if (botStatus === "ACTIVE") {
      setBotStatus("PAUSED");
    } else {
      setBotStatus("ACTIVE");
    }
  };

  // Mock demo trading start
  const handleStartDemoTrading = () => {
    setAccountType("DEMO");
    setBotStatus("ACTIVE");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 py-6">
        {/* Page Header */}
        <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 p-6 shadow-sm dark:from-zinc-100 dark:via-zinc-100 dark:to-zinc-50 lg:p-8">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ background: GOLD }}
          />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] ring-1 ring-[#D4AF37]/30">
              <Plug className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                <Sparkles className="h-3 w-3" />
                Copy Trading
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white dark:text-zinc-900 lg:text-3xl">
                Deriv Connection &amp; Copy Trading
              </h1>
              <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600">
                Connect your Deriv account, test demo trading, and manage your copy trading bot.
              </p>
            </div>
          </div>
        </section>

        {/* Connect Deriv Account Section */}
        <section>
          <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SectionIcon>
                    {derivConnected ? <ShieldCheck className="h-5 w-5" /> : <Unplug className="h-5 w-5" />}
                  </SectionIcon>
                  <div>
                    <CardTitle className="text-base">Deriv Account Connection</CardTitle>
                    <CardDescription className="text-xs">
                      {derivConnected ? "Your Deriv account is connected" : "Connect your Deriv account to begin copy trading"}
                    </CardDescription>
                  </div>
                </div>
                <StatusBadge status={derivConnected ? "CONNECTED" : "DISCONNECTED"} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!derivConnected ? (
                <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-border/60 py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Unplug className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold">Not Connected</h3>
                    <p className="max-w-md text-xs text-muted-foreground">
                      Connect your Deriv account to begin demo or live copy trading. Your connection is secure and handled through Deriv's authorization.
                    </p>
                  </div>
                  <Button
                    onClick={handleConnectDeriv}
                    className="bg-[#D4AF37] text-black shadow-sm transition-transform hover:scale-[1.02] hover:bg-[#c9a227]"
                  >
                    <Plug className="mr-2 h-4 w-4" />
                    Connect Deriv Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 rounded-xl bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Account ID
                      </p>
                      <p className="text-sm font-medium">{accountId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Account Type
                      </p>
                      <StatusBadge status={accountType} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Account Status
                      </p>
                      <p className="text-sm font-medium">{accountStatus}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Last Updated
                      </p>
                      <p className="text-sm font-medium">Just now</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleDisconnectDeriv} variant="destructive" size="sm">
                      <Unplug className="mr-2 h-4 w-4" />
                      Disconnect Account
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Account Type / Mode Section */}
        {derivConnected && (
          <section>
            <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Account Mode</CardTitle>
                <CardDescription className="text-xs">Select your trading environment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => handleSwitchAccountType("DEMO")}
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition-all ${
                      accountType === "DEMO"
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_0_4px_rgba(212,175,55,0.08)]"
                        : "border-border/50 hover:border-[#D4AF37]/50"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        accountType === "DEMO" ? "bg-[#D4AF37] text-black" : "bg-muted"
                      }`}
                    >
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 text-center">
                      <h3 className="text-sm font-bold">Demo Account</h3>
                      <p className="text-[10px] text-muted-foreground">
                        Practice copy trading without using real funds
                      </p>
                    </div>
                    {accountType === "DEMO" && (
                      <div className="absolute right-2 top-2">
                        <CheckCircle2 className="h-5 w-5 text-[#D4AF37]" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => handleSwitchAccountType("LIVE")}
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition-all ${
                      accountType === "LIVE"
                        ? "border-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_0_4px_rgba(212,175,55,0.08)]"
                        : "border-border/50 hover:border-[#D4AF37]/50"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full ${
                        accountType === "LIVE" ? "bg-[#D4AF37] text-black" : "bg-muted"
                      }`}
                    >
                      <Crown className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 text-center">
                      <h3 className="text-sm font-bold">Live Account</h3>
                      <p className="text-[10px] text-muted-foreground">
                        Copy trades using your live Deriv account
                      </p>
                    </div>
                    {accountType === "LIVE" && (
                      <div className="absolute right-2 top-2">
                        <CheckCircle2 className="h-5 w-5 text-[#D4AF37]" />
                      </div>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Copy Trading / Bot Control Section */}
        {derivConnected && (
          <section>
            <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SectionIcon>
                      <Zap className="h-5 w-5" />
                    </SectionIcon>
                    <div>
                      <CardTitle className="text-base">Copy Trading Bot</CardTitle>
                      <CardDescription className="text-xs">Control your automated copy trading</CardDescription>
                    </div>
                  </div>
                  <StatusBadge status={botStatus} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Current Trading Mode
                    </p>
                    <p className="text-sm font-medium">
                      {accountType === "DEMO" ? "Demo Copy Trading" : "Live Copy Trading"}
                    </p>
                  </div>
                  <Button
                    onClick={handleToggleBot}
                    disabled={accountType === "LIVE" && !subscriptionStatus}
                    className={`min-w-[120px] shadow-sm transition-transform hover:scale-[1.02] ${
                      botStatus === "ACTIVE"
                        ? "bg-amber-500 text-white hover:bg-amber-600"
                        : botStatus === "PAUSED"
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-[#D4AF37] text-black hover:bg-[#c9a227]"
                    }`}
                  >
                    {botStatus === "ACTIVE" ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause Bot
                      </>
                    ) : botStatus === "PAUSED" ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Resume Bot
                      </>
                    ) : (
                      <>
                        <Power className="mr-2 h-4 w-4" />
                        Start Bot
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  {accountType === "LIVE" && !subscriptionStatus ? (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  ) : botStatus === "ACTIVE" ? (
                    <Activity className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  ) : botStatus === "PAUSED" ? (
                    <Pause className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  ) : (
                    <Power className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-medium">
                      {accountType === "LIVE" && !subscriptionStatus
                        ? "Live trading requires an active subscription"
                        : botStatus === "ACTIVE"
                          ? "Bot is actively copying signals"
                          : botStatus === "PAUSED"
                            ? "Bot is paused - no new trades will be opened"
                            : "Bot is off - start the bot to begin copy trading"}
                    </p>
                    {accountType === "LIVE" && !subscriptionStatus && (
                      <Button variant="link" size="sm" className="h-auto p-0 text-[#D4AF37]">
                        View Plans
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Demo Trading Section */}
        {derivConnected && accountType === "DEMO" && (
          <section>
            <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <SectionIcon>
                    <Rocket className="h-5 w-5" />
                  </SectionIcon>
                  <div>
                    <CardTitle className="text-base">Demo Trading</CardTitle>
                    <CardDescription className="text-xs">Test copy trading risk-free</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Demo Mode Active</p>
                    <p className="text-xs text-muted-foreground">
                      Practice copy trading without using real funds. Test the bot's performance before activating live trading.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={handleStartDemoTrading}
                    disabled={botStatus === "ACTIVE"}
                    className="bg-[#D4AF37] text-black shadow-sm transition-transform hover:scale-[1.02] hover:bg-[#c9a227]"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Demo Copy Trading
                  </Button>
                  <Button onClick={() => handleSwitchAccountType("LIVE")} variant="outline">
                    <Crown className="mr-2 h-4 w-4" />
                    Switch to Live Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Live Trading / Subscription Notice */}
        {derivConnected && accountType === "LIVE" && (
          <section>
            <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <SectionIcon>
                    <Crown className="h-5 w-5" />
                  </SectionIcon>
                  <div>
                    <CardTitle className="text-base">Live Trading</CardTitle>
                    <CardDescription className="text-xs">Real copy trading with your live account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!subscriptionStatus ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg bg-amber-100 p-3 dark:bg-amber-950/30">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold">Live Copy Trading Requires an Active Subscription</p>
                        <p className="text-xs text-muted-foreground">
                          Subscribe to a plan to enable live copy trading with your connected Deriv account.
                        </p>
                      </div>
                    </div>
                    <Button className="bg-[#D4AF37] text-black shadow-sm transition-transform hover:scale-[1.02] hover:bg-[#c9a227]">
                      <Rocket className="mr-2 h-4 w-4" />
                      View Plans
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-lg bg-emerald-100 p-3 dark:bg-emerald-950/30">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold">Live Copy Trading Ready</p>
                      <p className="text-xs text-muted-foreground">
                        Your subscription is active. You can now start live copy trading.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}