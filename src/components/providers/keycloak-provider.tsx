
"use client";

import { SSRKeycloakProvider, SSRCookies } from '@react-keycloak/ssr';
import keycloak from '@/lib/keycloak';
import { ReactNode } from 'react';
import type { KeycloakTokens } from '@react-keycloak/ssr'

interface KeycloakProviderProps {
  children: ReactNode;
  cookies?: unknown;
}

const cookiePersistor = (cookies: unknown) => {
  return {
    getTokens: () => {
      if (typeof window === 'undefined') {
        return {
          idToken: undefined,
          refreshToken: undefined,
          token: undefined,
        };
      }
      const cookieJar = (cookies as SSRCookies) || {};
      const storedTokens = cookieJar['keycloak-token'];
      
      try {
          return storedTokens ? JSON.parse(storedTokens as string) : {};
      } catch (e) {
          console.error("Failed to parse tokens from cookie", e);
          return {
            idToken: undefined,
            refreshToken: undefined,
            token: undefined,
          };
      }
    },
    saveTokens: (tokens: KeycloakTokens) => {
      if (typeof window === 'undefined') return;
      document.cookie = `keycloak-token=${JSON.stringify(tokens)}; path=/`;
    },
    clearTokens: () => {
       if (typeof window === 'undefined') return;
      document.cookie = 'keycloak-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }
}


export function KeycloakProvider({ children, cookies }: KeycloakProviderProps) {
  if (typeof keycloak === 'undefined') {
    return <>{children}</>;
  }
  
  return (
    <SSRKeycloakProvider
      keycloak={keycloak}
      persistor={cookiePersistor(cookies)}
    >
      {children}
    </SSRKeycloakProvider>
  );
}
