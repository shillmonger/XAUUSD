import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth - XAUUSD BOT",
  description: "Authentication pages",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
