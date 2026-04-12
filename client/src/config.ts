// API Configuration
const env = import.meta.env as any
export const API_URL = env.VITE_API_URL || 'https://mindo.tail5298e0.ts.net:5000'

// Custom fetch wrapper that adds ngrok bypass header
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

// Helper function to create headers with ngrok bypass
export const createHeaders = (additionalHeaders: HeadersInit = {}) => {
  return {
    'ngrok-skip-browser-warning': 'true',
    ...additionalHeaders
  }
}
