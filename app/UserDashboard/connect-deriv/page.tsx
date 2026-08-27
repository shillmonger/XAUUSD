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
  const [accountId, setAccountId] = useState<string>("");
  const [accountType, setAccountType] = useState<"DEMO" | "LIVE">("DEMO");
  const [accountStatus, setAccountStatus] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [currency, setCurrency] = useState<string>("USD");
  const [botStatus, setBotStatus] = useState<"ACTIVE" | "PAUSED" | "OFF">(
    "OFF",
  );
  const [subscriptionStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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

  // Check connection status on mount and when OAuth callback returns
  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const response = await fetch('/api/deriv/status');
        const data = await response.json();
        
        if (data.connected) {
          setDerivConnected(true);
          setAccountId(data.accountId);
          setAccountType(data.accountType as "DEMO" | "LIVE");
          setAccountStatus(data.accountStatus || "Active");
          setBalance(data.balance || "0");
          setCurrency(data.currency || "USD");
          setBotStatus(data.botStatus || "OFF");
        } else {
          setDerivConnected(false);
          setAccountId("");
          setAccountStatus("");
          setBalance("0");
          setCurrency("USD");
          setBotStatus("OFF");
        }
      } catch (error) {
        console.error('Failed to check connection status:', error);
        setDerivConnected(false);
      }
    };

    checkConnectionStatus();

    // Check for OAuth callback success/error
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'connected') {
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Deriv account connected successfully!</span>
        </div>
      );
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      let errorMessage = 'Failed to connect Deriv account';
      switch (error) {
        case 'missing_params':
          errorMessage = 'Missing required parameters';
          break;
        case 'invalid_state':
          errorMessage = 'Invalid OAuth state';
          break;
        case 'expired_state':
          errorMessage = 'OAuth session expired';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Failed to exchange authorization code';
          break;
        case 'account_verification_failed':
          errorMessage = 'Failed to verify Deriv account';
          break;
        case 'invalid_account_data':
          errorMessage = 'Invalid account data received';
          break;
        case 'no_active_account':
          errorMessage = 'No active Deriv account found';
          break;
        case 'account_already_connected':
          errorMessage = 'This Deriv account is already connected to another user';
          break;
        case 'server_error':
          errorMessage = 'Server error occurred';
          break;
      }
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      );
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    setIsLoading(true);
    // Redirect to the OAuth connect endpoint
    window.location.href = '/api/deriv/connect';
  };

  const handleDisconnectDeriv = async () => {
    toast.promise(
      fetch('/api/deriv/disconnect', {
        method: 'POST',
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to disconnect');
        }
        const data = await response.json();
        
        // Reload status to check if user has another connected account
        const statusResponse = await fetch('/api/deriv/status');
        const statusData = await statusResponse.json();
        
        if (statusData.connected) {
          // User has another connected account, switch to it
          setDerivConnected(true);
          setAccountId(statusData.accountId);
          setAccountType(statusData.accountType as "DEMO" | "LIVE");
          setAccountStatus(statusData.accountStatus || "Active");
          setBalance(statusData.balance || "0");
          setCurrency(statusData.currency || "USD");
          setBotStatus(statusData.botStatus || "OFF");
        } else {
          // No more connected accounts
          setDerivConnected(false);
          setAccountId("");
          setAccountStatus("");
          setBalance("0");
          setCurrency("USD");
          setBotStatus("OFF");
        }
        
        return data;
      }),
      {
        loading: "Disconnecting your Deriv account...",
        success: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Your Deriv account has been disconnected</span>
          </div>
        ),
        error: "Failed to disconnect Deriv account",
      }
    );
  };

  const handleSwitchAccountType = async (type: "DEMO" | "LIVE") => {
    const accountTypeParam = type.toLowerCase() as 'demo' | 'real';
    
    try {
      const response = await fetch('/api/deriv/switch-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountType: accountTypeParam }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to switch account');
      }

      const data = await response.json();
      
      // Update local state with the switched account data
      setAccountType(data.accountType as "DEMO" | "LIVE");
      setAccountId(data.accountId);
      setBalance(data.balance);
      setCurrency(data.currency);
      setBotStatus(data.botStatus);
      
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Switched to {type} account</span>
        </div>
      );
    } catch (error) {
      console.error('Failed to switch account:', error);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{error instanceof Error ? error.message : 'Failed to switch account'}</span>
        </div>
      );
    }
  };

  const handleToggleBot = async () => {
    let newStatus: "ACTIVE" | "PAUSED" | "OFF";
    
    if (botStatus === "OFF") {
      if (accountType === "LIVE" && !subscriptionStatus) return;
      newStatus = "ACTIVE";
    } else if (botStatus === "ACTIVE") {
      newStatus = "PAUSED";
    } else {
      newStatus = "ACTIVE";
    }

    // Update local state
    setBotStatus(newStatus);

    // Persist to database
    try {
      const response = await fetch('/api/deriv/bot-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ botStatus: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bot status');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Bot status updated to {newStatus}</span>
          </div>
        );
      }
    } catch (error) {
      console.error('Failed to update bot status:', error);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>Failed to update bot status in database</span>
        </div>
      );
      // Revert local state on error
      setBotStatus(botStatus);
    }
  };

  const handleStartDemoTrading = async () => {
    setAccountType("DEMO");
    setBotStatus("ACTIVE");

    // Persist to database
    try {
      const response = await fetch('/api/deriv/bot-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ botStatus: "ACTIVE" }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bot status');
      }
    } catch (error) {
      console.error('Failed to update bot status:', error);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>Failed to update bot status in database</span>
        </div>
      );
    }
  };

  return (
    <main className="flex items-center justify-center bg-background py-5 lg:py-10 text-foreground">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-black/20 dark:from-card dark:via-transparent dark:to-black/20 z-[1]" />
  
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
                      Easily link your Deriv account to the platform for seamless copy trading. Your account type (Demo or Live) will be detected automatically.
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
                      AUTO DETECT
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="lg"
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="h-12 w-full cursor-pointer rounded-full bg-[#D4AF37] px-5 text-sm font-semibold text-black shadow-md shadow-[#D4AF37]/20 hover:bg-[#c9a227] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="whitespace-nowrap">Connecting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        <span className="whitespace-nowrap">Connect Deriv Account</span>
                      </div>
                    )}
                  </Button>
                </div>
              </BottomSheet>
            </div>
          </section>
        )}




        

   {derivConnected && (
  <div className="relative space-y-5 text-foreground font-sans">
    {/* subtle trading grid backdrop */}
    <div
      className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035] dark:opacity-[0.06]"
      style={{
        backgroundImage: `
          linear-gradient(to right, currentColor 1px, transparent 1px),
          linear-gradient(to bottom, currentColor 1px, transparent 1px)
        `,
        backgroundSize: "24px 24px",
      }}
    />

    {/* MAIN CONTENT GRID */}
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-6">
        {/* DERIV ACCOUNT OVERVIEW */}
        <Card className="relative overflow-hidden rounded-2xl border-border bg-card p-6 text-foreground shadow-xl">
          {/* top accent line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-70" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-[#D4AF37] md:flex">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black uppercase tracking-wide text-foreground">
                    DERIV CONFIGURATION
                  </h3>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    LIVE LINK
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Active connection details and account state
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge status="CONNECTED" />
              <Button
                onClick={handleDisconnectDeriv}
                variant="destructive"
                size="sm"
                className="cursor-pointer rounded-full px-4 py-4 text-xs font-bold uppercase tracking-wider"
              >
                <Unplug className="mr-1 h-4 w-4" />
                Disconnect
              </Button>
            </div>
          </div>

          {/* METRICS — trading ticker style */}
          <div className="relative mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/60 p-3.5 transition-colors hover:border-[#D4AF37]/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                ACCOUNT ID
              </p>
              <p className="mt-1 font-mono text-sm font-bold tracking-tight text-foreground">
                {accountId || "Not connected"}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/60 p-3.5 transition-colors hover:border-[#D4AF37]/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                ACCOUNT TYPE
              </p>
              <div className="mt-1">
                <span
                  className={`inline-block rounded px-2 py-0.5 text-xs font-black uppercase tracking-wider ${
                    accountType === "DEMO"
                      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
                  }`}
                >
                  {accountType}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/60 p-3.5 transition-colors hover:border-[#D4AF37]/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                ACCOUNT STATUS
              </p>
              <p className="mt-1 text-sm font-bold uppercase text-foreground">
                {accountStatus || "Unknown"}
              </p>
            </div>

            <div className="rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 p-3.5 shadow-[0_0_20px_-8px_rgba(212,175,55,0.35)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                CURRENT BALANCE
              </p>
              <p className="mt-1 font-mono text-base font-black tracking-tight text-[#D4AF37]">
                {currency} {parseFloat(balance).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* BOT CONTROLS */}
        <Card className="relative overflow-hidden rounded-2xl border-border bg-card p-6 text-foreground shadow-xl space-y-2">
          {/* FULL-WIDTH BANNER */}
          <div className="absolute inset-x-0 top-0 h-24 sm:h-28 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/60 to-card" />
          </div>
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-60" />

          <div className="relative flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-[#D4AF37] md:flex">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wide">
                  BOT CONTROLS
                </h3>
                <p className="text-xs text-muted-foreground">
                  Manage execution states and trading environment
                </p>
              </div>
            </div>
            <StatusBadge status={botStatus} />
          </div>

          {/* EXECUTION STATE — command bar feel */}
          <div className="relative flex flex-col gap-4 rounded-xl border border-border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  botStatus === "ACTIVE"
                    ? "bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.5)] animate-pulse"
                    : botStatus === "PAUSED"
                    ? "bg-amber-500 shadow-[0_0_8px_1px_rgba(245,158,11,0.4)]"
                    : "bg-red-500/80"
                }`}
              />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  BOT EXECUTION STATE
                </p>
                <p className="mt-0.5 text-xs text-foreground">
                  {botStatus === "ACTIVE"
                    ? "Bot is active and copying signals live."
                    : botStatus === "PAUSED"
                    ? "Execution paused — no new positions will open."
                    : "Bot is offline."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleToggleBot}
              disabled={accountType === "LIVE" && !subscriptionStatus}
              size="lg"
              className={`w-full cursor-pointer rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition-all sm:w-auto ${
                botStatus === "ACTIVE"
                  ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/25"
                  : botStatus === "PAUSED"
                  ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/25"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
              }`}
            >
              {botStatus === "ACTIVE" ? (
                <>
                  <Pause className="h-4 w-4" /> Pause Bot
                </>
              ) : botStatus === "PAUSED" ? (
                <>
                  <Play className="h-4 w-4" /> Resume Bot
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" /> Start Bot
                </>
              )}
            </Button>
          </div>

          {/* MODE + PLANS */}
          <div className="relative grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                ENVIRONMENT SWITCH
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-card p-1.5">
                <button
                  type="button"
                  onClick={() => handleSwitchAccountType("DEMO")}
                  className={`rounded-md py-2 text-xs font-black uppercase tracking-wider transition-all ${
                    accountType === "DEMO"
                      ? "bg-emerald-500 text-black shadow shadow-emerald-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Demo Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAccountType("LIVE")}
                  className={`rounded-md py-2 text-xs font-black uppercase tracking-wider transition-all ${
                    accountType === "LIVE"
                      ? "bg-[#D4AF37] text-black shadow shadow-[#D4AF37]/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Live Mode
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-3 rounded-xl border border-border bg-muted/40 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  SUBSCRIPTION & PLANS
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {subscriptionStatus
                    ? "Active subscription tier active"
                    : "Subscription required for live execution"}
                </p>
              </div>
              <Button
                size="sm"
                className="w-full rounded-lg bg-[#D4AF37] py-2.5 text-xs font-black uppercase tracking-wider text-black hover:bg-[#c9a227] shadow-md shadow-[#D4AF37]/20"
              >
                <Crown className="mr-1.5 h-4 w-4" /> View Bot Plans
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">
        {/* LIVE TERMINAL */}
        <Card className="relative overflow-hidden rounded-2xl border-border bg-card p-5 text-foreground shadow-xl">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#D4AF37]/80 via-emerald-500/50 to-transparent" />

          <div className="flex items-center justify-between border-b border-border pb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              LIVE PREVIEW TERMINAL
            </p>
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              STREAM
            </span>
          </div>

          <div className="mt-4 space-y-0 font-mono text-xs">
            {[
              {
                label: "ACCOUNT_ID",
                value: accountId || "[Waiting for input]",
                className: "text-foreground font-bold",
              },
              {
                label: "ACCT_TYPE",
                value: accountType,
                className:
                  accountType === "DEMO"
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-[#D4AF37] font-bold",
              },
              {
                label: "CURRENCY",
                value: currency,
                className: "text-foreground font-bold",
              },
              {
                label: "BOT_STATUS",
                value: botStatus,
                className: "text-foreground font-bold",
              },
              {
                label: "BALANCE",
                value: `${parseFloat(balance).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                className: "text-foreground font-bold",
              },
            ].map((row, i) => (
              <div
                key={row.label}
                className={`flex items-center justify-between py-2 ${
                  i < 5 ? "border-b border-border/80" : ""
                }`}
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className={row.className}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* faux terminal footer */}
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 font-mono text-[10px] text-muted-foreground">
            <span className="text-emerald-500">▸</span>
            <span>socket://deriv · encrypted · ready</span>
            <span className="ml-auto animate-pulse">_</span>
          </div>
        </Card>

        {/* SECURITY */}
        <Card className="relative overflow-hidden rounded-2xl border-border bg-zinc-900 dark:bg-white p-5 text-white dark:text-zinc-900 shadow-xl space-y-3">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-zinc-400/40 to-transparent dark:via-zinc-500/30" />
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 dark:text-zinc-600">
              SECURITY STANDARD
            </p>
            <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400 dark:text-emerald-600">
              SECURE
            </span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-300 dark:text-zinc-700">
            End-to-end socket encrypts parameters cleanly into isolated worker
            tasks. Your primary execution key balances remain secured inside
            isolated broker spaces.
          </p>
          <div className="flex flex-wrap gap-2">
            {["TLS 1.3", "Isolated workers", "No key storage"].map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-zinc-700/50 dark:border-zinc-300/50 bg-zinc-800/50 dark:bg-zinc-100/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300 dark:text-zinc-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
)}
      </div>

    </main>
  );
}