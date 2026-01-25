import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(), // React support
    visualizer({ // Bundle analysis tool plugin
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ], 

  // Add build optimization
  build: {
    rollupOptions: { // Rollup configuration
      output: {
        manualChunks: { // Code splitting
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        }
      }
    }
  }
})
