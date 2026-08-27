"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Radio,
  BadgeCheck,
  History,
  CircleGauge,
  ShieldCogCorner,
  Scale,
  Shield,
  Users,
  Send,
  ScreenShare,
  UserRound,
  BarChart3,
  ScrollText,
  Server,
  Tags,
  HelpCircle,
  FileText,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

type NavItem =
  | { name: string; icon: React.ElementType; href: string }
  | {
      name: string;
      icon: React.ElementType;
      children: { name: string; icon: React.ElementType; href: string }[];
    };

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isCollapsed, setIsCollapsed] = useState(true); // Controls desktop collapse state - default hidden

  // Load collapse state from localStorage on mount (desktop only)
  useEffect(() => {
    const savedState = localStorage.getItem('adminLeftSidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  // Save collapse state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('adminLeftSidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  // Group status tracking for collapsible sub-menus
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    MAIN: true,
    MANAGEMENT: true,
    ANALYTICS: true,
    SYSTEM: true,
  });

  // Updated to Admin Base Path
  const basePath = "/admin-dashboard";

  // Modal Auto-Close Countdown Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showLogoutConfirm && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setShowLogoutConfirm(false);
      setCountdown(10);
    }
    return () => clearTimeout(timer);
  }, [showLogoutConfirm, countdown]);

  // Admin Structured Navigation Items
  const navItems: NavItem[] = [
    // === MAIN ===
    { name: "Overview", icon: LayoutDashboard, href: `${basePath}/dashboard` },
    { name: "TG Provider", icon: Send, href: `${basePath}/providers` },
    { name: "Subscriptions", icon: BadgeCheck, href: `${basePath}/subscription` },
    { name: "MT5 Accounts", icon: Users, href: `${basePath}/mt5-accounts` },
    { name: "Trades Actions", icon: History, href: `${basePath}/trades-actions` },
    { name: "Copy jobs", icon: Tags, href: `${basePath}/copy-jobs` },
    { name: "Master trades", icon: Server, href: `${basePath}/master-trades` },
    { name: "Trades activity", icon: ScreenShare, href: `${basePath}/trade-activity` },
    { name: "Lot size settings", icon: Scale, href: `${basePath}/lot-size` },
    { name: "Stop lose settings", icon: ShieldCogCorner, href: `${basePath}/stop-loss` },
    { name: "Open limits settings", icon: CircleGauge, href: `${basePath}/position-limits` },
  ];

  // Auto-expand groups containing active pathnames
  useEffect(() => {
    navItems.forEach((item) => {
      if ("children" in item) {
        const hasActive = item.children.some((child) => pathname === child.href);
        if (hasActive) {
          setOpenGroups((prev) => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [pathname]);

  const toggleGroup = (name: string) => {
    // Prevent expanding menus when sidebar is closed completely
    if (isCollapsed) setIsCollapsed(false);
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex border-r border-indigo-900/50 h-screen sticky top-0 bg-gradient-to-b from-indigo-950 via-neutral-950 to-neutral-950 flex-col shadow-[4px_0_24px_rgba(79,70,229,0.15)] transition-all duration-300 relative ${
          isCollapsed ? "w-20" : "w-65"
        }`}
      >
        {/* Header */}
        <div className={`flex-shrink-0 flex items-center h-16 border-b border-indigo-900/50 transition-all duration-300 relative ${
          isCollapsed ? "justify-center px-2" : "justify-between px-6"
        }`}>
          <div className={`flex flex-col ${isCollapsed ? "items-center" : ""}`}>
            <h1 className="text-xl font-black uppercase tracking-tighter text-neutral-50">
              {isCollapsed ? "F" : "Shill"}<span className="text-neutral-50 font-black">{isCollapsed ? "X" : "Monger"}</span>
            </h1>
            {!isCollapsed && (
              <p className="text-[8px] font-bold tracking-[0.2em] text-neutral-400 uppercase whitespace-nowrap">
                Admin Control Room
              </p>
            )}
          </div>

          {/* Toggle Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 cursor-pointer bg-indigo-900 border border-indigo-700 rounded-full flex items-center justify-center text-indigo-300 hover:text-white shadow-md hover:bg-indigo-800 transition-colors z-10"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
          {navItems.map((item) => {
            if ("href" in item) {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-xl border border-transparent transition-all duration-200 ${
                    isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2.5"
                  } ${
                    active
                      ? "bg-indigo-600 text-white font-black border-indigo-500"
                      : "text-neutral-400 hover:bg-indigo-900/30 hover:text-indigo-300"
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={`w-5 h-5 transition-transform flex-shrink-0 ${
                      isCollapsed ? "" : "mr-5"
                    } ${active ? "scale-110" : "group-hover:scale-110"}`}
                  />
                  {!isCollapsed && (
                    <span className="text-[12px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            }

            const isOpen = !isCollapsed && !!openGroups[item.name];
            const hasActiveChild = item.children.some((c) => pathname === c.href);

            return (
              <div key={item.name} className="flex flex-col">
                <button
                  onClick={() => toggleGroup(item.name)}
                  className={`group w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    hasActiveChild
                      ? "text-indigo-300 font-black"
                      : "text-neutral-400 hover:bg-indigo-900/30 hover:text-indigo-300"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 mr-5 transition-transform ${
                      hasActiveChild ? "scale-110" : "group-hover:scale-110"
                    }`}
                  />
                  <span className="flex-1 text-left text-[12px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden">
                    {item.name}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div className={`${isOpen ? "block" : "hidden"} transition-all duration-300`}>
                  <div className="ml-4 mt-1 mb-1 pl-4 border-l-2 border-indigo-800/50 space-y-1">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`group flex items-center gap-3 px-3 py-2 rounded-lg border border-transparent transition-all duration-200 ${
                            childActive
                              ? "bg-indigo-600 text-white font-black border-indigo-500"
                              : "text-neutral-400 hover:bg-indigo-900/30 hover:text-indigo-300"
                          }`}
                        >
                          <child.icon
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${
                              childActive ? "scale-110" : "group-hover:scale-110"
                            }`}
                          />
                          <span className="text-[11px] font-black uppercase tracking-widest">
                            {child.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer Links */}
        <div className={`flex-shrink-0 border-t border-indigo-900/50 py-2 space-y-1 ${isCollapsed ? "px-2" : "px-4"}`}>
          {/* <Link
            href={`${basePath}/support`}
            className={`flex items-center w-full text-neutral-400 hover:bg-indigo-900/30 hover:text-indigo-300 transition-all rounded-xl group ${
              isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2"
            }`}
            title={isCollapsed ? "Support" : undefined}
          >
            <HelpCircle className={`w-5 h-5 group-hover:scale-110 transition-transform ${isCollapsed ? "" : "mr-3"}`} />
            {!isCollapsed && (
              <span className="text-[12px] font-black uppercase tracking-widest">
                Support
              </span>
            )}
          </Link>

          <Link
            href={`${basePath}/documentation`}
            className={`flex items-center w-full text-neutral-400 hover:bg-indigo-900/30 hover:text-indigo-300 transition-all rounded-xl group ${
              isCollapsed ? "justify-center px-2 py-3" : "px-4 py-2"
            }`}
            title={isCollapsed ? "Documentation" : undefined}
          >
            <FileText className={`w-5 h-5 group-hover:scale-110 transition-transform ${isCollapsed ? "" : "mr-3"}`} />
            {!isCollapsed && (
              <span className="text-[12px] font-black uppercase tracking-widest">
                Documentation
              </span>
            )}
          </Link> */}

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`flex items-center cursor-pointer w-full text-red-400 hover:bg-red-500/10 transition-all rounded-xl group ${
              isCollapsed ? "justify-center py-3" : "px-4 py-3"
            }`}
            title={isCollapsed ? "Logout My Account" : undefined}
          >
            <LogOut className={`w-5 h-5 transition-transform group-hover:-translate-x-0.5 ${isCollapsed ? "" : "mr-3"}`} />
            {!isCollapsed && (
              <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
                Logout Admin
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-950 via-neutral-950 to-neutral-950 z-[500] flex flex-col shadow-2xl lg:hidden">
            {/* Mobile Header */}
            <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-indigo-900/50">
              <div className="flex flex-col">
                <h1 className="text-xl font-black uppercase tracking-tighter text-neutral-50">
                  SECURE<span className="text-neutral-50 font-black"> RISE</span>
                </h1>
                <p className="text-[8px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                  Admin Control Room
                </p>
              </div>
              <button
                className="rounded-xl text-neutral-50 p-1 border border-indigo-800 bg-indigo-900"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav */}
            <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
              {navItems.map((item) => {
                if ("href" in item) {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-4 py-2.5 rounded-xl border border-transparent transition-all duration-200 ${
                        active
                          ? "bg-indigo-600 text-white font-black border-indigo-500"
                          : "text-neutral-400 hover:bg-indigo-900/30 hover:text-indigo-300"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`w-5 h-5 mr-5 transition-transform ${
                          active ? "scale-110" : "group-hover:scale-110"
                        }`}
                      />
                      <span className="text-[12px] font-black uppercase tracking-widest">
                        {item.name}
                      </span>
                    </Link>
                  );
                }

                const isOpen = !!openGroups[item.name];
                const hasActiveChild = item.children.some((c) => pathname === c.href);

                return (
                  <div key={item.name} className="flex flex-col">
                    <button
                      onClick={() => toggleGroup(item.name)}
                      className={`group w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                        hasActiveChild
                          ? "text-indigo-300 font-black"
                          : "text-neutral-400 hover:bg-indigo-900/30 hover:text-indigo-300"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 mr-5 transition-transform ${
                          hasActiveChild ? "scale-110" : "group-hover:scale-110"
                        }`}
                      />
                      <span className="flex-1 text-left text-[12px] font-black uppercase tracking-widest">
                        {item.name}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <div className={`${isOpen ? "block" : "hidden"} transition-all duration-300`}>
                      <div className="ml-4 mt-1 mb-1 pl-4 border-l-2 border-indigo-800/50 space-y-1">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`group flex items-center gap-3 px-3 py-2 rounded-lg border border-transparent transition-all duration-200 ${
                                childActive
                                  ? "bg-indigo-600 text-white font-black border-indigo-500 shadow-lg shadow-indigo-500/30"
                                  : "text-neutral-400 hover:bg-indigo-900/30 hover:text-indigo-300"
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <child.icon
                                className={`w-4 h-4 flex-shrink-0 transition-transform ${
                                  childActive ? "scale-110" : "group-hover:scale-110"
                                }`}
                              />
                              <span className="text-[11px] font-black uppercase tracking-widest">
                                {child.name}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* Mobile Footer Links */}
            <div className="flex-shrink-0 border-t border-indigo-900/50 px-4 py-2 space-y-1">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="flex items-center cursor-pointer w-full px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all rounded-xl group"
              >
                <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Logout Admin
                </span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-neutral-950 border-2 border-red-800 rounded-2xl w-full max-w-sm p-8 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-black uppercase tracking-tighter text-neutral-50 mb-2">
              Exit Panel?
            </h2>
            <p className="text-sm text-neutral-400 mb-4 leading-relaxed font-semibold">
              Are you sure you want to log out of the administration console?
            </p>

            {/* Countdown Progress Bar */}
            <div className="mb-6 border border-neutral-800 p-3 bg-neutral-900/60 rounded-xl">
              <div className="flex justify-between text-[10px] text-neutral-400 mb-2 uppercase tracking-widest font-bold">
                <span>Auto-closing in...</span>
                <span>{countdown}s</span>
              </div>
              <div className="w-full bg-red-900 border border-red-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex sm:flex-row gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setCountdown(10);
                }}
                className="flex-1 px-6 py-3 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-300 font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
              >
                Stay
              </button>
              <button
                onClick={() => {
                  router.push("/auth-page/login");
                  toast.success("Successfully logged out of Admin Panel");
                  setShowLogoutConfirm(false);
                  setCountdown(10);
                }}
                className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-500 transition-colors border border-red-500 cursor-pointer animate-pulse"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}