"use client";

import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { KeycloakProvider } from "@/components/providers/keycloak-provider";
import "@/lib/i18n";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
                <Sidebar />
                <div className="flex flex-1 flex-col sm:pl-14">
                  <Header />
                  <main className="flex-1 p-4 sm:p-6 md:p-8">
                    {children}
                  </main>
                </div>
              </div>
              <Toaster />
            </ThemeProvider>
          </KeycloakProvider>
        </I18nextProvider>

      </body>
    </html>
  );
}
