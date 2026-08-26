"use client";

import { useState, useEffect, useCallback } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background body scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Automatically close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const desktopNavLinks = [
    { label: "Subscription", href: "/LandingPage/subscribtion" },
    { label: "API", href: "/api" },
    { label: "About Bot", href: "/about" },
    { label: "Community", href: "/community" },
  ];

  const mobileNavLinks = [
    { label: "About BOT", href: "/about" },
    { label: "Community", href: "/community" },
    { label: "Subscription", href: "/LandingPage/subscribtion" },
    { label: "Refund Policy", href: "/refund" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Developers Portal", href: "/developers" },
    { label: "Guides & Tutorials", href: "/guides" },
  ];

  return (
    <>
      {/* Pinned Fixed Header with Constant Height */}
      <header
        className={`fixed top-0 left-0 right-0 w-full z-100 h-15 lg:h-13 transition-colors duration-200 bg-background border-b border-border`}
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-20 h-full flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="group inline-flex items-center gap-2 focus:outline-none">
            <span className="font-extrabold tracking-tight text-xl sm:text-2xl text-foreground transition-opacity group-hover:opacity-90">
              SHILLMONGER
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            {desktopNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors relative py-1 ${
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action Buttons & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth-page/login">
                <button className="text-sm font-semibold cursor-pointer text-muted-foreground hover:text-foreground px-5 py-2 transition-colors rounded-full bg-accent">
                  Sign In
                </button>
              </Link>

              <Link href="/auth-page/register">
                <button className="rounded-full cursor-pointer bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold transition-all hover:opacity-90 active:scale-95">
                  Register
                </button>
              </Link>
            </div>

            {/* Mobile Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 text-foreground hover:bg-accent rounded-xl transition-colors focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer div to push page content down */}
      <div className="h-14" />

      {/* Mobile Backdrop Overlay */}
      <div
        onClick={closeMobileMenu}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile Drawer Navigation Sidebar */}
      <aside
        aria-label="Mobile Navigation"
        className={`fixed right-0 top-0 h-full w-full max-w-full bg-background shadow-2xl z-500 transform transition-transform duration-300 ease-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 h-full flex flex-col justify-between overflow-y-auto">
          {/* Sidebar Top Section */}
          <div>
            {/* Header row with Title & Close Icon */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-border">
              <span className="text-foreground font-bold tracking-tight text-xl">
                SHILLMONGER
              </span>
              <button
                onClick={closeMobileMenu}
                aria-label="Close Navigation Menu"
                className="p-2 text-foreground hover:bg-accent rounded-xl transition-colors focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col space-y-5">
              {mobileNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`flex items-center px-0 py-0 rounded-xl text-base font-medium transition-colors ${
                      isActive
                        ? "bg-primary/0 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer & Actions */}
          <div className="pt-6 border-t border-border space-y-3">
            <Link href="/auth-page/login" className="w-full block">
              <button className="w-full py-3 border border-border text-foreground font-semibold rounded-full text-sm hover:bg-accent transition-all">
                Sign In
              </button>
            </Link>

            <Link href="/auth-page/register" className="w-full block">
              <button className="w-full bg-[#D4AF37] hover:bg-[#C9A22E] text-black py-3 font-semibold text-sm rounded-full transition-all hover:opacity-90 active:scale-95">
                Register Now
              </button>
            </Link>

            <p className="text-center text-[11px] text-muted-foreground mt-2 px-2">
              By joining, you agree to our Terms of Service and Risk Disclosure.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}