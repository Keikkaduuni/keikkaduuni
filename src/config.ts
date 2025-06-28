// Dynamic backend URL configuration
// Handles development (with Vite proxy) and production/mobile environments

const getBackendConfig = () => {
  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
  
  if (isDevelopment) {
    // In development, use Vite's proxy for API calls and localhost for direct connections
    return {
      API_BASE_PATH: '', // Empty string allows Vite proxy to handle /api/* requests
      BACKEND_FULL_URL: 'http://localhost:5001' // For Socket.IO and direct asset access
    };
  } else {
    // In production/mobile, use the full URL for everything
    const backendUrl = `http://${hostname}:5001`;
    return {
      API_BASE_PATH: backendUrl,
      BACKEND_FULL_URL: backendUrl
    };
  }
};

const config = getBackendConfig();

// Use Vite environment variables if set, otherwise use dynamic detection
export const API_BASE_PATH = import.meta.env.VITE_API_BASE_PATH || config.API_BASE_PATH;
export const BACKEND_FULL_URL = import.meta.env.VITE_BACKEND_URL || config.BACKEND_FULL_URL;

// Legacy export for backward compatibility (points to full URL for assets)
export const BACKEND_URL = BACKEND_FULL_URL;

// For debugging
console.log('🔧 API Base Path configured as:', API_BASE_PATH);
console.log('🔧 Backend Full URL configured as:', BACKEND_FULL_URL);
console.log('🔧 Current hostname:', window.location.hostname);
console.log('🔧 Current origin:', window.location.origin);