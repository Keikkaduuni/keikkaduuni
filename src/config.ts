// Dynamic backend URL configuration
// When accessed from mobile/other devices, use the computer's IP address
// When accessed locally, use localhost

const getBackendUrl = (): string => {
  // Get the current hostname (will be localhost when accessed locally, IP when accessed from mobile)
  const hostname = window.location.hostname;
  const port = '5001';
  
  // If we're on localhost, use localhost for backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}`;
  }
  
  // Otherwise, use the same hostname as the frontend (mobile access)
  return `http://${hostname}:${port}`;
};

// Use Vite environment variable if set, otherwise fallback to dynamic detection
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || getBackendUrl();

// For debugging
console.log('🔧 Backend URL configured as:', BACKEND_URL);
console.log('🔧 Current hostname:', window.location.hostname);
console.log('🔧 Current origin:', window.location.origin);
console.log('🔧 Current href:', window.location.href);
console.log('🔧 User agent:', navigator.userAgent);

// For development, you can also manually set the IP if needed
// export const BACKEND_URL = 'http://172.20.10.2:5001'; // Replace with your computer's IP 