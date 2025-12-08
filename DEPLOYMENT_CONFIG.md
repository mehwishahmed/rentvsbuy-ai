# 🔧 Runtime Configuration Guide

## Problem
After deploying your app, the frontend may try to connect to `http://localhost:8000` which doesn't exist in production. This causes API calls to fail.

## Solution
The app now supports runtime configuration via `config.json`. This file can be edited after building and uploading your app.

## Setup Steps

### 1. Build your app
```bash
npm run build
```

### 2. Upload files
Upload the contents of the `dist` folder to your hosting:
- `index.html`
- `assets/` directory
- **`config.json`** (from `public/config.json`)

### 3. Edit config.json
After uploading, edit `config.json` in your hosting to point to your backend URL:

```json
{
  "backendUrl": "https://your-backend-url.railway.app"
}
```

Or if your backend is on the same domain:
```json
{
  "backendUrl": ""
}
```
(Empty string means use relative URLs - same domain)

### 4. Verify
- Open your browser's developer console (F12)
- You should see: `Loaded runtime config: {backendUrl: "..."}`
- You should see: `API_BASE_URL set to: ...`

## Configuration Priority

The app uses this priority order for the backend URL:

1. **`VITE_BACKEND_URL`** (build-time environment variable) - Highest priority
2. **`config.json`** (runtime configuration file)
3. **Same origin** (if not localhost) - Uses relative URLs
4. **`http://localhost:8000`** (development fallback)

## Troubleshooting

### AI not working / Same response for all messages

1. **Check browser console** for errors:
   - Open DevTools (F12) → Console tab
   - Look for errors like "Failed to fetch" or "Network error"

2. **Verify config.json exists and is accessible:**
   - Visit `https://yourdomain.com/config.json` in your browser
   - Should show: `{"backendUrl":"..."}`

3. **Check backend is running:**
   - Visit your backend URL directly (e.g., `https://your-backend.railway.app/health`)
   - Should return: `{"status":"ok"}`

4. **Verify CORS settings:**
   - Your backend must allow requests from your frontend domain
   - Check `backend/app/config.py` or environment variable `CORS_ORIGINS`

5. **Check OpenAI API key:**
   - Ensure `OPENAI_API_KEY` is set in your backend environment
   - Without it, the backend will use mock responses

### Still not working?

1. Check the browser console for the actual error message
2. Verify `config.json` has the correct backend URL
3. Test the backend URL directly in your browser
4. Ensure your backend CORS settings allow your frontend domain

