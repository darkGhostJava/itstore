import axios from "axios";
import keycloak from "@/lib/keycloak";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  // 📌 Only attach the token if Keycloak is initialized and authenticated
  
  if (keycloak?.authenticated) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }

  return config;
});
