"use client";


import { useKeycloak } from "@react-keycloak/web";
import { useEffect } from "react";
import Loading from "@/app/loading";

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
    return <Loading />;
  }

  // If authenticated, render the page
  return <>{children}</>;
}
