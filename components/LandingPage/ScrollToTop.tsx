"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface ThemeAndScrollProps {
  children?: React.ReactNode;
}

export default function ThemeAndScroll({ children }: ThemeAndScrollProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;

      setShowScrollTop(scrollTop > 200);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on mount

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {children}

      {/* Floating Scroll to Top Button (Sleek Minimalist Dark/White Toggle) */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="
            fixed bottom-20 right-2 sm:bottom-22 sm:right-2 z-[50]          
            bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md text-neutral-800 dark:text-white border border-neutral-200/80 dark:border-neutral-700/80
            w-12 h-12 rounded-full
            flex items-center justify-center
            shadow-lg shadow-neutral-900/5 dark:shadow-black/20
            hover:bg-neutral-900 dark:hover:bg-neutral-700 hover:text-white dark:hover:text-white hover:border-neutral-900 dark:hover:border-neutral-600 hover:scale-110
            active:scale-95
            transition-all duration-300 cursor-pointer
          "
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Floating Theme Toggle Button */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="fixed bottom-6 right-2 sm:bottom-8 sm:right-2 z-50 flex items-center justify-center w-12 h-12 rounded-xl
          bg-gradient-to-tr from-indigo-900 via-indigo-800 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 
          hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none ring-1 ring-white/20"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      )}
    </>
  );
}