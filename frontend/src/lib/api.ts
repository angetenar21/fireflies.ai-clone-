import axios from "axios";

const configuredBaseURL = process.env.NEXT_PUBLIC_API_URL?.trim();

const defaultBaseURL =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:8000";

const normalizedBaseURL = configuredBaseURL
  ? configuredBaseURL.replace(/\/api\/?$/, "").replace(/\/+$/, "")
  : defaultBaseURL;

const api = axios.create({
  baseURL: normalizedBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
