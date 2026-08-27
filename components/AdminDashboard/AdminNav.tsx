"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  Shield,
  Send,
  CreditCard,
  BadgeCheck,
} from "lucide-react";

export default function AdminNav() {
  const pathname = usePathname();
  const basePath = "/admin-dashboard";

  const navItems = [
    { name: "home", icon: LayoutDashboard, href: `${basePath}/dashboard` },
    { name: "Users", icon: Users, href: `${basePath}/users` },
    { name: "Sources", icon: Send, href: `${basePath}/providers` },
    { name: "Trades", icon: BarChart3, href: `${basePath}/trades` },
    { name: "Plans", icon: BadgeCheck, href: `${basePath}/subscription` },
    { name: "Settings", icon: Settings, href: `${basePath}/settings` },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50 
        flex justify-around items-center 
        bg-black
        py-2.5 pb-safe-bottom px-2
        lg:hidden select-none
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
              ${active ? "text-indigo-300 scale-105" : "text-neutral-400 hover:text-indigo-300"}
            `}
          >
            <div
              className={`
                flex items-center justify-center 
                w-12 h-12 rounded-xl mb-1.5 
                transition-all duration-300
                ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-900/20"
                }
              `}
            >
              <Icon 
                className={`w-5 h-5 transition-transform duration-300 ${active ? "scale-110" : ""}`} 
              />
            </div>

            <span 
              className={`
                text-[9px] font-black tracking-[0.15em] uppercase transition-opacity duration-300
                ${active ? "text-indigo-400 opacity-100" : "text-neutral-400 opacity-60"}
              `}
            >
              {name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}