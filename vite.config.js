// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/mini-web-app/', // 👈 match exactly what your repo is named
  plugins: [react()],
})
