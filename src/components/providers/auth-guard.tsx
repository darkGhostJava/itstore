"use client";

import { useKeycloak } from "@react-keycloak/ssr";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { keycloak, initialized } = useKeycloak();

  useEffect(() => {
    // If Keycloak is initialized but not authenticated, force login
    if (initialized && !keycloak?.authenticated) {
      keycloak?.login();
    }
  }, [initialized, keycloak]);

  // Show a loader while Keycloak is initializing
  if (!initialized || !keycloak?.authenticated) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If authenticated, render the page
  return <>{children}</>;
}
