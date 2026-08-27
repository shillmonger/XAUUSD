"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  ChevronRight,
  Unplug,
  Eye,
  EyeOff,
  History,
  Link2,
  Loader2,
  RefreshCw,
  Rocket,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TradeRow {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  entry: number;
  lotSize: number;
  date: string;
  profit: number;
  status: "WIN" | "LOSS" | "OPEN";
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  image: string;
  url?: string;
}

interface CalendarItem {
  id: string;
  country: string;
  title: string;
  time: string;
  impact: string;
}

interface DashboardData {
  totalSpent: number;
  totalProfit: number;
  todayProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  pendingPlans: number;
  activePlan: number;
  rejectedPlans: number;
  recentTrades: TradeRow[];
  news: NewsItem[];
  tradingCalendar: CalendarItem[];
  accountStatus: "VERIFIED" | "UNVERIFIED";
  joined: string;
  role: string;
  plan: {
    name: string;
    amount: number;
    accountSize: string;
    duration: string;
    startDate: string;
    expires: string;
    status: "APPROVED" | "PENDING" | "REJECTED";
  };
}

type Tab = "Billing" | "Bonus" | "Trading";

const GOLD = "#D4AF37";

// TODO: replace with real thumbnails per article once the news API is wired up.
const MOCK_NEWS_IMAGE =
  "https://i.postimg.cc/q7C5L9zC/The-West-Is-Losing-Control-Over-The-Gold-Price.jpg";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(value: number) {
  return `$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function StatusBadge({
  status,
}: {
  status: "CONNECTED" | "DISCONNECTED" | "ONLINE" | "OFFLINE" | "RUNNING" | "IDLE" | "STOPPED";
}) {
  const isPositive = ["CONNECTED", "ONLINE", "RUNNING"].includes(status);
  const isWarning = ["IDLE", "STOPPED"].includes(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        isPositive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : isWarning
            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
            : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isPositive
            ? "bg-emerald-500"
            : isWarning
              ? "bg-amber-500"
              : "bg-red-500"
        }`}
      />
      {status}
    </span>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-border/50 p-3 transition-all hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-[#D4AF37] dark:bg-zinc-100">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wider">
            {title}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[#D4AF37]" />
    </Link>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  const content = (
    <div className="group flex items-start gap-4 py-3 first:pt-0 last:pb-0">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-[#B28D16]">
          {item.title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{item.source}</p>
      </div>
    </div>
  );

  if (!item.url) {
    return content;
  }

  return (
    <Link href={item.url} target="_blank" rel="noopener noreferrer">
      {content}
    </Link>
  );
}

function CalendarRow({ item }: { item: any }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
          {item.country}
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
        </div>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {item.impact}
      </span>
    </div>
  );
}

function LoadingDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-64 rounded-3xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-96 rounded-2xl bg-muted lg:col-span-2" />
          <div className="h-96 rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Billing");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("just now");

  async function fetchDashboardData(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);

      const response = await fetch("/api/user/info", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load dashboard data");
      }

      const userData = await response.json();

      if (userData.success) {
        // Replace this object with the response from your trading API.
        setData({
          totalSpent: 30,
          totalProfit: 15.5,
          todayProfit: 2.75,
          weeklyProfit: 8.4,
          monthlyProfit: 15.5,
          winRate: 66.7,
          totalTrades: 9,
          winningTrades: 6,
          losingTrades: 3,
          pendingPlans: 0,
          activePlan: 0,
          rejectedPlans: 1,
          recentTrades: [
            {
              id: "TRD-001",
              symbol: "XAUUSDm",
              type: "BUY",
              entry: 4388.23,
              lotSize: 0.05,
              date: "2026-08-13",
              profit: 125.5,
              status: "WIN",
            },
            {
              id: "TRD-002",
              symbol: "XAUUSDm",
              type: "SELL",
              entry: 4388.71,
              lotSize: 0.05,
              date: "2026-08-13",
              profit: -45.3,
              status: "LOSS",
            },
            {
              id: "TRD-003",
              symbol: "XAUUSDm",
              type: "SELL",
              entry: 4426.15,
              lotSize: 0.02,
              date: "2026-08-12",
              profit: 78.25,
              status: "WIN",
            },
            {
              id: "TRD-004",
              symbol: "XAUUSDm",
              type: "BUY",
              entry: 4430.74,
              lotSize: 0.02,
              date: "2026-08-12",
              profit: -32.1,
              status: "LOSS",
            },
            {
              id: "TRD-005",
              symbol: "XAUUSDm",
              type: "BUY",
              entry: 4405.72,
              lotSize: 0.02,
              date: "2026-08-12",
              profit: 56.8,
              status: "WIN",
            },
            {
              id: "TRD-006",
              symbol: "XAUUSDm",
              type: "BUY",
              entry: 4405.72,
              lotSize: 0.02,
              date: "2026-08-12",
              profit: 12.4,
              status: "WIN",
            },
            {
              id: "TRD-007",
              symbol: "XAUUSDm",
              type: "BUY",
              entry: 4405.72,
              lotSize: 0.02,
              date: "2026-08-12",
              profit: -8.9,
              status: "LOSS",
            },
            {
              id: "TRD-008",
              symbol: "XAUUSDm",
              type: "BUY",
              entry: 4405.72,
              lotSize: 0.02,
              date: "2026-08-12",
              profit: 34.6,
              status: "WIN",
            },
            {
              id: "TRD-009",
              symbol: "XAUUSDm",
              type: "BUY",
              entry: 4405.72,
              lotSize: 0.02,
              date: "2026-08-12",
              profit: 21.3,
              status: "WIN",
            },
            {
              id: "TRD-010",
              symbol: "XAUUSDm",
              type: "BUY",
              entry: 4405.72,
              lotSize: 0.02,
              date: "2026-08-12",
              profit: 21.3,
              status: "WIN",
            },
            {
              id: "TRD-011",
              symbol: "XAUUSDm",
              type: "BUY",
              entry: 4405.72,
              lotSize: 0.02,
              date: "2026-08-12",
              profit: 21.3,
              status: "WIN",
            },
          ],
          // Mock data — swap for a real news feed / API response later.
          news: [
            {
              id: "NEWS-001",
              title:
                "EUR/USD Analysis: Euro Loses Momentum Following the U.S. PCE Release",
              source: "Forexcom",
              image: MOCK_NEWS_IMAGE,
            },
            {
              id: "NEWS-002",
              title: "Euro: Rally stalls against US Dollar as spreads drive trade – Scotiabank",
              source: "FX Street",
              image: MOCK_NEWS_IMAGE,
            },
            {
              id: "NEWS-003",
              title:
                "Pound Sterling Price News and Forecast: GBP/USD retreats as sticky PCE revives Fed hike bets",
              source: "FX Street",
              image: MOCK_NEWS_IMAGE,
            },
            {
              id: "NEWS-004",
              title:
                "U.S. Dollar Moves Higher As PCE Price Index Exceeds Estimates: Analysis For EUR/USD, GBP/USD, USD/CAD, USD/JPY",
              source: "FXEmpire",
              image: MOCK_NEWS_IMAGE,
            },
            {
              id: "NEWS-005",
              title: "USD/CAD Turns Bullish as GBP/USD, AUD/USD Lose Momentum",
              source: "FXEmpire",
              image: MOCK_NEWS_IMAGE,
            },
          ],
          tradingCalendar: [
            {
              id: "CAL-001",
              country: "US",
              title: "Non-Farm Payrolls",
              time: "08:30 AM",
              impact: "High",
            },
            {
              id: "CAL-002",
              country: "EU",
              title: "ECB Interest Rate Decision",
              time: "12:45 PM",
              impact: "High",
            },
            {
              id: "CAL-003",
              country: "UK",
              title: "GDP Growth Rate",
              time: "09:00 AM",
              impact: "Medium",
            },
            {
              id: "CAL-004",
              country: "JP",
              title: "BOJ Monetary Policy",
              time: "03:00 AM",
              impact: "High",
            },
            {
              id: "CAL-005",
              country: "JP",
              title: "BOJ Monetary Policy",
              time: "03:00 AM",
              impact: "High",
            },
          ],
          accountStatus: "VERIFIED",
          joined: "JUL 2026",
          role: "ADMIN",
          plan: {
            name: "STANDARD PLAN",
            amount: 20,
            accountSize: "$200 - $500",
            duration: "14 DAYS",
            startDate: "2026-07-21",
            expires: "2026-08-04",
            status: "APPROVED",
          },
        });

        setLastUpdated("just now");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const netValue = useMemo(
    () => (data ? data.totalSpent + data.totalProfit : 0),
    [data],
  );

  if (loading) {
    return <LoadingDashboard />;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <XCircle className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-4 text-lg font-bold">Dashboard unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We could not load your account information.
            </p>
            <Button
              onClick={() => fetchDashboardData(true)}
              className="mt-6 bg-[#D4AF37] text-black hover:bg-[#c9a227]"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs: Tab[] = ["Billing", "Bonus"];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-5 py-4">
        {/* Main Balance Banner */}
        <section className="relative overflow-hidden rounded-2xl text-white shadow-2xl">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url(https://i.postimg.cc/R6qcqkWF/bg.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <div className="relative p-4 sm:p-7 lg:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative whitespace-nowrap px-2 pb-3 text-xs font-bold uppercase tracking-widest transition ${
                      activeTab === tab
                        ? "text-white"
                        : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#D4AF37]" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setHideBalance((previous) => !previous)}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label={hideBalance ? "Show account amounts" : "Hide account amounts"}
              >
                {hideBalance ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-zinc-400">
                    Estimated total value
                  </p>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Live
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <h2 className="text-4xl font-bold tracking-tight sm:text-4xl">
                    {hideBalance ? "******" : (activeTab === "Billing" ? "$0.00" : formatCurrency(netValue))}
                  </h2>
                  <span className="mb-2 text-sm font-medium text-zinc-500">
                    USD
                  </span>
                </div>
              </div>

              {/* stats */}
              <div className="grid grid-cols-4 gap-2 sm:gap-2">
                <Link
                  href="/user-dashboard/plans"
                  className="group flex flex-col items-center gap-2"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37] text-black shadow-lg transition group-hover:scale-105">
                    <Rocket className="h-5 w-5" />
                  </span>
                  <span className="text-center text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                    Subscribe
                  </span>
                </Link>

                <Link
                  href="/user-dashboard/connect"
                  className="group flex flex-col items-center gap-2"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 transition group-hover:border-[#D4AF37] group-hover:text-[#D4AF37]">
                    <Unplug className="h-5 w-5" />
                  </span>
                  <span className="text-center text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                    Connect
                  </span>
                </Link>

                <Link
                  href="/user-dashboard/predict"
                  className="group flex flex-col items-center gap-2"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 transition group-hover:border-[#D4AF37] group-hover:text-[#D4AF37]">
                    <BarChart3 className="h-5 w-5" />
                  </span>
                  <span className="text-center text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                    Predict
                  </span>
                </Link>

                <Link
                  href="/user-dashboard/predict"
                  className="group flex flex-col items-center gap-2"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-900 transition group-hover:border-[#D4AF37] group-hover:text-[#D4AF37]">
                    <Brain className="h-5 w-5" />
                  </span>
                  <span className="text-center text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                    AI Insights
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar cards: Active plan, Trading Calendar, News */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Plan Overview */}
            <Card className="w-full border-border/50 shadow-sm lg:w-1/3">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">
                    Active plan
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    Subscription and account allocation.
                  </CardDescription>
                </div>
                <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
              </CardHeader>

              <CardContent>
                <div className="rounded-2xl bg-zinc-950 p-4 text-white dark:bg-zinc-100 dark:text-zinc-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Current subscription
                      </p>
                      <h3 className="mt-1 text-lg font-bold">{data.plan.name}</h3>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {data.plan.status}
                    </span>
                  </div>

                  <div className="mt-5 flex w-full justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Plan fee
                      </p>
                      <p className="mt-1 font-bold">
                        {formatCurrency(data.plan.amount)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Account size
                      </p>
                      <p className="mt-1 font-bold">
                        {data.plan.accountSize}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-bold">{data.plan.duration}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Started</span>
                    <span className="font-bold">
                      {formatDate(data.plan.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-bold">
                      {formatDate(data.plan.expires)}
                    </span>
                  </div>
                </div>

                <Link href="/user-dashboard/plans">
                  <Button className="mt-5 w-full gap-2 rounded-full bg-[#D4AF37] p-5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#c9a227]">
                    Manage plan <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Trading Calendar */}
            <Card className="w-full border-border/50 shadow-sm lg:w-1/3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-bold">Trading Calendar</CardTitle>
                <Link href="/user-dashboard/calendar">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-blue-200 bg-blue-50 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400"
                  >
                    View All
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="space-y-3">
                {data.tradingCalendar.map((item) => (
                  <CalendarRow key={item.id} item={item} />
                ))}
              </CardContent>
            </Card>

            {/* News */}
            <Card className="w-full border-border/50 shadow-sm lg:w-1/3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-bold">News</CardTitle>
                <Link href="/user-dashboard/news">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full border-blue-200 bg-blue-50 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400"
                  >
                    View All
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="divide-y divide-border/40">
                {data.news.map((item) => (
                  <NewsRow key={item.id} item={item} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Trades - full width */}
          <Card className="w-full border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider">
                  Recent activity
                </CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Your latest executed positions.
                </CardDescription>
              </div>

              <Link href="/user-dashboard/trading">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 border-[#D4AF37]/50 text-[10px] font-bold uppercase tracking-wider text-[#B28D16] hover:bg-[#D4AF37]/10"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-y border-border/50 bg-muted/20 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <th className="px-6 py-3 text-left">Symbol</th>
                      <th className="px-6 py-3 text-center">Position</th>
                      <th className="px-6 py-3 text-center">Entry</th>
                      <th className="px-6 py-3 text-center">Lot size</th>
                      <th className="px-6 py-3 text-center">Result</th>
                      <th className="px-6 py-3 text-right">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/40">
                    {data.recentTrades.slice(0, 6).map((trade) => (
                      <tr
                        key={trade.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="px-6 py-4 text-left">
                          <div className="font-bold tracking-tight">
                            {trade.symbol}
                          </div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            {trade.id}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                              trade.type === "BUY"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {trade.type === "BUY" ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            {trade.type}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center font-medium tabular-nums">
                          {trade.entry.toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-center font-medium tabular-nums">
                          {trade.lotSize.toFixed(2)}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div
                            className={`font-bold tabular-nums ${
                              trade.profit >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {trade.profit >= 0 ? "+" : "-"}
                            {formatCurrency(trade.profit)}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                          {formatDate(trade.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}