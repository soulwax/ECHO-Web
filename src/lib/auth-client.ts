// File: src/lib/auth-client.ts

/**
 * Client-side authentication utilities
 * For use in React components
 */

// In development, use proxy. In production, use full URL or relative path
const AUTH_API_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_AUTH_API_URL || '/api/auth')
  : '/api/auth';

export async function signIn() {
  window.location.href = `${AUTH_API_URL}/api/auth/signin/discord`;
}

export async function signOut() {
  const response = await fetch(`${AUTH_API_URL}/api/auth/signout`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (response.ok) {
    window.location.href = '/';
  }
}

export async function getSession() {
  try {
    const response = await fetch(`${AUTH_API_URL}/api/auth/session`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}
