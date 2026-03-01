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

/**
 * Request Interceptor: Proactively refresh Bearer token before each request.
 * This checks if the token is about to expire and updates it if necessary.
 */
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
        console.error("Failed to refresh Keycloak token before request:", error);
        // If token update fails, we proceed; the response interceptor will catch the 401 if it fails at the server.
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor: Global error handling for authentication failures.
 * If the server returns 401 (Unauthorized), it means the token is invalid or the session has ended.
 * In this case, we redirect the user to the login page.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detect 401 Unauthorized errors which indicate a "wrong" or expired token
    if (error.response?.status === 401) {
      console.warn("Unauthorized request detected (401). Redirecting to login...");
      
      // Redirect to Keycloak login page
      if (keycloak) {
        keycloak.login();
      }
    }
    
    return Promise.reject(error);
  }
);
