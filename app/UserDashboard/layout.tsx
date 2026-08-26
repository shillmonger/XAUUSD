"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import UserNav from "@/components/UserDashboard/UserNav";
import UserLeftSidebar from "@/components/UserDashboard/UserSidebar";
import UserHeader from "@/components/UserDashboard/UserHeader";
import PromotionPopup from "@/components/UserDashboard/PromotionPopup";

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [promotionOpen, setPromotionOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    const checkPromotion = () => {
      const lastShown = localStorage.getItem("lastPromotionShown");
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;

      if (!lastShown || now - parseInt(lastShown) > tenMinutes) {
        const timer = setTimeout(() => {
          setPromotionOpen(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    checkPromotion();

    const interval = setInterval(() => {
      const lastShown = localStorage.getItem("lastPromotionShown");
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;

      if (!lastShown || now - parseInt(lastShown) > tenMinutes) {
        setPromotionOpen(true);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleClosePromotion = () => {
    setPromotionOpen(false);
    localStorage.setItem("lastPromotionShown", Date.now().toString());
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* 1. Left Sidebar (Takes full screen height on desktop) */}
      <UserLeftSidebar
        sidebarOpen={leftSidebarOpen}
        setSidebarOpen={setLeftSidebarOpen}
      />

      {/* 2. Main Area Wrapper (Holds Header + Page Content) */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Header spanning only the right side */}
        <header className="w-full shrink-0 z-40">
          <UserHeader onLeftClick={() => setLeftSidebarOpen(true)} />
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto px-4 pb-20 lg:px-6 lg:pb-6 scrollbar-hide">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <UserNav />

      {/* Promotion Popup */}
      <PromotionPopup isOpen={promotionOpen} onClose={handleClosePromotion} />
    </div>
  );
}