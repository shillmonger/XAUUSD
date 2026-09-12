"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminHeader from "@/components/AdminDashboard/AdminHeader";
import AdminNav from "@/components/AdminDashboard/AdminNav";
import AdminSidebar from "@/components/AdminDashboard/AdminSidebar";

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
      <AdminSidebar
        sidebarOpen={leftSidebarOpen}
        setSidebarOpen={setLeftSidebarOpen}
      />

      {/* 2. Main Area Wrapper (Holds Header + Page Content) */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Header spanning only the right side */}
        <header className="w-full shrink-0 z-40">
          <AdminHeader onLeftClick={() => setLeftSidebarOpen(true)} />
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto px-4 pb-20 lg:px-6 lg:pb-6 scrollbar-hide">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <AdminNav />
    </div>
  );
}