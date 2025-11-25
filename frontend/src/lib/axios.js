import axios from "axios";

const API_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_URL   // Production URL from .env.production
    : "http://localhost:5001/api";   // Local dev URL

export const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
