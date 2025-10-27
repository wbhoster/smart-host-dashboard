// API Configuration
export const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // In production, API is proxied through .htaccess
  : 'http://localhost:3001/api';  // In development, direct connection to backend
