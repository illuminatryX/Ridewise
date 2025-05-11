// This file creates a basic proxy for API calls to avoid CORS issues

/**
 * Creates a proxy URL that can be used to avoid CORS issues when calling external APIs
 * This is useful for development only - in production, you should configure your backend properly
 * 
 * @param originalUrl The original API URL to call
 * @returns A proxied URL that should work without CORS issues
 */
export const createProxyUrl = (originalUrl: string): string => {
  // CORS proxy options:
  // 1. Use a public CORS proxy service
  return `https://cors-anywhere.herokuapp.com/${originalUrl}`;
  
  // Alternative proxies if the above doesn't work:
  // return `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`;
  // return `https://api.allorigins.win/get?url=${encodeURIComponent(originalUrl)}`;
};
