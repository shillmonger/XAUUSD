"use client";

import { useEffect, useState } from "react";
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
  Link2,
  ChevronRight,
  Building2,
  Loader2,
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
  status:
    | "CONNECTED"
    | "DISCONNECTED"
    | "ACTIVE"
    | "PAUSED"
    | "OFF"
    | "DEMO"
    | "LIVE";
}) {
  const isPositive = ["CONNECTED", "ACTIVE", "DEMO", "LIVE"].includes(status);
  const isWarning = ["PAUSED"].includes(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
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
            isPositive
              ? "bg-emerald-500"
              : isWarning
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
        />
      </span>
      {status}
    </span>
  );
}

/**
 * BottomSheet
 * On mobile this behaves exactly like the reference design: a panel that
 * slides up from the bottom edge of the screen, with a drag handle and a
 * dimmed backdrop behind it. On sm+ screens it falls back to the original
 * centered-card presentation so desktop layout is untouched.
 */
function BottomSheet({
  open,
  onClose,
  dismissible = true,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  dismissible?: boolean;
  children: React.ReactNode;
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-500 flex items-end justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:justify-center"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full transform overflow-hidden rounded-t-[2rem] bg-background shadow-2xl transition-transform duration-300 ease-out sm:max-w-lg sm:translate-y-0 sm:rounded-2xl sm:shadow-xl sm:shadow-black/5 sm:transition-none ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* <div className="flex justify-center pb-1 pt-3 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div> */}
        {children}
      </div>
    </div>
  );
}

type FeedbackState = {
  kind: "connect" | "disconnect";
  phase: "processing" | "success";
  accountType?: "DEMO" | "LIVE";
} | null;

