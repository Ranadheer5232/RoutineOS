const rawUrl =
  import.meta.env.VITE_API_URL ||
  "https://routineos-backend-g5m5.onrender.com";

export const API_BASE_URL = String(rawUrl).trim().replace(/\/+$/, "");
