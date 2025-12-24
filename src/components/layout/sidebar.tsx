
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  ArrowRightLeft,
  Wrench,
  Users,
  Building,
  History,
  Workflow,
  HardDrive,
  Printer,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "../ui/button";

export function Sidebar() {
  const { t } = useTranslation('common');

  const navItems = [
    { href: "/", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/hardware", label: t("hardware"), icon: HardDrive },
    { href: "/consumables", label: t("consumables"), icon: Printer },
    { href: "/arrivals", label: t("arrivals"), icon: Truck },
    { href: "/distributions", label: t("distributions"), icon: ArrowRightLeft },
    { href: "/reparations", label: t("reparations"), icon: Wrench },
    { href: "/persons", label: t("persons"), icon: Users },
    { href: "/structures", label: t("structures"), icon: Building },
    { href: "/operations", label: t("operations"), icon: History },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Workflow className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">{t('app_title')}</span>
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

    