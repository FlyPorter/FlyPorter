// API Base URL - defaults to localhost for development
// Set VITE_API_URL environment variable for production (e.g., https://api.yourdomain.com/api)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Google Auth URL - for OAuth redirects
// Set VITE_GOOGLE_AUTH_URL environment variable for production
// If not set, constructs from API_BASE_URL
const defaultApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const GOOGLE_AUTH_URL = import.meta.env.VITE_GOOGLE_AUTH_URL || `${defaultApiUrl}/auth/google`;

// Auth URL - general auth endpoint
// Set VITE_AUTH_URL environment variable for production
// If not set, constructs from API_BASE_URL
export const AUTH_URL = import.meta.env.VITE_AUTH_URL || `${defaultApiUrl}/auth`;