const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? DEFAULT_BACKEND_URL;

export async function apiFetch<T>(path: string, init: RequestInit, timeout = 60000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request to ${path} failed: ${response.status} ${errorText}`);
    }

    return response.json() as Promise<T>;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request to ${path} timed out after ${timeout / 1000} seconds. The backend may be processing heavy calculations.`);
    }
    // Handle network errors (Load failed, Failed to fetch, etc.)
    if (error.message?.includes('Load failed') || error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error(`Network error: Unable to connect to backend. Please check if the backend is running at ${API_BASE_URL}.`);
    }
    throw error;
  }
}

