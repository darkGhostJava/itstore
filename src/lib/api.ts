import axios from "axios";
import keycloak from "@/lib/keycloak";

/**
 * Axios instance configured for the application API.
 * Includes interceptors for handling Keycloak authentication and token refreshes.
 */
export const api = axios.create({
  baseURL: "https://materiel.dg.dse:8081/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach and refresh Bearer token
api.interceptors.request.use(
  async (config) => {
    // Check if Keycloak is authenticated
    if (keycloak?.authenticated) {
      try {
        /**
         * Update token if it expires in less than 30 seconds.
         * This prevents requests from failing due to stale tokens during active usage.
         * Keycloak internally handles whether a network request is actually needed.
         */
        await keycloak.updateToken(30);
        config.headers.Authorization = `Bearer ${keycloak.token}`;
      } catch (error) {
        console.error("Failed to refresh Keycloak token:", error);
        // If token update fails critically, we proceed; the response interceptor will catch the 401
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors and session expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (expired session)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.warn("Session expired or unauthorized. Re-authenticating...");
      
      try {
        // Attempt one last forced token update
        await keycloak.updateToken(-1); 
        originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, the user must log in again
        console.error("Session restoration failed. Redirecting to login.");
        keycloak.login();
      }
    }

    return Promise.reject(error);
  }
);
