"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/" },
  { label: "Medications", href: "/medications" },
  { label: "Episodes", href: "/episodes" },
  { label: "Reports", href: "/reports" },
  { label: "Profile", href: "/profile" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Knockout logo" height={36} width={36} className="rounded-sm" />
          <span className="text-lg font-bold text-foreground">Knockout</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            DA
          </div>
        </div>
      </div>
    </header>
  );
}
