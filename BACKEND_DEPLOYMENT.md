# 🚀 Backend Deployment Quick Guide

Your backend **MUST** be deployed separately from the frontend. The frontend is just static files, but the backend is a Python application that needs to run on a server.

## ⚡ Quickest Option: Railway (5 minutes)

1. **Go to [railway.app](https://railway.app)** and sign up (free tier available)

2. **Create New Project** → "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your repository
   - **Important:** Set **Root Directory** to `backend/`

3. **Add Environment Variables:**
   - Click on your service → Variables tab
   - Add:
     ```
     OPENAI_API_KEY=sk-your-actual-openai-key-here
     CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
     ```
   - Replace `yourdomain.com` with your actual frontend domain

4. **Set Start Command:**
   - Go to Settings → Deploy
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

5. **Get Your Backend URL:**
   - Railway will give you a URL like: `https://your-app.railway.app`
   - Test it: Visit `https://your-app.railway.app/health`
   - Should return: `{"status":"ok"}`

6. **Update Frontend config.json:**
   - On your server, edit `config.json`
   - Set:
     ```json
     {
       "backendUrl": "https://your-app.railway.app"
     }
     ```

## 🔍 Verify It's Working

1. **Test backend health:**
   ```bash
   curl https://your-app.railway.app/health
   ```
   Should return: `{"status":"ok"}`

2. **Check browser console:**
   - Open your frontend site
   - Press F12 → Console tab
   - Look for: `API_BASE_URL set to: https://your-app.railway.app`
   - If you see errors, check CORS settings

## 🐛 Troubleshooting

### "Network error: Unable to connect to backend"
- **Check:** Is your backend URL correct in `config.json`?
- **Check:** Is the backend service running? Visit the `/health` endpoint
- **Check:** Browser console for CORS errors

### "CORS policy" errors
- **Fix:** Update `CORS_ORIGINS` in Railway to include your frontend domain
- Example: `CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com`

### AI not working / Same response for all messages
- **Check:** Is `OPENAI_API_KEY` set correctly in Railway?
- **Check:** Backend logs in Railway dashboard for errors
- **Check:** OpenAI API key is valid and has credits

### Backend returns 404
- **Check:** Root directory is set to `backend/` in Railway
- **Check:** The start command is correct

## 📝 Alternative: Render.com

1. Go to [render.com](https://render.com) and sign up
2. **New** → "Web Service" → Connect GitHub repo
3. **Settings:**
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables:**
   - `OPENAI_API_KEY` = your OpenAI key
   - `CORS_ORIGINS` = your frontend domain
5. Get the URL and update `config.json`

## 🐳 Alternative: Docker (Any Platform)

If you have a Dockerfile (I've created one for you), you can deploy to:
- Railway (supports Docker)
- Fly.io
- AWS ECS
- Google Cloud Run
- Any Docker host

The Dockerfile is in `backend/Dockerfile`.

