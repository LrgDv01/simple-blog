import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Add Tailwind CSS Vite plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], // Include the Tailwind CSS plugin
})
