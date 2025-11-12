
"use client";

import { SSRKeycloakProvider } from '@react-keycloak/ssr';
import keycloak from '@/lib/keycloak';
import { ReactNode } from 'react';

interface KeycloakProviderProps {
  children: ReactNode;
}

// This is a placeholder for the cookie persistor.
// In a real app, you would use a library like `nookies` or `js-cookie`.
const cookiePersistor = {
  getTokens: () => {
    if (typeof window === 'undefined') {
      return {
        idToken: undefined,
        refreshToken: undefined,
        token: undefined,
      };
    }
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
      const [key, value] = cookie.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    try {
        const storedTokens = cookies['keycloak-token'];
        return storedTokens ? JSON.parse(storedTokens) : {};
    } catch (e) {
        console.error("Failed to parse tokens from cookie", e);
        return {
          idToken: undefined,
          refreshToken: undefined,
          token: undefined,
        };
    }
  },
  saveTokens: (tokens: any) => {
    if (typeof window === 'undefined') return;
    document.cookie = `keycloak-token=${JSON.stringify(tokens)}; path=/`;
  },
  clearTokens: () => {
     if (typeof window === 'undefined') return;
    document.cookie = 'keycloak-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
}


export function KeycloakProvider({ children }: KeycloakProviderProps) {
  if (typeof keycloak === 'undefined') {
    return <>{children}</>;
  }
  
  return (
    <SSRKeycloakProvider
      keycloak={keycloak}
      persistor={cookiePersistor}
    >
      {children}
    </SSRKeycloakProvider>
  );
}
