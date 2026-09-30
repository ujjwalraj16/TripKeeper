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
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
