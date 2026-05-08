// Central API base URL — dynamically checks hostname to avoid Vercel env variable injection issues
export const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://coldmail-backend-bw0h.onrender.com';
