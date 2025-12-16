import Keycloak from "keycloak-js";

const keycloakConfig = {
  // Use your actual (secured) URL here
  url: "https://keycloak.dg.dse:3002", 
  realm: "materiel",
  clientId: "front-end",
};

let keycloak = new Keycloak(keycloakConfig);



export default keycloak;