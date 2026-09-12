"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";

export default function AdminDashboardPage() {
  const [greeting, setGreeting] = useState("Welcome");
  const [currentTime, setCurrentTime] = useState("");

  // Admin statistics data
  const adminStats = [
    {
      label: "Total Users",
      icon: Users,
      iconColor: "text-neutral-400",
      value: "0.00",
      valueColor: "text-white",
      subtitle: "Registered Accounts",
    },
    {
      label: "Total Revenue",
      icon: DollarSign,
      iconColor: "text-emerald-400",
      value: "0.00",
      valueColor: "text-emerald-400",
      subtitle: "This Month",
    },
    {
      label: "Active Trades",
      icon: Activity,
      iconColor: "text-neutral-400",
      value: "0.00",
      valueColor: "text-white",
      subtitle: "Across All Users",
    },
    {
      label: "System Status",
      icon: ShieldCheck,
      iconColor: "text-emerald-400",
      value: "Healthy",
      valueColor: "text-emerald-400",
      subtitle: "All Systems Operational",
    },
  ];

  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good Morning");
    else if (hrs < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    setCurrentTime(new Date().toLocaleDateString("en-US", options));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-950 font-sans">
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-7xl space-y-8">
          
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b-2 border-black pb-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">
                {greeting}, Admin
              </p>
              <h1 className="text-4xl md:text-3xl font-mono font-black uppercase text-neutral-950 mb-2">
                Dashboard Overview
              </h1>
            </div>
            <div className="bg-neutral-950 text-white border-2 border-black px-4 py-2 text-right shadow-none rounded-xl flex-shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                System Time
              </span>
              <span className="text-xs font-mono font-bold">
                {currentTime || "July 18, 2026"}
              </span>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminStats.map((card, index) => (
              <Card key={index} className="rounded-xl bg-neutral-950 text-white border-2 border-black shadow-none">
                <CardContent className="px-5">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      {card.label}
                    </span>
                    <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                  <div className={`text-2xl font-black font-mono tracking-tight ${card.valueColor} mb-1`}>
                    {card.value}
                  </div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {card.subtitle}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* System Status Card */}
          <Card className="rounded-xl bg-neutral-950 text-white border-2 border-black shadow-none">
            <CardContent className="px-6 space-y-6">
              <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-tighter">
                  System Health
                </h2>
                <Activity className="h-4 w-4 text-neutral-400 animate-pulse" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { label: "Database", value: "Connected", positive: true },
                  { label: "API Server", value: "Running", positive: true },
                  { label: "MT5 Bridge", value: "Active", positive: true },
                  { label: "Auth Service", value: "Operational", positive: true },
                  { label: "Payment Gateway", value: "Connected", positive: true },
                  { label: "Email Service", value: "Active", positive: true },
                  { label: "CDN", value: "Cached", positive: true },
                  { label: "SSL Certificate", value: "Valid", positive: true },
                ].map((row, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      {row.label}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 border rounded-full ${
                      row.positive === true 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card className="rounded-xl bg-neutral-950 text-white border-2 border-black shadow-none">
            <CardContent className="px-6">
              <div className="border-b border-neutral-800 pb-3 mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black uppercase tracking-tighter">
                  Recent Alerts
                </h2>
                <AlertTriangle className="h-4 w-4 text-neutral-400" />
              </div>
              
              <div className="space-y-3">
                {[
                  { type: "warning", message: "High CPU usage on server-01 (85%)", time: "5 min ago" },
                  { type: "info", message: "New user registration spike detected", time: "12 min ago" },
                  { type: "success", message: "Database backup completed successfully", time: "1 hour ago" },
                  { type: "warning", message: "Payment gateway latency increased", time: "2 hours ago" },
                ].map((alert, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-neutral-900/40 border border-neutral-800 rounded-xl"
                  >
                    <span className="text-xs font-semibold text-neutral-300">
                      {alert.message}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      {alert.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
