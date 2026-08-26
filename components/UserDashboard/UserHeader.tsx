"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Sun,
  Moon,
  Bell,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";

interface HeaderProps {
  onLeftClick: () => void;
}

interface UserData {
  userName: string;
  email: string;
  avatar?: string;
}

export default function UserHeader({
  onLeftClick,
}: HeaderProps) {
  // Theme state
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  
  // Fetch user data from backend
  const [user, setUser] = useState<UserData>({
    userName: "Loading...",
    email: "",
    avatar: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Notification count
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(true);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user/info");
        const data = await response.json();

        if (data.success) {
          const userData = data.user;
          setUser({
            userName: userData.userName || "User",
            email: userData.email || "",
            avatar: userData.avatar || "",
          });

          // Fetch notification count
          await fetchNotificationCount(userData._id);
        } else {
          console.error("Failed to fetch user data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
        setNotificationLoading(false);
      }
    };

    const fetchNotificationCount = async (userId: string) => {
      try {
        // Fetch deposits
        const depositsResponse = await fetch(
          `/api/user-dashboard/deposit?userId=${userId}`,
        );
        const depositsResult = await depositsResponse.json();

        // Fetch withdrawals
        const withdrawalsResponse = await fetch("/api/withdraw");
        const withdrawalsResult = await withdrawalsResponse.json();

        // Fetch investments
        const investmentsResponse = await fetch("/api/investments");
        const investmentsResult = await investmentsResponse.json();

        // Fetch gifts
        const giftsResponse = await fetch("/api/user-dashboard/gift/history");
        const giftsResult = await giftsResponse.json();

        // Fetch gift cards
        let giftCardsResult: any = { success: false, giftCards: [] };
        try {
          const giftCardsResponse = await fetch(
            `/api/user-dashboard/gift-card?userId=${userId}`,
          );
          giftCardsResult = await giftCardsResponse.json();
        } catch (error) {
          console.error("Error fetching gift cards:", error);
        }

        let unreadCount = 0;

        // Count unread deposits (pending ones)
        if (depositsResult.success && depositsResult.deposits) {
          unreadCount += depositsResult.deposits.filter(
            (d: any) => d.status !== "approved",
          ).length;
        }

        // Count unread withdrawals (pending ones)
        if (withdrawalsResult.withdrawals) {
          unreadCount += withdrawalsResult.withdrawals.filter(
            (w: any) => w.status !== "approved",
          ).length;
        }

        // Count ROI notifications (all profit history items are unread initially)
        if (investmentsResult.investments) {
          investmentsResult.investments.forEach((investment: any) => {
            if (
              investment.profitHistory &&
              investment.profitHistory.length > 0
            ) {
              unreadCount += investment.profitHistory.length;
            }
            // Count active investments as unread
            if (investment.status === "active") {
              unreadCount += 1;
            }
          });
        }

        // Count unread gifts (all gifts are unread initially)
        if (giftsResult.success && giftsResult.gifts) {
          unreadCount += giftsResult.gifts.length;
        }

        // Count unread gift cards (pending ones)
        if (giftCardsResult.success && giftCardsResult.giftCards) {
          const pendingGiftCards = giftCardsResult.giftCards.filter(
            (gc: any) => gc.status !== "approved",
          );
          unreadCount += pendingGiftCards.length;
        }

        setNotificationCount(unreadCount);
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchData();
  }, []);

  // Default profile image constant
  const defaultProfileImage = "https://github.com/shadcn.png";

  return (
    <header className="h-15 lg:h-15 border-b border-border flex items-center justify-between gap-4 px-4 sm:px-10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
          onClick={onLeftClick}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="space-y-0.5">
          <p className="text-[8px] md:text-xs text-muted-foreground font-medium uppercase tracking-widest hidden xs:block">
            Member Experience
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg cursor-pointer bg-secondary transition-colors"
          title="Toggle theme"
        >
          {mounted &&
            (theme === "dark" ? (
              <Sun className="w-5 h-5 text-white" />
            ) : (
              <Moon className="w-5 h-5 text-foreground" />
            ))}
        </button>

        {/* Notification Bell */}
        <Link
          href="/UserDashboard/notifications"
          className="p-2 bg-secondary rounded-lg relative cursor-pointer"
        >
          <Bell className="h-5 w-5" />

          {!notificationLoading && notificationCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border-2 border-background leading-none">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

        {/* User Details - No dropdown */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="hidden sm:block text-right">
            {!isLoading ? (
              <>
                <p className="text-xs font-black uppercase tracking-widest text-foreground">{user.userName}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{user.email}</p>
              </>
            ) : (
              <>
                <div className="h-3 w-20 bg-muted animate-pulse rounded mb-1" />
                <div className="h-2 w-28 bg-muted animate-pulse rounded" />
              </>
            )}
          </div>
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarImage 
              src={user.avatar || defaultProfileImage} 
              alt={user.userName} 
            />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {user.userName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}