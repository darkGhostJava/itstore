"use client";

import { SSRKeycloakProvider, useKeycloak } from '@react-keycloak/ssr';
import { ReactNode, useMemo } from 'react';
import Keycloak, { KeycloakConfig } from 'keycloak-js';
import keycloakConfig from '@/lib/keycloak';

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


export function KeycloakProvider({ children }: { children: ReactNode }) {
  const keycloak = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new Keycloak(keycloakConfig);
    }
    return undefined;
  }, []);

  if (!keycloak) {
    return <>{children}</>;
  }

  return (
    <SSRKeycloakProvider
      keycloak={keycloak}
      persistor={persistor}
    >
      {children}
    </SSRKeycloakProvider>
  );
}
