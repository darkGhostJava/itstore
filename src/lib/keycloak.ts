
import type { KeycloakConfig } from 'keycloak-js';

const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'your-realm',
  clientId: 'your-client-id',
};

export default keycloakConfig;
