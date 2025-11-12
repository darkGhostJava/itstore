
import Keycloak from 'keycloak-js';

const keycloak = typeof window !== "undefined" ? new Keycloak({
  url: 'http://localhost:8080',
  realm: 'your-realm',
  clientId: 'your-client-id',
}) : undefined;

export default keycloak;
