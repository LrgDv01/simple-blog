import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/simple-blog/',
  plugins: [react()], // Include the Tailwind CSS plugin
})