export default function ConnectDerivPage() {
  const [derivConnected, setDerivConnected] = useState(false);
  const [accountId] = useState("CR****1234");
  const [accountType, setAccountType] = useState<"DEMO" | "LIVE">("DEMO");
  const [accountStatus] = useState("Active");
  const [startingBalance] = useState(10000);
  const [botStatus, setBotStatus] = useState<"ACTIVE" | "PAUSED" | "OFF">(
    "OFF",
  );
  const [subscriptionStatus] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const handleConnect = (type: "DEMO" | "LIVE") => {
    // Show the sheet, land the user on the main page immediately, then
    // resolve into the success state after a short "connecting" beat.
    setAccountType(type);
    setDerivConnected(true);
    setBotStatus("OFF");
    setFeedback({ kind: "connect", phase: "processing", accountType: type });

    setTimeout(() => {
      setFeedback({ kind: "connect", phase: "success", accountType: type });
    }, 1200);
  };

  const handleDisconnectDeriv = () => {
    setFeedback({ kind: "disconnect", phase: "processing" });

    setTimeout(() => {
      setDerivConnected(false);
      setBotStatus("OFF");
      setFeedback({ kind: "disconnect", phase: "success" });
    }, 1200);
  };

  const handleSwitchAccountType = (type: "DEMO" | "LIVE") => {
    setAccountType(type);
    if (type === "DEMO") setBotStatus("OFF");
  };

  const handleToggleBot = () => {
    if (botStatus === "OFF") {
      if (accountType === "LIVE" && !subscriptionStatus) return;
      setBotStatus("ACTIVE");
    } else if (botStatus === "ACTIVE") {
      setBotStatus("PAUSED");
    } else {
      setBotStatus("ACTIVE");
    }
  };

  const handleStartDemoTrading = () => {
    setAccountType("DEMO");
    setBotStatus("ACTIVE");
  };

  return (
    <main className="flex items-center justify-center bg-background py-10 text-foreground">
      <div className="w-full space-y-5">
        {!derivConnected && (
          <section className="flex justify-center">
            <div className="w-full max-w-lg">
              <BottomSheet open dismissible={false}>
                <div className="p-6 sm:p-10">
                  <div className="mb-8 flex items-center justify-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#b8941f] text-black shadow-md">
                      <Wallet className="h-7 w-7" />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-[#D4AF37] dark:bg-zinc-900">
                      <Building2 className="h-7 w-7" />
                    </div>
                  </div>

                  <div className="mb-8 text-center">
                    <h2 className="text-xl font-bold tracking-tight">
                      Connect Deriv Account
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Easily link your Deriv account to the platform for
                      seamless copy trading
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleConnect("DEMO")}
                      className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-4 text-left transition-all hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground transition-colors group-hover:bg-[#D4AF37] group-hover:text-black">
                        <Wallet className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Demo Account</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          Practice copy trading risk-free with virtual funds.
                          Perfect for testing strategies.
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-[#D4AF37]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConnect("LIVE")}
                      className="group flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-4 text-left transition-all hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground transition-colors group-hover:bg-[#D4AF37] group-hover:text-black">
                        <Crown className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Live Account</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          Copy trades with real funds. Requires an active
                          subscription for live trading.
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-[#D4AF37]" />
                    </button>
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-3 border-t border-border/50 px-0 pt-6 sm:grid-cols-2">
                    <Button
                      size="lg"
                      onClick={() => handleConnect("DEMO")}
                      className="h-12 w-full cursor-pointer rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-black shadow-md shadow-[#D4AF37]/20 hover:bg-[#c9a227]"
                    >
                      <Wallet className="mr-2 h-4 w-4 shrink-0" />
                      <span className="whitespace-nowrap">Connect Demo</span>
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleConnect("LIVE")}
                      className="h-12 w-full cursor-pointer rounded-full border-[#D4AF37]/40 px-5 text-sm font-semibold hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
                    >
                      <Crown className="mr-2 h-4 w-4 shrink-0" />
                      <span className="whitespace-nowrap">Connect Live</span>
                    </Button>
                  </div>
                </div>
              </BottomSheet>
            </div>
          </section>
        )}

        {derivConnected && (
          <>
            <section>
              <Card className="overflow-hidden border-border/50 shadow-md">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-[#D4AF37] dark:bg-zinc-100">
                        <ShieldCheck className="h-5 w-5" />
                      </div>

                      <div>
                        <CardTitle className="text-base font-bold">
                          Account Overview
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Your connected Deriv account details
                        </CardDescription>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center">
                      <StatusBadge status="CONNECTED" />

                      <Button
                        onClick={handleDisconnectDeriv}
                        variant="destructive"
                        size="sm"
                        className="h-10 w-full cursor-pointer px-4 sm:h-9 sm:w-auto"
                      >
                        <Unplug className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Account ID
                      </p>
                      <p className="mt-2 text-sm font-semibold">{accountId}</p>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Account Type
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={accountType} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Account Status
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        {accountStatus}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                        Starting Balance
                      </p>
                      <p className="mt-2 text-lg font-bold tracking-tight">
                        $
                        {startingBalance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Card className="overflow-hidden border-border/50 shadow-md">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-[#D4AF37] dark:bg-zinc-100">
                        <Zap className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <CardTitle className="text-base font-bold">
                          Copy Trading Bot
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Control automated copy trading
                        </CardDescription>
                      </div>
                    </div>

                    <StatusBadge status={botStatus} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-6">
                  <div className="flex flex-col gap-4 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Current Mode
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {accountType === "DEMO"
                          ? "Demo Copy Trading"
                          : "Live Copy Trading"}
                      </p>
                    </div>

                    <Button
                      onClick={handleToggleBot}
                      disabled={accountType === "LIVE" && !subscriptionStatus}
                      size="lg"
                      className={`h-12 w-full min-w-0 cursor-pointer px-5 text-sm font-semibold shadow-sm sm:w-auto sm:min-w-[150px] ${
                        botStatus === "ACTIVE"
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : botStatus === "PAUSED"
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-[#D4AF37] text-black hover:bg-[#c9a227]"
                      }`}
                    >
                      {botStatus === "ACTIVE" ? (
                        <>
                          <Pause className="mr-2 h-4 w-4 shrink-0" />
                          Pause Bot
                        </>
                      ) : botStatus === "PAUSED" ? (
                        <>
                          <Play className="mr-2 h-4 w-4 shrink-0" />
                          Resume Bot
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4 shrink-0" />
                          Start Bot
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/40 p-4">
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
                      <p className="text-sm font-medium">
                        {accountType === "LIVE" && !subscriptionStatus
                          ? "Live trading requires an active subscription"
                          : botStatus === "ACTIVE"
                            ? "Bot is actively copying signals"
                            : botStatus === "PAUSED"
                              ? "Bot is paused — no new trades will open"
                              : "Bot is off — start to begin copy trading"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-border/50 shadow-md">
                {accountType === "DEMO" ? (
                  <>
                    <CardHeader className="border-b border-border/40 bg-muted/20 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-[#D4AF37] dark:bg-zinc-100">
                          <Rocket className="h-5 w-5" />
                        </div>

                        <div>
                          <CardTitle className="text-base font-bold">
                            Demo Trading
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Test copy trading risk-free
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-5 pt-6">
                      <div className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />

                        <div>
                          <p className="text-sm font-medium">
                            Demo Mode Active
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Practice without real funds. Test performance before
                            going live.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 px-0 sm:grid-cols-2">
                        <Button
                          onClick={handleStartDemoTrading}
                          disabled={botStatus === "ACTIVE"}
                          size="lg"
                          className="h-12 w-full cursor-pointer rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-black hover:bg-[#c9a227] disabled:cursor-not-allowed"
                        >
                          <Play className="mr-2 h-4 w-4 shrink-0" />
                          <span className="whitespace-nowrap">
                            Start Demo Copy Trading
                          </span>
                        </Button>

                        <Button
                          onClick={() => handleSwitchAccountType("LIVE")}
                          variant="outline"
                          size="lg"
                          className="h-12 w-full cursor-pointer rounded-full px-5 text-sm font-semibold"
                        >
                          <Crown className="mr-2 h-4 w-4 shrink-0" />
                          <span className="whitespace-nowrap">
                            Switch to Live Account
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <>
                    <CardHeader className="border-b border-border/40 bg-muted/20 pb-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-[#D4AF37] dark:bg-zinc-100">
                          <Crown className="h-5 w-5" />
                        </div>

                        <div>
                          <CardTitle className="text-base font-bold">
                            Live Trading
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Real copy trading with your live account
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-5 pt-6">
                      {!subscriptionStatus ? (
                        <>
                          <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />

                            <div>
                              <p className="text-sm font-bold">
                                Subscription Required
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                Subscribe to enable live copy trading with your
                                connected Deriv account.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 px-0 sm:grid-cols-2">
                            <Button
                              size="lg"
                              className="h-12 w-full cursor-pointer rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-black hover:bg-[#c9a227]"
                            >
                              <Rocket className="mr-2 h-4 w-4 shrink-0" />
                              <span className="whitespace-nowrap">
                                View Plans
                              </span>
                            </Button>

                            <Button
                              onClick={() =>
                                handleSwitchAccountType("DEMO")
                              }
                              variant="outline"
                              size="lg"
                              className="h-12 w-full cursor-pointer rounded-full px-5 text-sm font-semibold"
                            >
                              <Wallet className="mr-2 h-4 w-4 shrink-0" />
                              <span className="whitespace-nowrap">
                                Switch to Demo Account
                              </span>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />

                          <div>
                            <p className="text-sm font-bold">
                              Live Copy Trading Ready
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Your subscription is active. You can start live
                              copy trading now.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            </section>
          </>
        )}
      </div>

      {/* Connect / Disconnect confirmation — slides up like the reference design */}
      <BottomSheet
        open={feedback !== null}
        dismissible={feedback?.phase === "success"}
        onClose={() => setFeedback(null)}
      >
        {feedback && (
          <div className="flex flex-col items-center gap-4 px-6 pb-10 pt-4 text-center sm:p-10">
            {feedback.phase === "processing" ? (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/10">
                  <Loader2 className="h-9 w-9 animate-spin text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {feedback.kind === "connect"
                      ? "Connecting..."
                      : "Disconnecting..."}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feedback.kind === "connect"
                      ? `Linking your ${
                          feedback.accountType === "LIVE" ? "Live" : "Demo"
                        } account`
                      : "Removing your Deriv connection"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {feedback.kind === "connect" ? "Connected!" : "Disconnected"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feedback.kind === "connect"
                      ? `Your ${
                          feedback.accountType === "LIVE" ? "Live" : "Demo"
                        } account is now linked`
                      : "Your Deriv account has been disconnected"}
                  </p>
                </div>
                <Button
                  onClick={() => setFeedback(null)}
                  size="lg"
                  className="mt-2 h-12 w-full max-w-xs cursor-pointer rounded-full bg-[#D4AF37] px-6 text-sm font-semibold text-black hover:bg-[#c9a227]"
                >
                  {feedback.kind === "connect" ? "Connected" : "Disconnected"}
                </Button>
              </>
            )}
          </div>
        )}
      </BottomSheet>
    </main>
  );
}