import axios from "axios";

const defaultBaseURL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:8000";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || defaultBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
