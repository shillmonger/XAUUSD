"use client";

import { Menu, Settings } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface AdminMobileHeaderProps {
  onLeftClick: () => void;
  onRightClick?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  userAvatarUrl?: string;
  hasUnreadNotifications?: boolean;
}

export default function AdminHeader({
  onLeftClick,
  onRightClick,
  onNotificationClick,
  onProfileClick,
  userAvatarUrl,
  hasUnreadNotifications = true,
}: AdminMobileHeaderProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileImage, setProfileImage] = useState(userAvatarUrl);

  useEffect(() => {
    fetch('/api/user/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.profileImage) {
          setProfileImage(data.user.profileImage);
        }
      })
      .catch(err => console.error('Failed to fetch profile image:', err));
  }, []);

  const texts = [
    "ADMIN PANEL",
    "SHILLMONGER",
    "CONTROL ROOM",
  ];

  useEffect(() => {
    const currentFullText = texts[currentTextIndex];
    const typingSpeed = isDeleting ? 40 : 80;
    const delayAfterComplete = isDeleting ? 400 : 2200;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentFullText.length) {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), delayAfterComplete);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentTextIndex, texts]);

  return (
    <header
      className="
        lg:hidden
        fixed top-0 left-0 right-0 z-40
        flex items-center justify-between
        bg-black backdrop-blur-md
        border-b border-indigo-900/40
        px-4 py-2
        shadow-lg shadow-black/40
      "
    >
      {/* Left: Sidebar Toggle Button */}
      <button
        onClick={onLeftClick}
        aria-label="Open sidebar menu"
        className="
          cursor-pointer p-2 rounded-xl
          bg-indigo-950/40 hover:bg-indigo-900/60
          border border-indigo-800/50
          text-white
          transition-all duration-200 active:scale-95
        "
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center: Live Typewriter Header */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 via-indigo-300 to-white">
          {displayText}
          <span className="animate-pulse text-indigo-400">|</span>
        </span>
      </div>

      {/* Right: Actions Group (Notification Bell & Profile Avatar) */}
      <div className="flex items-center gap-2.5">
        {/* Setting Icon Button */}
        <button
          onClick={onNotificationClick || onRightClick}
          aria-label="Setting"
          className="
            relative cursor-pointer p-2 rounded-xl
            bg-indigo-950/40 hover:bg-indigo-900/60
            border border-indigo-800/50
            text-white
            transition-all duration-200 active:scale-95
          "
        >
          <Settings className="w-5 h-5" />
          {hasUnreadNotifications && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          )}
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onProfileClick || onRightClick}
          aria-label="User profile"
          className="
            relative cursor-pointer
            p-0.5 rounded-full
            hover:scale-105 active:scale-95
            transition-all duration-200
          "
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <img
              src={profileImage}
              alt="User Profile Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      </div>
    </header>
  );
}