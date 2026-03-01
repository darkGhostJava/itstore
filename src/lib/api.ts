import axios from "axios";
import keycloak from "@/lib/keycloak";

/**
 * Axios instance configured for the application API.
 * Includes interceptors for handling Keycloak authentication and proactive token refreshes.
 */
export const api = axios.create({
  baseURL: "https://materiel.dg.dse:8081/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Proactively refresh Bearer token before each request
api.interceptors.request.use(
  async (config) => {
    // Check if Keycloak is authenticated and initialized
    if (keycloak?.authenticated) {
      try {
        /**
         * Update token if it expires in less than 30 seconds.
         * This prevents requests from failing due to stale tokens.
         * Keycloak internally handles whether a network request is actually needed.
         */
        await keycloak.updateToken(30);
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      } catch (error) {
        console.error("Failed to refresh Keycloak token:", error);
        // If token update fails, we proceed without attaching a new token; 
        // the server will naturally reject the request if the old one is truly expired.
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
