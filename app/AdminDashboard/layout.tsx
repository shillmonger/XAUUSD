"use client";

import { useState } from "react";
import AdminHeader from "@/components/AdminDashboard/AdminHeader";
import AdminSidebar from "@/components/AdminDashboard/AdminSidebar";
import AdminNav from "@/components/AdminDashboard/AdminNav";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Left Sidebar */}
      <AdminSidebar
        sidebarOpen={leftSidebarOpen}
        setSidebarOpen={setLeftSidebarOpen}
      />

      {/* Main Area Wrapper */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Header */}
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
