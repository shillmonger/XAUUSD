"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (!token || !email) {
      setIsValidToken(false);
      toast.error('Invalid reset link');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms and Condition");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setTimeout(() => {
          router.push("/auth-page/login");
        }, 1500);
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invalid Reset Link</h1>
          <p className="text-muted-foreground mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/auth-page/forgot-password">
            <Button className="w-full bg-[#D4AF37] hover:bg-[#C9A22E] text-black">
              Request New Reset Link
            </Button>
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-0 md:p-6">
      <div className="w-full md:h-auto md:max-w-5xl flex flex-col md:flex-row md:bg-white md:dark:bg-neutral-900 md:rounded-[2rem] md:shadow-2xl md:shadow-[#14123B]/20 md:border md:border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Left Panel - gradient hero, hidden on mobile */}
        <div className="hidden md:flex relative w-1/2 flex-col justify-between p-8 m-3 rounded-3xl overflow-hidden bg-gradient-to-br from-[#14123B] via-[#1D1B4B] to-[#2A2678]">
          <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-[#D4AF37]/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
            viewBox="0 0 1200 550"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              points="0,420 60,400 120,430 180,360 240,380 300,300 360,330 420,260 480,290 540,220 600,250 660,180 720,210 780,150 840,190 900,120 960,160 1020,100 1080,140 1140,80 1200,110"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2"
            />
            {[60, 180, 300, 420, 540, 660, 780, 900, 1020, 1140].map((x, i) => (
              <rect
                key={x}
                x={x - 6}
                y={i % 2 === 0 ? 400 - i * 28 : 380 - i * 28}
                width="12"
                height="34"
                fill={i % 3 === 0 ? "#EF4444" : "#22C55E"}
                opacity="0.6"
              />
            ))}
          </svg>

          <Link href="/">
            <div className="relative z-10">
              <h1 className="text-3xl font-black text-white tracking-tight">SHILLMONGER</h1>
            </div>
          </Link>

          <div className="relative z-10 text-white">
            <p className="text-sm font-medium text-[#D4AF37] mb-2">
              You can easily
            </p>
            <h2 className="text-2xl font-bold leading-snug">
              Set a new secure password
            </h2>
          </div>
        </div>

        {/* Right Panel - form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-10 md:px-10 py-10">
          <div className="w-full max-w-sm mx-auto">
            <Link href="/" className="md:hidden mb-4">
              <h1 className="text-2xl font-black text-foreground tracking-tight">SHILLMONGER</h1>
            </Link>

            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Reset Password
            </h1>
            <p className="text-sm text-muted-foreground mt-2 mb-8">
              Enter and confirm your new password
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-foreground"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="h-12 pr-12 px-4 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-background text-foreground focus-visible:ring-0 focus-visible:border-[#D4AF37] placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-200 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-semibold text-foreground"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="h-12 pr-12 px-4 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-background text-foreground focus-visible:ring-0 focus-visible:border-[#D4AF37] placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-200 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  id="terms"
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className={`h-5 w-5 shrink-0 rounded-md border transition-all flex items-center justify-center cursor-pointer ${
                    agreedToTerms
                      ? "bg-[#D4AF37] border-[#D4AF37] text-black"
                      : "border-neutral-300 dark:border-neutral-600 bg-background hover:border-neutral-400 dark:hover:border-neutral-500"
                  }`}
                >
                  {agreedToTerms && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </button>
                <Label
                  htmlFor="terms"
                  className="text-xs font-semibold text-muted-foreground select-none leading-tight cursor-pointer"
                >
                  I agree to the{" "}
                  <Link href="#" className="text-[#B8912A] hover:text-[#D4AF37] transition-colors">
                    Terms and Condition
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className="w-full h-12 mt-1 rounded-xl text-sm font-semibold cursor-pointer bg-[#D4AF37] hover:bg-[#C9A22E] text-black shadow-lg shadow-[#D4AF37]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <div className="text-center text-sm font-medium text-muted-foreground mt-2">
                Remember your password?{" "}
                <Link
                  href="/auth-page/login"
                  className="font-semibold text-[#B8912A] hover:text-[#D4AF37] transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </div>

          <div className="w-full max-w-sm mx-auto mt-8 text-center text-xs font-medium text-muted-foreground leading-relaxed">
            By clicking continue, you agree to our{" "}
            <Link href="#" className="font-semibold text-foreground hover:text-foreground/80 transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="font-semibold text-foreground hover:text-foreground/80 transition-colors">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37] mx-auto" />
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}