"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Pill, ListChecks, FileText, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: House },
  { label: "Meds", href: "/medications", icon: Pill },
  { label: "Episodes", href: "/episodes", icon: ListChecks },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Profile", href: "/profile", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-white/90 backdrop-blur-lg sm:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
