"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Unplug,
  CreditCard,
  Gem,
  ChartColumnBig,
  BadgeCheck,
  Wallet,
  ChartSpline,
  BarChart3,
  PieChart,
  Gift,
  Settings,
} from "lucide-react";
export default function UserNav() {
  const pathname = usePathname();
  const basePath = "/UserDashboard";

  const navItems = [
    { name: "Home", icon: LayoutDashboard, href: `${basePath}/dashboard` },
    { name: "Billing", icon: Wallet, href: `${basePath}/subscription` },
    { name: "Broker", icon: Unplug, href: `${basePath}/mt5-connection` },
    { name: "Predict", icon: BarChart3, href: `#` },
    { name: "Analytics", icon: PieChart, href: `${basePath}/my-investments` },
    { name: "Settings", icon: Settings, href: `${basePath}/user-settings` },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50 
        flex justify-around items-center 
        bg-background/95 backdrop-blur-xl
        py-2 pb-2 rounded-t-[0rem] 
        border-t border-border
        shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] 
        lg:hidden
      "
    >
      {navItems.map(({ name, href, icon: Icon }) => {
        const active = isActive(href);
        
        return (
          <Link
            key={name}
            href={href}
            className={`
              flex flex-col items-center transition-all duration-300
              ${active ? "text-[#D4AF37] scale-105" : "text-muted-foreground hover:text-foreground"}
            `}
          >
            <div
              className={`
                flex items-center justify-center 
                w-10 h-10 rounded-lg mb-1.5 
                transition-all duration-300
                ${
                  active
                    ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/30"
                    : "bg-secondary/50"
                }
              `}
            >
              <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
            </div>

            <span className={`text-[9px] font-black tracking-[0.15em] uppercase ${active ? "text-[#D4AF37] opacity-100" : "opacity-60"}`}>
              {name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}