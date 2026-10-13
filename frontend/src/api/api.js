
import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
