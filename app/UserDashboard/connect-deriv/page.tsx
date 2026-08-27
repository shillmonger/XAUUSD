"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  ChartSpline,
  TrendingUp,
  ArrowUpRight,
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

const IMAGES = [
  "https://i.postimg.cc/j2qtwsZr/man.jpg",
  "https://i.postimg.cc/BQ6JJnj7/Deriv-com.jpg",
  "https://i.postimg.cc/cJqW77Fd/deriv.jpg",
];

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
      className="fixed inset-0 z-500 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:justify-center"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full transform overflow-hidden rounded-t-[2rem] bg-background shadow-2xl transition-transform duration-300 ease-out sm:max-w-[400px] sm:translate-y-0 sm:rounded-[1.5rem] sm:shadow-xl sm:shadow-black/5 sm:transition-none ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function ConnectDerivPage() {
  const router = useRouter();
  const [derivConnected, setDerivConnected] = useState(false);
  const [accountId] = useState("CR****1234");
  const [accountType, setAccountType] = useState<"DEMO" | "LIVE">("DEMO");
  const [accountStatus] = useState("Active");
  const [startingBalance] = useState(10000);
  const [botStatus, setBotStatus] = useState<"ACTIVE" | "PAUSED" | "OFF">(
    "OFF",
  );
  const [subscriptionStatus] = useState(false);
  
  // Image slider state
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Automatic Image Slider
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
    }, 4000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleConnect = (type: "DEMO" | "LIVE") => {
    setAccountType(type);
    setDerivConnected(true);
    setBotStatus("OFF");

    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: `Connecting your ${type === "LIVE" ? "Live" : "Demo"} account...`,
        success: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Your ${type === "LIVE" ? "Live" : "Demo"} account is now linked</span>
          </div>
        ),
      }
    );
  };

  const handleDisconnectDeriv = () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          setDerivConnected(false);
          setBotStatus("OFF");
          resolve(null);
        }, 1200);
      }),
      {
        loading: "Disconnecting your Deriv account...",
        success: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Your Deriv account has been disconnected</span>
          </div>
        ),
      }
    );
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
            <div className="w-full max-w-[400px]">
              <BottomSheet open onClose={() => router.push("/UserDashboard/dashboard")}>
                {/* Top Image Slider Section */}
                <div className="relative h-[200px] overflow-hidden group">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.img
                      key={currentIndex}
                      src={IMAGES[currentIndex]}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        duration: 1,
                        ease: "easeInOut" 
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt="Trading Empowerment"
                    />
                  </AnimatePresence>

                  {/* Overlays & Badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-black/20 z-[1]" />
  
                  {/* Close Button */}
                  <button
                    onClick={() => router.push("/UserDashboard/dashboard")}
                    className="absolute cursor-pointer top-5 right-5 w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
  
                  <div className="absolute top-5 left-5 flex gap-2 z-20">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                      Connect
                    </span>
                    <span className="px-3 py-1 bg-[#D4AF37]/80 backdrop-blur-md rounded-full text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Secure
                    </span>
                  </div>

                  {/* Pagination Dots */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {IMAGES.map((_, i) => (
                      <div
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
                          i === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 lg:p-8 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-xs uppercase tracking-tighter">
                      <ChartSpline className="w-4 h-4" />
                      <span>Deriv Integration</span>
                    </div>
                    <h2 className="text-2xl font-black text-foreground leading-tight tracking-tight">
                      Connect Deriv Account
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      Easily link your Deriv account to the platform for seamless copy trading. Choose your account type below.
                    </p>
                  </div>

                  {/* Stats/Info Row */}
                  <div className="flex items-center justify-between py-4 border-y border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[#D4AF37]/10">
                        <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Trading</p>
                        <p className="text-sm font-bold">Copy Trading</p>
                      </div>
                    </div>
                    <div className="text-right font-mono text-sm font-black text-[#D4AF37]">
                      LIVE & DEMO
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      size="lg"
                      onClick={() => handleConnect("DEMO")}
                      className="h-12 w-full cursor-pointer rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-black shadow-md shadow-[#D4AF37]/20 hover:bg-[#c9a227]"
                    >
                      <span className="whitespace-nowrap">Connect Demo</span>
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleConnect("LIVE")}
                      className="h-12 w-full cursor-pointer rounded-full border-[#D4AF37]/40 px-5 text-sm font-semibold hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
                    >
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
              <Card className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white shadow-2xl dark:bg-white dark:text-zinc-950 border border-border/50">
                <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl" />
                <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />

                <div className="relative p-5 sm:p-7 lg:p-8">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37] text-black shadow-lg">
                        <ShieldCheck className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="text-lg font-black tracking-tight">
                          Account Overview
                        </h3>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          Your connected Deriv account details
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status="CONNECTED" />

                      <Button
                        onClick={handleDisconnectDeriv}
                        variant="destructive"
                        size="sm"
                        className="w-full rounded-full text-sm cursor-pointer px-4 py-4 sm:w-auto"
                      >
                        <Unplug className="mr-2 h-4 w-4" />
                        Disconnect
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Account ID
                      </p>
                      <p className="mt-2 text-sm font-bold">{accountId}</p>
                    </div>

                    <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Account Type
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={accountType} />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Account Status
                      </p>
                      <p className="mt-2 text-sm font-bold">
                        {accountStatus}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#D4AF37]/10 backdrop-blur-sm border border-[#D4AF37]/30 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                        Starting Balance
                      </p>
                      <p className="mt-2 text-lg font-black tracking-tight text-[#D4AF37]">
                        $
                        {startingBalance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
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
                      className={`w-full min-w-0 cursor-pointer rounded-full p-4 px-3 text-sm font-semibold shadow-sm sm:w-auto sm:min-w-[100px] ${
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
                            Practice without real funds. Test performance before going live.
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
                          <span className="whitespace-nowrap">
                            Start Demo Trading
                          </span>
                        </Button>

                        <Button
                          onClick={() => handleSwitchAccountType("LIVE")}
                          variant="outline"
                          size="lg"
                          className="h-12 w-full cursor-pointer rounded-full px-5 text-sm font-semibold"
                        >
                          <span className="whitespace-nowrap">
                            Switch to Live Trading
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
                                Subscribe to enable live copy trading with your connected Deriv account.
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 px-0 sm:grid-cols-2">
                            <Button
                              size="lg"
                              className="h-12 w-full cursor-pointer rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-black hover:bg-[#c9a227]"
                            >
                              <span className="whitespace-nowrap">
                                View Bot Plans
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
                              Your subscription is active. You can start live copy trading now.
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

    </main>
  );
}