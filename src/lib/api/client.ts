const DEFAULT_BACKEND_URL = 'http://localhost:8000';

// Runtime config - can be loaded from config.json after deployment
let runtimeConfig: { backendUrl?: string } | null = null;
let configLoadPromise: Promise<void> | null = null;

async function loadRuntimeConfig(): Promise<void> {
  if (configLoadPromise) return configLoadPromise;
  
  configLoadPromise = (async () => {
    try {
      const response = await fetch('/config.json', {
        // Add cache busting to ensure we get fresh config
        cache: 'no-cache',
        // Add timeout to avoid hanging
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        runtimeConfig = await response.json();
        console.log('Loaded runtime config:', runtimeConfig);
      } else {
        // 404 or other error - config file doesn't exist, use defaults
        console.log('config.json not found (404), using fallback logic');
      }
    } catch (error: any) {
      // Config file doesn't exist, network error, or timeout - use defaults
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        console.log('config.json load timeout, using fallback logic');
      } else {
        console.log('config.json not available, using fallback logic:', error.message);
      }
    }
  })();
  
  return configLoadPromise;
}

// Smart backend URL detection:
// 1. Use VITE_BACKEND_URL if set (build-time env var) - highest priority
// 2. Use runtime config.json if available
// 3. In production (not localhost), try to use same origin (relative URLs)
// 4. Fall back to localhost for development
async function getBackendUrl(): Promise<string> {
  // Load runtime config if not already loaded
  await loadRuntimeConfig();
  
  // Priority 1: Build-time env var (highest priority)
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  // Priority 2: Runtime config.json
  if (runtimeConfig?.backendUrl) {
    return runtimeConfig.backendUrl;
  }
  
  // Priority 3: If we're in production (not localhost), use relative URLs
  // This assumes backend is on the same domain or proxied
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '';
    
    if (!isLocalhost) {
      // Production: use same origin (relative URL)
      // Backend should be at /api/* or same domain
      return '';
    }
  }
  
  // Priority 4: Development fallback
  return DEFAULT_BACKEND_URL;
}

// Initialize API_BASE_URL - will be set after config loads
let API_BASE_URL = DEFAULT_BACKEND_URL;

// Load config and update API_BASE_URL
getBackendUrl().then(url => {
  API_BASE_URL = url;
  console.log('API_BASE_URL set to:', API_BASE_URL || '(relative)');
});

// Export a function that ensures config is loaded
export async function ensureConfigLoaded(): Promise<string> {
  const url = await getBackendUrl();
  API_BASE_URL = url;
  return url;
}

// Export current API_BASE_URL (may be default until config loads)
export { API_BASE_URL };

export async function apiFetch<T>(path: string, init: RequestInit, timeout = 60000): Promise<T> {
  // Ensure config is loaded before making requests
  const baseUrl = await ensureConfigLoaded();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${baseUrl}${path}`, {
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
      const displayUrl = baseUrl || '(same origin)';
      throw new Error(`Network error: Unable to connect to backend. Please check if the backend is running at ${displayUrl}. If using config.json, ensure it contains the correct backendUrl.`);
    }
    throw error;
  }
}

