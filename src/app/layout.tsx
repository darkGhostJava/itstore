"use client";

import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { KeycloakProvider } from "@/components/providers/keycloak-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className={cn("min-h-screen bg-background antialiased")}>
        
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

      </body>
    </html>
  );
}
