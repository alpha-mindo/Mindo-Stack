// API Configuration
const env = import.meta.env as any
export const API_URL = env.VITE_API_URL || 'https://becky-unabatable-strainingly.ngrok-free.dev'

// Helper function to create headers with ngrok bypass
export const createHeaders = (additionalHeaders: HeadersInit = {}) => {
  return {
    'ngrok-skip-browser-warning': 'true',
    ...additionalHeaders
  }
}
