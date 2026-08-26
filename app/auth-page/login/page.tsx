"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setTimeout(() => {
          router.push("/UserDashboard/dashboard");
        }, 1000);
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-0 md:p-6">
      <div className="w-full md:h-auto md:max-w-5xl flex flex-col md:flex-row md:bg-white md:dark:bg-neutral-900 md:rounded-[2rem] md:shadow-2xl md:shadow-[#14123B]/20 md:border md:border-neutral-200 dark:border-neutral-800 overflow-hidden">
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
              Get access to your personal hub for clarity and productivity
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
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground mt-2 mb-8">
              Login to your account
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
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
                  type="text"
                  placeholder="you@example.com"
                  disabled={isLoading}
                  required
                  className="h-12 text-sm px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-background text-foreground focus-visible:ring-0 focus-visible:border-[#D4AF37] placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-foreground"
                  >
                    Password
                  </Label>
                  <Link
                    href="/auth-page/forgot-password"
                    className="text-xs font-semibold text-[#B8912A] hover:text-[#D4AF37] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                    className="h-12 pr-12 px-4 text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-background text-foreground focus-visible:ring-0 focus-visible:border-[#D4AF37] placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
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

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-1 rounded-xl text-sm font-semibold cursor-pointer bg-[#D4AF37] hover:bg-[#C9A22E] text-black shadow-lg shadow-[#D4AF37]/30 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Divider */}
              <div className="relative text-center text-xs font-medium my-1 after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-neutral-200 dark:after:border-neutral-700">
                <span className="relative z-10 bg-background px-3 text-muted-foreground">
                  or continue with
                </span>
              </div>

              {/* Social row */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  className="h-11 rounded-xl cursor-pointer bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground border border-neutral-200 dark:border-neutral-700 transition-all"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.847h-7.406l-5.8-7.584-6.637 7.584H.474l8.6-9.83L0 1.153h7.594l5.243 6.932 6.064-6.932zM17.61 20.644h2.039L6.486 3.24H4.298z" />
                  </svg>
                  <span className="sr-only">Continue with X</span>
                </Button>

                <Button
                  type="button"
                  className="h-11 rounded-xl cursor-pointer bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground border border-neutral-200 dark:border-neutral-700 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fill="#FFC107"
                      d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.207 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.348 4.337-17.694 10.691z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.104 0 9.799-1.957 13.355-5.145l-6.169-5.22C29.125 35.091 26.673 36 24 36c-5.186 0-9.623-3.326-11.283-7.946l-6.52 5.025C9.505 39.556 16.227 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611 20.083H42V20H24v8h11.303c-1.058 2.996-3.202 5.379-6.117 6.635l6.169 5.22C38.999 36.564 44 31 44 24c0-1.341-.138-2.65-.389-3.917z"
                    />
                  </svg>
                  <span className="sr-only">Continue with Google</span>
                </Button>

                <Button
                  type="button"
                  className="h-11 rounded-xl cursor-pointer bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-foreground border border-neutral-200 dark:border-neutral-700 transition-all"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="sr-only">Continue with Facebook</span>
                </Button>
              </div>

              {/* Register link */}
              <div className="text-center text-sm font-medium text-muted-foreground mt-2">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth-page/register"
                  className="font-semibold text-[#B8912A] hover:text-[#D4AF37] transition-colors"
                >
                  Sign up
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