import axios from 'axios';

// Determine API base URL based on environment 
const getApiBaseUrl = () => {
  // Explicit override via env (e.g. Render/Railway backend URL)
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`;
  }

  const hostname = window.location.hostname;

  // Development / local network: use explicit port 5000
  const isLocal = (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname)
  );
  if (isLocal) {
    return `http://${hostname}:5000/api`;
  }

  // Production: backend expected at same origin under /api
  return '/api';
};

// Create axios instance with base configuration
const apiBaseUrl = getApiBaseUrl();
console.log('🌐 API Base URL:', apiBaseUrl);
console.log('🌐 Current hostname:', window.location.hostname);

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Request interceptor - cookies are sent automatically with withCredentials: true
api.interceptors.request.use(
  (config) => {
    // No need to add Authorization header - cookies are sent automatically
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - cookie will be cleared by server
      localStorage.removeItem('userData');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Return a more user-friendly error message
    const errorMessage = error.response?.data?.error || 'Network error. Please try again.';
    return Promise.reject(new Error(errorMessage));
  }
);

// Auth API functions
export const authAPI = {
  // Login user
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    // JWT is now stored in HTTP-only cookie automatically
    if (response.data.user) {
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Register user
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  // Verify token
  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    // Cookie will be cleared by server
    localStorage.removeItem('userData');
    return response.data;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    await authAPI.verifyToken();
    return true;
  } catch {
    return false;
  }
};

// Helper function to get current user data
export const getCurrentUser = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};

export default api;