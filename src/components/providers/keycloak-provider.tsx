
"use client";

import { SSRKeycloakProvider } from '@react-keycloak/ssr';
import keycloak from '@/lib/keycloak';
import { ReactNode } from 'react';

// Create a simple persistor that does nothing on the server
const persistor = {
  getTokens: () => {
    return {
      idToken: undefined,
      token: undefined,
      refreshToken: undefined,
    };
  },
  saveTokens: () => {},
  clearTokens: () => {},
};

interface KeycloakProviderProps {
  children: ReactNode;
}

export function KeycloakProvider({ children }: KeycloakProviderProps) {
  return (
    <SSRKeycloakProvider
      keycloak={keycloak}
      persistor={persistor}
    >
      {children}
    </SSRKeycloakProvider>
  );
}

