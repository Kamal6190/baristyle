/**
 * Central API configuration
 * Uses NEXT_PUBLIC_API_URL env variable in production,
 * falls back to localhost for local development.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
