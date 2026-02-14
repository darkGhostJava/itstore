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
  Boxes,
  ChevronLeft,
  ChevronRight,
  Printer,
  Undo2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "../ui/button";

interface SidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

export function Sidebar({ isExpanded, setIsExpanded }: SidebarProps) {
  const { t } = useTranslation('common');

  const navItems = [
    { href: "/", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/hardware", label: t("hardware"), icon: HardDrive },
    { href: "/consumables", label: t("consumable"), icon: Printer },
    { href: "/stock", label: t("stock", "Stock"), icon: Boxes },
    { href: "/arrivals", label: t("arrivals"), icon: Truck },
    { href: "/distributions", label: t("distributions"), icon: ArrowRightLeft },
    { href: "/reversals", label: t("reversements", "Reversals"), icon: Undo2 },
    { href: "/reparations", label: t("reparations"), icon: Wrench },
    { href: "/persons", label: t("persons"), icon: Users },
    { href: "/structures", label: t("structures"), icon: Building },
    { href: "/operations", label: t("operations"), icon: History },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isExpanded ? 256 : 56 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex overflow-hidden"
      )}
    >
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5 flex-1 w-full">
        <Link
          href="/"
          className={cn(
              "group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base transition-all",
               isExpanded && "self-start mb-4 mx-2"
            )}
        >
          <Workflow className="h-4 w-4 transition-all group-hover:scale-110" />
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="not-sr-only ml-2 text-lg font-bold whitespace-nowrap"
              >
                {t('app_title')}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <TooltipProvider>
          <div className="flex flex-col gap-2 w-full">
            {navItems.map((item, index) => (
              <SidebarNavItem key={item.href} {...item} isExpanded={isExpanded} index={index} />
            ))}
          </div>
        </TooltipProvider>
      </nav>
       <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5 w-full">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn("h-10 w-10 transition-all", isExpanded && "w-full")}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <span className="sr-only">{isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}</span>
              </Button>
            </TooltipTrigger>
            {!isExpanded && <TooltipContent side="right">{isExpanded ? 'Collapse' : 'Expand'}</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      </nav>
    </motion.aside>
  );
}

function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isExpanded,
  index,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isExpanded: boolean;
  index: number;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "rounded-lg justify-start h-10 transition-all duration-300 w-full overflow-hidden",
            isActive && "text-primary bg-primary/10 shadow-sm"
          )}
        >
          <Link href={href} className="flex items-center">
            <Icon className={cn("h-5 w-5 shrink-0", isExpanded ? "mr-4 ml-1" : "mx-auto")} />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.05 }}
                  className="whitespace-nowrap font-medium"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </Button>
      </TooltipTrigger>
      {!isExpanded && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );
}
