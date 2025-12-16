"use client";

import { useKeycloak } from "@react-keycloak/web";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { keycloak, initialized } = useKeycloak();

  useEffect(() => {
    // If Keycloak is initialized but not authenticated, force login
    if (initialized && !keycloak.authenticated) {
      keycloak.login();
    }
  }, [initialized, keycloak.authenticated, keycloak]);

  // Show a loader while Keycloak is initializing
  if (!initialized) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If authenticated, render the page
  if (keycloak.authenticated) {
    return <>{children}</>;
  }

  // Fallback (usually briefly visible before redirect)
  return <div>Redirecting to login...</div>;
}