import axios from 'axios';

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== 'undefined') {
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalHost) {
      return 'http://localhost:5000/api';
    }
  }

  return 'https://stationary-sigma.vercel.app/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nexcart_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Global error handling & message sanitization
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nexcart_token');
      delete api.defaults.headers.common['Authorization'];
    }

    // Format clean user-facing error message
    let userMsg = "We're having trouble processing your request. Please try again in a moment.";

    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        userMsg = "This request is taking longer than expected. Please try again.";
      } else {
        userMsg = "Unable to connect to the server. Please check your internet connection and try again.";
      }
    } else if (error.response.status >= 500) {
      userMsg = "Something went wrong on our end. Please try again in a moment.";
    } else if (error.response.data?.message) {
      const msg = String(error.response.data.message);
      // Suppress raw DB / stack errors
      if (
        !msg.includes('SELECT') &&
        !msg.includes('INSERT') &&
        !msg.includes('UPDATE') &&
        !msg.includes('DELETE') &&
        !msg.includes('postgres') &&
        !msg.includes('Error:') &&
        !msg.includes('at ')
      ) {
        userMsg = msg;
      }
    }

    if (error.response?.data) {
      error.response.data.message = userMsg;
    }
    error.userFriendlyMessage = userMsg;

    return Promise.reject(error);
  }
);

export default api;
