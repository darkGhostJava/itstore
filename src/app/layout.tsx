"use client";

import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { KeycloakProvider } from "@/components/providers/keycloak-provider";
import { CommandMenu } from "@/components/layout/command-menu";
import "@/lib/i18n";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background antialiased")}>
        <I18nextProvider i18n={i18n}>
          <KeycloakProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="relative flex min-h-screen w-full">
                <Sidebar isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} />
                <div className={cn(
                    "flex flex-1 flex-col transition-[margin-left] duration-300 ease-in-out",
                    isSidebarExpanded ? "sm:ml-64" : "sm:ml-14"
                  )}>
                  <Header />
                  <AnimatePresence mode="wait">
                    <motion.main
                      key={pathname}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="flex-1 p-4 sm:p-6 md:p-8"
                    >
                      {children}
                    </motion.main>
                  </AnimatePresence>
                </div>
              </div>
              <CommandMenu />
              <Toaster />
            </ThemeProvider>
          </KeycloakProvider>
        </I18nextProvider>
      </body>
    </html>
  );
}
