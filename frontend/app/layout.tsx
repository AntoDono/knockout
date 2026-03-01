import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { TopNav } from "@/components/nav/TopNav";
import { BottomNav } from "@/components/nav/BottomNav";
import { FeelSomethingFAB } from "@/components/shared/FeelSomethingFAB";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Guardrail · TKOS Cardiac Monitoring",
  description: "Cardiac monitoring platform for Triadin Knockout Syndrome",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} font-[family-name:var(--font-plus-jakarta)] antialiased`}>
        <TopNav />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-20 sm:pb-8 pt-6">
          {children}
        </main>
        <BottomNav />
        <FeelSomethingFAB />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
