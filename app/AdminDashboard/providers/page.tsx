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
  LogOut
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

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-950 font-sans">
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-7xl space-y-5">
          
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b-2 border-black pb-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-1">
                {greeting}, Admin
              </p>
              <h1 className="text-4xl md:text-3xl font-mono font-black uppercase text-neutral-950 mb-2">
                Telegram Providers
              </h1>
            </div>
            <div className="hidden lg:block bg-neutral-950 text-white border-2 border-black px-4 py-2 text-right rounded-xl flex-shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                System Time
              </span>
              <span className="text-xs font-mono font-bold">
                {currentTime || "July 18, 2026"}
              </span>
            </div>
          </div>

          {/* Telegram Connection */}
          <Card className="rounded-xl bg-neutral-950 text-white border-2 border-black shadow-none">
            <CardContent className="px-4 sm:px-6 space-y-6">
              <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-tighter">
                  Telegram Connection
                </h2>
                {telegramConnection?.connected ? (
                  <Wifi className="h-4 w-4 text-emerald-400" />
                ) : (
                  <WifiOff className="h-4 w-4 text-neutral-400" />
                )}
              </div>

              {isLoadingConnection ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-neutral-400 animate-spin mb-3" />
                  <p className="text-sm font-bold text-neutral-400">Loading connection status...</p>
                </div>
              ) : telegramConnection?.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-1">
                        Status
                      </p>
                      <p className="text-sm font-mono text-emerald-50">CONNECTED</p>
                    </div>
                    <Wifi className="h-5 w-5 text-emerald-400" />
                  </div>

                  {telegramConnection.account && (
                    <div className="p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Username
                        </p>
                        <p className="text-sm font-mono text-neutral-50">
                          {telegramConnection.account.username ? `@${telegramConnection.account.username}` : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          First Name
                        </p>
                        <p className="text-sm font-mono text-neutral-50">
                          {telegramConnection.account.firstName || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Telegram ID
                        </p>
                        <p className="text-sm font-mono text-neutral-50">
                          {telegramConnection.account.telegramUserId}
                        </p>
                      </div>
                      {telegramConnection.connectedAt && (
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                            Connected At
                          </p>
                          <p className="text-sm font-mono text-neutral-50">
                            {new Date(telegramConnection.connectedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="w-full flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={fetchTelegramGroups}
                      disabled={isFetching || !telegramConnection.connected}
                      className="flex-1 p-3 lg:p-5 bg-neutral-50 text-neutral-950 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      {isFetching ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Fetching Groups...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Fetch TG Groups
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={disconnectTelegram}
                      disabled={isConnecting}
                      className="flex-1 p-3 lg:p-5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500/20 transition-colors cursor-pointer"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4 mr-2" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 block mb-1">
                        Status
                      </p>
                      <p className="text-sm font-mono text-red-50">NOT CONNECTED</p>
                    </div>
                    <WifiOff className="h-5 w-5 text-red-400" />
                  </div>

                  <p className="text-sm text-neutral-400 text-center">
                    Connect your Telegram account to fetch and monitor groups/channels.
                  </p>

                  {!showOtpInput && !showPasswordInput ? (
                    <Button
                      onClick={connectTelegram}
                      disabled={isConnecting}
                      className="w-full p-3 lg:p-5 bg-[#229ED9] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#1d8cc2] transition-colors cursor-pointer"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Connect Telegram
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      {showOtpInput && (
                        <div className="space-y-2">
                          <p className="text-sm text-neutral-400 text-center">
                            Enter the OTP code sent to your Telegram app:
                          </p>
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="Enter OTP code"
                            className="w-full bg-neutral-900 border-2 border-neutral-800 text-white px-4 py-3 text-sm font-mono focus:outline-none focus:border-neutral-50 transition-colors rounded-xl"
                          />
                        </div>
                      )}

                      {showPasswordInput && (
                        <div className="space-y-2">
                          <p className="text-sm text-neutral-400 text-center">
                            Enter your 2FA password:
                          </p>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter 2FA password"
                            className="w-full bg-neutral-900 border-2 border-neutral-800 text-white px-4 py-3 text-sm font-mono focus:outline-none focus:border-neutral-50 transition-colors rounded-xl"
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={verifyTelegram}
                          disabled={isConnecting || (!otpCode && !password)}
                          className="flex-1 p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
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
                          className="flex-1 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500/20 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Telegram Groups */}
          {telegramGroups.length > 0 && (
            <Card className="rounded-xl bg-neutral-950 text-white border-2 border-black shadow-none">
              <CardContent className="px-4 sm:px-6 space-y-6">
                <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-tighter">
                    Available Telegram Groups/Channels
                  </h2>
                  <Users className="h-4 w-4 text-neutral-400" />
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search by group name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 text-white pl-10 pr-4 py-3 text-sm font-mono focus:outline-none focus:border-neutral-50 transition-colors rounded-xl"
                  />
                </div>

                <div className="space-y-3 overflow-x-auto">
                  {telegramGroups
                    .filter(group => 
                      group.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((group) => {
                    const saved = isProviderSaved(group.id);
                    return (
                      <div 
                        key={group.id}
                        className="flex items-center justify-between p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-xl min-w-[320px]"
                      >
                        <div className="flex items-center gap-4">
                          {group.profile_image ? (
                            <img 
                              src={group.profile_image} 
                              alt={group.name}
                              className="w-10 h-10 rounded-xl object-cover border border-neutral-700"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-neutral-800 border border-neutral-700 flex items-center justify-center rounded-full">
                              <Users className="w-5 h-5 text-neutral-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-neutral-50">{group.name}</p>
                            <p className="text-[10px] font-mono text-neutral-400">ID: {group.id}</p>
                            {group.type && (
                              <p className="text-[10px] font-mono text-neutral-500 uppercase">{group.type}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {saved ? (
                            <Button
                              disabled={true}
                              className="bg-blue-500/20 rounded-xl text-blue-300 border border-blue-500/30 font-black text-[10px] uppercase tracking-widest px-4 py-2"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Saved
                            </Button>
                          ) : (
                            <Button
                              onClick={() => saveProvider(group)}
                              disabled={isLoading}
                              className="bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-black text-[10px] uppercase tracking-widest px-4 py-2"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          )}
                          <Button
                            onClick={() => saved ? removeProvider(group.id) : setTelegramGroups(telegramGroups.filter(g => g.id !== group.id))}
                            disabled={isLoading}
                            className="bg-red-500/10 rounded-xl text-red-400 border border-red-500/20 hover:bg-red-500/20 font-black text-[10px] uppercase tracking-widest px-4 py-2"
                          >
                            <X className="w-4 h-4 mr-1" />
                            {saved ? 'Remove' : 'Remove'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Saved Providers */}
          <Card className="rounded-xl bg-neutral-950 text-white border-2 border-black shadow-none">
            <CardContent className="px-4 sm:px-6 space-y-6">
              <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-tighter">
                  Saved Providers
                </h2>
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              
              {isLoadingProviders ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-neutral-400 animate-spin mb-4" />
                  <p className="text-sm font-bold text-neutral-400">Loading providers...</p>
                </div>
              ) : savedProviders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-neutral-800 rounded-xl">
                  <AlertCircle className="w-12 h-12 text-neutral-600 mb-4" />
                  <p className="text-sm font-bold text-neutral-400">No providers saved yet</p>
                  <p className="text-[10px] text-neutral-500 mt-1">Fetch and save Telegram groups to get started</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-x-auto">
                  {savedProviders.map((provider) => (
                    <div 
                      key={provider._id}
                      className="flex items-center justify-between p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-xl min-w-[320px]"
                    >
                      <div className="flex items-center gap-4">
                        {provider.profileImage ? (
                          <img 
                            src={provider.profileImage} 
                            alt={provider.groupName}
                            className="w-10 h-10 rounded-xl object-cover border border-neutral-700"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-neutral-800 border border-neutral-700 flex items-center justify-center rounded-full">
                            <Users className="w-5 h-5 text-neutral-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-neutral-50">{provider.groupName}</p>
                          <p className="text-[10px] font-mono text-neutral-400">ID: {provider.groupId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 border rounded-full ${
                          provider.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {provider.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Button
                          onClick={() => toggleProviderStatus(provider._id, provider.isActive)}
                          disabled={isLoading}
                          className={`border rounded-xl font-black text-[10px] uppercase tracking-widest px-4 py-2 ${
                            provider.isActive
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          }`}
                        >
                          {provider.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          onClick={() => removeProvider(provider.groupId)}
                          disabled={isLoading}
                          className="bg-red-500/10 text-red-400 border rounded-xl border-red-500/20 hover:bg-red-500/20 font-black text-[10px] uppercase tracking-widest px-4 py-2"
                        >
                          <X className="w-4 h-4 mr-1" />
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
      </main>
    </div>
  );
}
