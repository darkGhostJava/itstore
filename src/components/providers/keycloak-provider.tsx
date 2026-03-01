"use client";

import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "@/lib/keycloak";
import { useState, useEffect } from "react";
import Loading from "@/app/loading";

// Use a custom flag to track if initialization has begun to prevent double-init in StrictMode
let isKeycloakInit = false;

export function KeycloakProvider({ children }: { children: React.ReactNode }) {
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure this only runs on the client
    setIsClient(true);
    
    if (window.location.origin) {
      setRedirectUri(window.location.origin + "/silent-check-sso.html");
    }
    
    // Prevent multiple initializations which causes Keycloak JS to throw errors
    if (isKeycloakInit) {
        return; 
    }
    isKeycloakInit = true;

    console.log("Keycloak Client Initialization Started");
    
    return () => {};
  }, []);


  // The provider must only render when running on the client after logic is ready
  if (!isClient || !redirectUri) return <Loading />;

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: "check-sso",
        silentCheckSsoRedirectUri: redirectUri,
        /**
         * checkLoginIframe: false is essential to stop Keycloak from attempting the iframe check,
         * which frequently triggers "Refused to frame" CSP errors in production environments.
         */
        checkLoginIframe: false,
        pkceMethod: 'S256',
      }}
      onEvent={(event, error) => {
        if (event === 'onAuthError') console.error("Keycloak Auth Error", error);
        if (event === 'onTokenExpired') console.log("Keycloak Token Expired - Refreshing...");
      }}
      LoadingComponent={<Loading />}
    >
      {children}
    </ReactKeycloakProvider>
  );
}
