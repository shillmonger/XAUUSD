"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Email, 2: Success message
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      if (step === 1) {
        // Send reset email
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const email = formData.get("email") as string;
        setUserEmail(email);

        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success(data.message);
          setStep(2);
        } else {
          toast.error(data.error || "Failed to send reset email");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-0 md:p-6">
      <div className="w-full md:h-auto md:max-w-5xl flex flex-col md:flex-row bg-background md:rounded-[2rem] md:shadow-2xl md:shadow-[#14123B]/20 md:border md:border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Left Panel - gradient hero, hidden on mobile */}
        <div className="hidden md:flex relative w-1/2 flex-col justify-between p-8 m-3 rounded-3xl overflow-hidden bg-gradient-to-br from-[#14123B] via-[#1D1B4B] to-[#2A2678]">
          {/* soft blurred blobs for depth, gold instead of indigo */}
          <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-[#D4AF37]/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          {/* Candlestick motif from Hero - green and red */}
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
              {step === 1 && "Recover your account in seconds"}
              {step === 2 && "Check your email"}
            </h2>
          </div>
        </div>

        {/* Right Panel - form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-10 md:px-10 py-10">
          <div className="w-full max-w-sm mx-auto">
            {/* Logo text, shown on mobile only since left panel is hidden */}
            {/* <Link href="/" className="md:hidden mb-4">
              <h1 className="text-2xl font-black text-foreground tracking-tight">SHILLMONGER</h1>
            </Link> */}

            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              {step === 1 && "Forgot Password"}
              {step === 2 && "Email Sent"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 mb-8 leading-relaxed">
              {step === 1 && "Enter your email to receive a password reset link."}
              {step === 2 && `We've sent a password reset link to ${userEmail}. Check your inbox and follow the instructions.`}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* STEP 1: EMAIL */}
              {step === 1 && (
                <>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-foreground"
                    >
                      Your email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                      className="h-12 text-sm px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-background text-foreground focus-visible:ring-0 focus-visible:border-[#D4AF37] placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-1 rounded-xl text-sm font-semibold cursor-pointer bg-[#D4AF37] hover:bg-[#C9A22E] text-black shadow-lg shadow-[#D4AF37]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </>
              )}

              {/* STEP 2: SUCCESS MESSAGE */}
              {step === 2 && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <Button
                    type="button"
                    onClick={() => router.push("/auth-page/login")}
                    className="w-full h-12 mt-4 rounded-xl text-sm font-semibold cursor-pointer bg-[#D4AF37] hover:bg-[#C9A22E] text-black shadow-lg shadow-[#D4AF37]/30 transition-all"
                  >
                    Back to Login
                  </Button>
                </div>
              )}

              {/* Sign In link */}
              <div className="text-center text-sm font-medium text-muted-foreground mt-2">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth-page/login"
                  className="font-semibold text-[#B8912A] hover:text-[#D4AF37] transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </div>

          {/* Legal footer */}
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