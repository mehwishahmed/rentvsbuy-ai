import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      "*.up.railway.app",
      "rvb-calc-ai-production-a1cd.up.railway.app",
      "rentvsbuy.ai",
      "www.rentvsbuy.ai"
    ]
  }
})
