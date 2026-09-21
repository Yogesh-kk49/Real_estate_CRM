import axios, { AxiosError } from 'axios';

let rawBaseUrl: string = (import.meta as any).env?.VITE_API_URL || '/api';
if (rawBaseUrl.startsWith('http')) {
  rawBaseUrl = rawBaseUrl.replace(/\/$/, '');
  if (!rawBaseUrl.endsWith('/api')) {
    rawBaseUrl = `${rawBaseUrl}/api`;
  }
}

const baseURL = rawBaseUrl;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('estatepulse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Extract contextual error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; message?: string }>) => {
    if (error.response?.status === 401) {
      // Clear token on 401 if not already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('estatepulse_token');
        localStorage.removeItem('estatepulse_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    // Extract user-friendly error message
    let errorMessage = 'An unexpected error occurred. Please try again.';
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message === 'Network Error') {
      errorMessage = "We couldn't connect to the server. Check your connection and try again.";
    }

    return Promise.reject(new Error(errorMessage));
  }
);
