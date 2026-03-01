"use client";

import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "@/lib/keycloak";
import { useState, useEffect } from "react";
import Loading from "@/app/loading";

// Use a custom flag to track if initialization has begun to prevent double-init in React StrictMode
let isKeycloakInitStarted = false;

export function KeycloakProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [initOptions, setInitOptions] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    if (!isKeycloakInitStarted) {
      isKeycloakInitStarted = true;
      
      const silentCheckSsoRedirectUri = window.location.origin + "/silent-check-sso.html";
      
      setInitOptions({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri,
        /**
         * checkLoginIframe: false prevents CSP "Refused to frame" errors 
         * which often occur in production with modern browser security policies.
         */
        checkLoginIframe: false,
        pkceMethod: 'S256',
      });
    }
  }, []);

  // Wait for client-side hydration and init options configuration
  if (!isClient || !initOptions) return <Loading />;

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={initOptions}
      onEvent={(event, error) => {
        if (event === 'onAuthError') console.error("Keycloak Auth Error", error);
        if (event === 'onTokenExpired') console.log("Keycloak Token Expired - Auto-refreshing via interceptor...");
      }}
      LoadingComponent={<Loading />}
    >
      {children}
    </ReactKeycloakProvider>
  );
}
