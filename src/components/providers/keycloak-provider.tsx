"use client";

import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "@/lib/keycloak";
import { useState, useEffect } from "react";
// Removed usePathname import as it is not strictly necessary for this logic

// Use a custom flag to track if initialization has begun
let isKeycloakInit = false;

export function KeycloakProvider({ children }: { children: React.ReactNode }) {
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  // const pathname = usePathname(); // Not needed here

  useEffect(() => {
    // 1. Ensure this is client side
    setIsClient(true);
    
    // 2. Set the redirect URI only on the client
    if (window.location.origin) {
      setRedirectUri(window.location.origin + "/silent-check-sso.html");
    }
    
    // 3. Simple guard to prevent double-initialization in strict mode
    // This addresses the "A 'Keycloak' instance can only be initialized once" error.
    if (isKeycloakInit) {
        return; 
    }
    isKeycloakInit = true;

    // Optional: Log Keycloak status for debugging
    console.log("Keycloak Client Init Triggered");
    
    // We rely on the external isKeycloakInit flag to prevent re-runs.
    return () => {};
  }, []); // Changed dependency array to [] to ensure it runs only once on mount


  // IMPORTANT: The provider must only render when running on the client (after useEffect)
  if (!isClient || !redirectUri) return <div>Loading Keycloak...</div>;

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: "check-sso",
        silentCheckSsoRedirectUri: redirectUri,
        // checkLoginIframe: false is essential to stop Keycloak from attempting the iframe check,
        // which triggers the "Refused to frame" CSP error.
        checkLoginIframe: true,
      }}
      onEvent={(event, error) => console.log("Keycloak event", event, error)}
      onTokens={(tokens) => console.log("Tokens updated", tokens)}
      LoadingComponent={<div>Loading Keycloak...</div>}
    >
      {children}
    </ReactKeycloakProvider>
  );
}