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
  ArrowUpRight,
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

const IMAGES = [
  "https://i.postimg.cc/ZnDX5Ff3/5.jpg",
  "https://i.postimg.cc/VvF1MffN/Bull-and-Bear.jpg",
  "https://i.postimg.cc/9Q9sc9yF/6.jpg",
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
 * BottomSheet with Framer Motion animations
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
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-500 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center"
          onClick={dismissible ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[400px] overflow-hidden rounded-t-[2rem] bg-card shadow-2xl border border-border/50 sm:max-w-lg sm:rounded-2xl sm:translate-y-0"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function ConnectDerivPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [derivConnected, setDerivConnected] = useState(false);
  const [accountId] = useState("CR****1234");
  const [accountType, setAccountType] = useState<"DEMO" | "LIVE">("DEMO");
  const [accountStatus] = useState("Active");
  const [startingBalance] = useState(10000);
  const [botStatus, setBotStatus] = useState<"ACTIVE" | "PAUSED" | "OFF">(
    "OFF",
  );
  const [subscriptionStatus] = useState(false);

  // Automatic Image Slider
  useEffect(() => {
    if (!derivConnected) {
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
  }, [derivConnected]);

  const handleConnect = (type: "DEMO" | "LIVE") => {
    toast.promise(
      new Promise((resolve) => {
        setAccountType(type);
        setDerivConnected(true);
        setBotStatus("OFF");
        setTimeout(() => resolve(true), 1200);
      }),
      {
        loading: `Linking your ${type === "LIVE" ? "Live" : "Demo"} account...`,
        success: () => `Your ${type === "LIVE" ? "Live" : "Demo"} account is now linked`,
        error: "Failed to connect account",
      }
    );
  };

  const handleDisconnectDeriv = () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          setDerivConnected(false);
          setBotStatus("OFF");
          resolve(true);
        }, 1200);
      }),
      {
        loading: "Removing your Deriv connection...",
        success: "Your Deriv account has been disconnected",
        error: "Failed to disconnect account",
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
            <div className="w-full max-w-2xl">
              <BottomSheet open onClose={() => router.push("/UserDashboard/dashboard")}>
                <>
                  {/* Hero Image Slider Section */}
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
                        alt="Deriv Trading"
                      />
                    </AnimatePresence>

                    {/* Overlays & Badges */}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-black/20 z-[1]" />

                    {/* Badges */}
                    <div className="absolute top-5 left-5 flex gap-2 z-20">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                        Secure
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
                  <div className="p-6 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-[#D4AF37] font-bold text-xs uppercase tracking-tighter">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Deriv Integration</span>
                      </div>
                      <h2 className="text-2xl font-black text-foreground leading-tight tracking-tight">
                        Connect Deriv Account
                      </h2>
                      <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                        Easily link your Deriv account to the platform for seamless copy trading
                      </p>
                    </div>

                    {/* Account Selection Cards */}
                    <div className="space-y-3">
                      <motion.button
                        type="button"
                        onClick={() => handleConnect("DEMO")}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-border/50 bg-muted/30 px-5 py-4 text-left transition-all hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"
                      >
                        {/* <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground transition-colors group-hover:bg-[#D4AF37] group-hover:text-black">
                          <Wallet className="h-6 w-6" />
                        </div> */}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">Demo Account</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            Practice copy trading risk-free with virtual funds. Perfect for testing strategies.
                          </p>
                        </div>

                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-[#D4AF37]" />
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={() => handleConnect("LIVE")}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-border/50 bg-muted/30 px-5 py-4 text-left transition-all hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"
                      >
                        {/* <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background text-muted-foreground transition-colors group-hover:bg-[#D4AF37] group-hover:text-black">
                          <Crown className="h-6 w-6" />
                        </div> */}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">Live Account</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            Copy trades with real funds. Requires an active subscription for live trading.
                          </p>
                        </div>

                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-[#D4AF37]" />
                      </motion.button>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        onClick={() => handleConnect("DEMO")}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative cursor-pointer bg-[#D4AF37] text-black font-bold py-3 px-6 rounded-full  flex items-center justify-center overflow-hidden transition-all hover:pr-8"
                      >
                        <span className="relative z-10">Connect Demo</span>
                        {/* <div className="h-8 w-8 bg-background/20 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                          <ArrowUpRight className="w-5 h-5" />
                        </div> */}
                      </motion.button>

                      <motion.button
                        onClick={() => handleConnect("LIVE")}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative cursor-pointer border border-[#D4AF37]/40 text-[#D4AF37] font-bold py-3 px-6 rounded-full flex items-center justify-center overflow-hidden transition-all hover:bg-[#D4AF37]/10 hover:pr-8"
                      >
                        <span className="relative z-10">Connect Live</span>
                        {/* <div className="h-8 w-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                          <ArrowUpRight className="w-5 h-5" />
                        </div> */}
                      </motion.button>
                    </div>
                  </div>
                </>
              </BottomSheet>
            </div>
          </section>
        )}

        {derivConnected && (
          <>
            <section>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white shadow-2xl dark:bg-white dark:text-zinc-950 border border-border/50"
              >
                <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/20 blur-3xl" />
                <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />

                <div className="relative p-6 sm:p-8">
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

                      <motion.button
                        onClick={handleDisconnectDeriv}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-full bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                      >
                        <Unplug className="mr-2 h-4 w-4 inline" />
                        Disconnect
                      </motion.button>
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
              </motion.div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-3xl bg-card border border-border/50 shadow-lg overflow-hidden"
              >
                <div className="border-b border-border/40 bg-muted/20 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-[#D4AF37] dark:bg-zinc-100">
                        <Zap className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-black tracking-tight">
                          Copy Trading Bot
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Control automated copy trading
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={botStatus} />
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div className="flex flex-col gap-4 rounded-2xl bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Current Mode
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {accountType === "DEMO"
                          ? "Demo Copy Trading"
                          : "Live Copy Trading"}
                      </p>
                    </div>

                    <motion.button
                      onClick={handleToggleBot}
                      disabled={accountType === "LIVE" && !subscriptionStatus}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full min-w-0 cursor-pointer rounded-full p-4 px-6 text-sm font-bold shadow-lg sm:w-auto sm:min-w-[140px] transition-all ${
                        botStatus === "ACTIVE"
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : botStatus === "PAUSED"
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-[#D4AF37] text-black hover:bg-[#c9a227]"
                      }`}
                    >
                      {botStatus === "ACTIVE" ? (
                        <>
                          <Pause className="mr-2 h-4 w-4 inline" />
                          Pause Bot
                        </>
                      ) : botStatus === "PAUSED" ? (
                        <>
                          <Play className="mr-2 h-4 w-4 inline" />
                          Resume Bot
                        </>
                      ) : (
                        <>
                          <Power className="mr-2 h-4 w-4 inline" />
                          Start Bot
                        </>
                      )}
                    </motion.button>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-muted/40 p-5">
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
                      <p className="text-sm font-bold">
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
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-3xl bg-card border border-border/50 shadow-lg overflow-hidden"
              >
                {accountType === "DEMO" ? (
                  <>
                    <div className="border-b border-border/40 bg-muted/20 p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 text-[#D4AF37] dark:bg-zinc-100">
                          <Rocket className="h-6 w-6" />
                        </div>

                        <div>
                          <h3 className="text-base font-black tracking-tight">
                            Demo Trading
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Test copy trading risk-free
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 p-6">
                      <div className="flex items-start gap-3 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />

                        <div>
                          <p className="text-sm font-bold">
                            Demo Mode Active
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Practice without real funds. Test performance before going live.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <motion.button
                          onClick={handleStartDemoTrading}
                          disabled={botStatus === "ACTIVE"}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative cursor-pointer bg-[#D4AF37] text-black font-bold py-3 px-6 rounded-2xl flex items-center justify-between overflow-hidden transition-all hover:pr-8 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="relative z-10">Start Demo Trading</span>
                          <div className="h-8 w-8 bg-background/20 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                            <ArrowUpRight className="w-5 h-5" />
                          </div>
                        </motion.button>

                        <motion.button
                          onClick={() => handleSwitchAccountType("LIVE")}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="group relative cursor-pointer border border-[#D4AF37]/40 text-[#D4AF37] font-bold py-3 px-6 rounded-2xl flex items-center justify-between overflow-hidden transition-all hover:bg-[#D4AF37]/10 hover:pr-8"
                        >
                          <span className="relative z-10">Switch to Live Trading</span>
                          <div className="h-8 w-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                            <ArrowUpRight className="w-5 h-5" />
                          </div>
                        </motion.button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-b border-border/40 bg-muted/20 p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 text-[#D4AF37] dark:bg-zinc-100">
                          <Crown className="h-6 w-6" />
                        </div>

                        <div>
                          <h3 className="text-base font-black tracking-tight">
                            Live Trading
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Real copy trading with your live account
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 p-6">
                      {!subscriptionStatus ? (
                        <>
                          <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/30">
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

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="group relative cursor-pointer bg-[#D4AF37] text-black font-bold py-3 px-6 rounded-2xl flex items-center justify-between overflow-hidden transition-all hover:pr-8"
                            >
                              <span className="relative z-10">View Bot Plans</span>
                              <div className="h-8 w-8 bg-background/20 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                                <ArrowUpRight className="w-5 h-5" />
                              </div>
                            </motion.button>

                            <motion.button
                              onClick={() => handleSwitchAccountType("DEMO")}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="group relative cursor-pointer border border-[#D4AF37]/40 text-[#D4AF37] font-bold py-3 px-6 rounded-2xl flex items-center justify-between overflow-hidden transition-all hover:bg-[#D4AF37]/10 hover:pr-8"
                            >
                              <span className="relative z-10">Switch to Demo Account</span>
                              <div className="h-8 w-8 bg-[#D4AF37]/10 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45">
                                <ArrowUpRight className="w-5 h-5" />
                              </div>
                            </motion.button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
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
                    </div>
                  </>
                )}
              </motion.div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}