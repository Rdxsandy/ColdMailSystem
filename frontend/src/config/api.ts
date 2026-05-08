// Central API base URL — reads from Vite env variable in production, falls back to localhost in dev
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
