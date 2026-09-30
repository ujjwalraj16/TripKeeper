/**
 * lib/api.ts — Axios instance pre-configured with the backend base URL.
 * All API calls in the frontend should import `api` from here so the
 * base URL is set in one place (via the NEXT_PUBLIC_API_URL env var).
 */
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001",
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT token (if present) to every outgoing request.
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("tk_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("tk_token");
      localStorage.removeItem("tk_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
