"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  ArrowRightLeft,
  Wrench,
  Users,
  Building,
  History,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "../ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/articles", label: "Articles", icon: Package },
  { href: "/arrivals", label: "Arrivals", icon: Truck },
  { href: "/distributions", label: "Distributions", icon: ArrowRightLeft },
  { href: "/reparations", label: "Repairs", icon: Wrench },
  { href: "/persons", label: "Persons", icon: Users },
  { href: "/structures", label: "Structures", icon: Building },
  { href: "/operations", label: "Operations", icon: History },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Workflow className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">ITSM Dashboard</span>
        </Link>
        <TooltipProvider>
          {navItems.map((item) => (
            <SidebarNavItem key={item.href} {...item} />
          ))}
        </TooltipProvider>
      </nav>
    </aside>
  );
}

function SidebarNavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant={isActive ? "secondary" : "ghost"}
          size="icon"
          className={cn(
            "rounded-lg",
            isActive &&
              "text-primary"
          )}
        >
          <Link href={href}>
            <Icon className="h-5 w-5" />
            <span className="sr-only">{label}</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
