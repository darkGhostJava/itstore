import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8081/api", // 👈 your backend base URL
  headers: {
    "Content-Type": "application/json",
  },
});
