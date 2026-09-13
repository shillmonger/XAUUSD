"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Send,
  RefreshCw,
  Check,
  X,
  Loader2,
  Users,
  AlertCircle,
  Search,
  Wifi,
  WifiOff,
  LogOut,
  Radio,
  Clock,
  UserCircle2,
  Hash,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface TelegramGroup {
  id: string;
  name: string;
  profile_image?: string;
  type?: string;
  username?: string;
}

interface SavedProvider {
  _id: string;
  groupId: string;
  groupName: string;
  profileImage: string;
  isActive: boolean;
}

interface TelegramConnection {
  connected: boolean;
  status: string;
  account?: {
    telegramUserId: string;
    username?: string;
    firstName?: string;
  };
  connectedAt?: string;
  lastCheckedAt?: string;
}

/**
 * ToggleRow
 * Shared settings-list toggle primitive (label + optional description on
 * the left, pill switch on the right) — kept visually consistent with the
 * toggle pattern used elsewhere in the dashboard.
 */
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  color = "emerald",
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  color?: "emerald" | "gold" | "amber" | "red";
}) {
  const trackColor: Record<string, string> = {
    emerald: "bg-emerald-500",
    gold: "bg-[#D4AF37]",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 text-right">
        {description && (
          <p className="text-[10px] font-mono text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-black/5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-40 ${
          checked ? trackColor[color] : "bg-muted-foreground/25"
        }`}
      >
        <span
          className="inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
          style={{ transform: checked ? "translateX(21px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-[#D4AF37]">
          {icon}
        </div>
        <h2 className="text-sm font-black uppercase tracking-wider">{title}</h2>
      </div>
      {right}
    </div>
  );
}

export default function ProvidersPage() {
  const [greeting, setGreeting] = useState("Welcome");
  const [currentTime, setCurrentTime] = useState("");
  const [telegramGroups, setTelegramGroups] = useState<TelegramGroup[]>([]);
  const [savedProviders, setSavedProviders] = useState<SavedProvider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [telegramConnection, setTelegramConnection] = useState<TelegramConnection | null>(null);
  const [isLoadingConnection, setIsLoadingConnection] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");

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

    // Load Telegram connection status and saved providers
    fetchTelegramStatus();
    fetchSavedProviders();
  }, []);

  const fetchTelegramStatus = async () => {
    setIsLoadingConnection(true);
    try {
      const response = await fetch('/api/admin/telegram/status');
      const data = await response.json();
      if (response.ok) {
        setTelegramConnection(data);
      }
    } catch (error) {
      console.error('Error fetching Telegram status:', error);
    } finally {
      setIsLoadingConnection(false);
    }
  };

  const fetchSavedProviders = async () => {
    setIsLoadingProviders(true);
    try {
      const response = await fetch('/api/admin/providers');
      const data = await response.json();
      if (response.ok) {
        setSavedProviders(data.providers);
      }
    } catch (error) {
      console.error('Error fetching saved providers:', error);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  const connectTelegram = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/admin/telegram/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      // Check for OTP/password requirements first, regardless of HTTP status
      if (data.requiresOtp) {
        setShowOtpInput(true);
        setShowPasswordInput(false);
        toast.info('Please enter the OTP code sent to your Telegram app');
      } else if (data.requiresPassword) {
        setShowPasswordInput(true);
        setShowOtpInput(false);
        toast.info('Please enter your 2FA password');
      } else if (response.ok) {
        toast.success('Telegram connected successfully');
        setShowOtpInput(false);
        setShowPasswordInput(false);
        setOtpCode('');
        setPassword('');
        await fetchTelegramStatus();
      } else {
        toast.error(data.error || 'Failed to connect Telegram');
      }
    } catch (error) {
      console.error('Error connecting Telegram:', error);
      toast.error('Failed to connect Telegram');
    } finally {
      setIsConnecting(false);
    }
  };

  const verifyTelegram = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/admin/telegram/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: otpCode,
          password: password,
        }),
      });

      const data = await response.json();

      // Check for password requirement first, regardless of HTTP status
      if (data.requiresPassword) {
        setShowPasswordInput(true);
        setShowOtpInput(false);
        toast.info('Please enter your 2FA password');
      } else if (response.ok) {
        toast.success('Telegram authentication completed successfully');
        setShowOtpInput(false);
        setShowPasswordInput(false);
        setOtpCode('');
        setPassword('');
        await fetchTelegramStatus();
      } else {
        toast.error(data.error || 'Failed to verify Telegram authentication');
      }
    } catch (error) {
      console.error('Error verifying Telegram:', error);
      toast.error('Failed to verify Telegram authentication');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectTelegram = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/admin/telegram/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Telegram disconnected successfully');
        await fetchTelegramStatus();
      } else {
        toast.error(data.error || 'Failed to disconnect Telegram');
      }
    } catch (error) {
      console.error('Error disconnecting Telegram:', error);
      toast.error('Failed to disconnect Telegram');
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchTelegramGroups = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/admin/providers/fetch-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Frontend received data:', data);

      if (response.ok) {
        const groups = data.groups || [];
        setTelegramGroups(groups);
        toast.success(`Fetched ${groups.length} Telegram groups`);
      } else {
        toast.error(data.error || 'Failed to fetch groups');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups from Telegram');
    } finally {
      setIsFetching(false);
    }
  };

  const saveProvider = async (group: TelegramGroup) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/providers/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: group.id,
          groupName: group.name,
          profileImage: group.profile_image || '',
          type: group.type || 'group',
          username: group.username || '',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Provider saved successfully');
        // Remove from telegram groups list
        setTelegramGroups(telegramGroups.filter(g => g.id !== group.id));
        // Refresh saved providers
        await fetchSavedProviders();
      } else {
        toast.error(data.error || 'Failed to save provider');
      }
    } catch (error) {
      console.error('Error saving provider:', error);
      toast.error('Failed to save provider');
    } finally {
      setIsLoading(false);
    }
  };

  const removeProvider = async (groupId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/providers/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Provider removed successfully');
        // Refresh saved providers
        await fetchSavedProviders();
      } else {
        toast.error(data.error || 'Failed to remove provider');
      }
    } catch (error) {
      console.error('Error removing provider:', error);
      toast.error('Failed to remove provider');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProviderStatus = async (providerId: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/telegram/providers/${providerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Provider ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
        await fetchSavedProviders();
      } else {
        toast.error(data.error || 'Failed to update provider status');
      }
    } catch (error) {
      console.error('Error updating provider status:', error);
      toast.error('Failed to update provider status');
    } finally {
      setIsLoading(false);
    }
  };

  const isProviderSaved = (groupId: string) => {
    return savedProviders.some(p => p.groupId === groupId);
  };

  const getSavedProvider = (groupId: string) => {
    return savedProviders.find(p => p.groupId === groupId);
  };

  const filteredGroups = telegramGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <main className="mx-auto w-full max-w-7xl py-5 lg:py-5">

        {/* HEADER */}
        <div className="mb-5 flex flex-col gap-4 border-b border-border/60 pb-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              {greeting}, Admin
            </p>
            <h1 className="flex items-center gap-2.5 text-2xl font-mono font-black uppercase tracking-tight">
              <Send className="h-5 w-5 text-[#D4AF37]" />
              Telegram Providers
            </h1>
          </div>
<div className="hidden items-center gap-3 md:flex">
            
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                telegramConnection?.connected
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                {telegramConnection?.connected && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                )}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${telegramConnection?.connected ? "bg-emerald-500" : "bg-red-500"}`} />
              </span>
              {telegramConnection?.connected ? "Connected" : "Offline"}
            </span>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/60 px-4 py-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <span className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  System Time
                </span>
                <span className="text-xs font-mono font-bold">
                  {currentTime || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN GRID — connection panel on the right, content on the left */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* LEFT COLUMN — groups + saved providers */}
          <div className="space-y-6 lg:col-span-2">

            {/* AVAILABLE TELEGRAM GROUPS */}
            <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
              <CardContent className="space-y-5 px-4 sm:px-6 sm:py-2">
                <SectionHeading
                  icon={<Users className="h-4 w-4" />}
                  title="Available Groups / Channels"
                  right={
                    telegramConnection?.connected ? (
                      <Button
                        onClick={fetchTelegramGroups}
                        disabled={isFetching}
                        size="sm"
                        className="rounded-lg bg-muted px-3 py-2 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted/70"
                      >
                        {isFetching ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {isFetching ? "Fetching…" : "Fetch Groups"}
                      </Button>
                    ) : null
                  }
                />

                {!telegramConnection?.connected ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-10 text-center">
                    <WifiOff className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground">
                      Connect Telegram to browse your groups
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use the connection panel on the right to get started
                    </p>
                  </div>
                ) : telegramGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-10 text-center">
                    <Radio className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground">
                      No groups fetched yet
                    </p>
                    <Button
                      onClick={fetchTelegramGroups}
                      disabled={isFetching}
                      size="sm"
                      className="rounded-lg bg-[#D4AF37] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black hover:bg-[#c9a227]"
                    >
                      {isFetching ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {isFetching ? "Fetching…" : "Fetch TG Groups"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by group name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-border/60 bg-muted/40 py-3 pl-10 pr-4 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-[#D4AF37] focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
                      {filteredGroups.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          No groups match “{searchTerm}”
                        </p>
                      ) : (
                        filteredGroups.map((group) => {
                          const saved = isProviderSaved(group.id);
                          return (
                            <div
                              key={group.id}
                              className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3.5 transition-colors hover:border-[#D4AF37]/30 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                {group.profile_image ? (
                                  <img
                                    src={group.profile_image}
                                    alt={group.name}
                                    className="h-10 w-10 shrink-0 rounded-xl border border-border/60 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold">{group.name}</p>
                                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Hash className="h-2.5 w-2.5" />
                                      {group.id}
                                    </span>
                                    {group.type && (
                                      <span className="uppercase">{group.type}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex shrink-0 gap-2">
                                {saved ? (
                                  <span className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                    <Check className="h-3.5 w-3.5" />
                                    Saved
                                  </span>
                                ) : (
                                  <Button
                                    onClick={() => saveProvider(group)}
                                    disabled={isLoading}
                                    size="sm"
                                    className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                                  >
                                    <Check className="mr-1 h-3.5 w-3.5" />
                                    Save
                                  </Button>
                                )}
                                <Button
                                  onClick={() =>
                                    saved
                                      ? removeProvider(group.id)
                                      : setTelegramGroups(telegramGroups.filter(g => g.id !== group.id))
                                  }
                                  disabled={isLoading}
                                  size="sm"
                                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-500/20 dark:text-red-400"
                                >
                                  <X className="mr-1 h-3.5 w-3.5" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* SAVED PROVIDERS */}
            <Card className="overflow-hidden rounded-2xl border-border/60 shadow-sm">
              <CardContent className="space-y-5 px-4 sm:px-6 sm:py-2">
                <SectionHeading
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Saved Providers"
                  right={
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {savedProviders.filter(p => p.isActive).length} / {savedProviders.length} active
                    </span>
                  }
                />

                {isLoadingProviders ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="mb-4 h-10 w-10 animate-spin text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground">Loading providers...</p>
                  </div>
                ) : savedProviders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border/60 py-12 text-center">
                    <AlertCircle className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground">No providers saved yet</p>
                    <p className="text-[10px] text-muted-foreground">
                      Fetch and save Telegram groups to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {savedProviders.map((provider) => (
                      <div
                        key={provider._id}
                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {provider.profileImage ? (
                            <img
                              src={provider.profileImage}
                              alt={provider.groupName}
                              className="h-10 w-10 shrink-0 rounded-xl border border-border/60 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted">
                              <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{provider.groupName}</p>
                            <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                              <Hash className="h-2.5 w-2.5" />
                              {provider.groupId}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
                              provider.isActive
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {provider.isActive ? "Active" : "Inactive"}
                          </span>

                          <ToggleRow
                            label={`Toggle ${provider.groupName}`}
                            checked={provider.isActive}
                            disabled={isLoading}
                            color="emerald"
                            onChange={() => toggleProviderStatus(provider._id, provider.isActive)}
                          />

                          <Button
                            onClick={() => removeProvider(provider.groupId)}
                            disabled={isLoading}
                            size="sm"
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-500/20 dark:text-red-400"
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN — Telegram connection panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 overflow-hidden rounded-2xl border-border/60 shadow-sm">
              <CardContent className="space-y-5 px-4 sm:px-6 sm:py-2">
                <SectionHeading
                  icon={telegramConnection?.connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                  title="Telegram Connection"
                />

                {isLoadingConnection ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="mb-3 h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground">Checking status...</p>
                  </div>
                ) : telegramConnection?.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400">
                      <div>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest">Status</p>
                        <p className="font-mono text-sm">CONNECTED</p>
                      </div>
                      <Wifi className="h-5 w-5" />
                    </div>

                    {telegramConnection.account && (
                      <div className="space-y-1 rounded-xl border border-border/60 bg-muted/40 p-4">
                        <div className="flex items-center justify-between py-1.5">
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <UserCircle2 className="h-3 w-3" /> Username
                          </span>
                          <span className="font-mono text-sm">
                            {telegramConnection.account.username ? `@${telegramConnection.account.username}` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/50 py-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            First Name
                          </span>
                          <span className="font-mono text-sm">
                            {telegramConnection.account.firstName || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/50 py-1.5">
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <Hash className="h-3 w-3" /> Telegram ID
                          </span>
                          <span className="font-mono text-sm">
                            {telegramConnection.account.telegramUserId}
                          </span>
                        </div>
                        {telegramConnection.connectedAt && (
                          <div className="flex items-center justify-between border-t border-border/50 py-1.5">
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              <Clock className="h-3 w-3" /> Connected At
                            </span>
                            <span className="font-mono text-xs">
                              {new Date(telegramConnection.connectedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2.5">
                      <Button
                        onClick={fetchTelegramGroups}
                        disabled={isFetching}
                        className="w-full cursor-pointer rounded-xl bg-muted p-5 text-xs font-black uppercase tracking-widest text-foreground transition-colors hover:bg-muted/70"
                      >
                        {isFetching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Fetching Groups...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Fetch TG Groups
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={disconnectTelegram}
                        disabled={isConnecting}
                        className="w-full cursor-pointer rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-xs font-black uppercase tracking-widest text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          <>
                            <LogOut className="mr-2 h-4 w-4" />
                            Disconnect
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-600 dark:text-red-400">
                      <div>
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest">Status</p>
                        <p className="font-mono text-sm">NOT CONNECTED</p>
                      </div>
                      <WifiOff className="h-5 w-5" />
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                      Connect your Telegram account to fetch and monitor groups/channels.
                    </p>

                    {!showOtpInput && !showPasswordInput ? (
                      <Button
                        onClick={connectTelegram}
                        disabled={isConnecting}
                        className="w-full cursor-pointer rounded-xl bg-[#D4AF37] p-3 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-[#c9a227]"
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Connect Telegram
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        {showOtpInput && (
                          <div className="space-y-2">
                            <p className="text-center text-sm text-muted-foreground">
                              Enter the OTP code sent to your Telegram app:
                            </p>
                            <input
                              type="text"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="Enter OTP code"
                              className="w-full rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm font-mono text-foreground transition-colors focus:border-[#D4AF37] focus:outline-none"
                            />
                          </div>
                        )}

                        {showPasswordInput && (
                          <div className="space-y-2">
                            <p className="text-center text-sm text-muted-foreground">
                              Enter your 2FA password:
                            </p>
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter 2FA password"
                              className="w-full rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm font-mono text-foreground transition-colors focus:border-[#D4AF37] focus:outline-none"
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={verifyTelegram}
                            disabled={isConnecting || (!otpCode && !password)}
                            className="flex-1 cursor-pointer rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-black uppercase tracking-widest text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Verify
                              </>
                            )}
                          </Button>

                          <Button
                            onClick={() => {
                              setShowOtpInput(false);
                              setShowPasswordInput(false);
                              setOtpCode('');
                              setPassword('');
                            }}
                            disabled={isConnecting}
                            className="flex-1 cursor-pointer rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-black uppercase tracking-widest text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}