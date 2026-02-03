
import Link from "next/link";
import {
  LayoutDashboard,
  Truck,
  ArrowRightLeft,
  Wrench,
  Users,
  Building,
  History,
  PanelLeft,
  Workflow,
  HardDrive,
  Boxes,
  Printer,
  Undo2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./breadcrumbs";
import { UserNav } from "./user-nav";

export function Header() {
  const { t } = useTranslation('common');

  const mobileNavItems = [
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">{t('toggle_menu')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Workflow className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">{t('app_title')}</span>
            </Link>
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="block">
        <Breadcrumbs />
      </div>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Search could go here */}
      </div>
      <UserNav />
    </header>
  );
}
