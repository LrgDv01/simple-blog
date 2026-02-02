import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing Supabase environment variables!')
  console.error('1. Create a .env file in the project root')
  throw new Error(
    'Missing Supabase credentials. Check console for setup instructions.'
  )
}

// Create Supabase client with custom auth storage handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Enable auto token refresh
    persistSession: true, // Persist sessions in storage
    detectSessionInUrl: false, // Disable URL session detection for SPA
    // Custom storage handlers with error handling
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key) // Retrieve item from localStorage
        } catch (error) {
          console.error('Error getting item from storage:', error)
          return null
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value) // Store item in localStorage
        } catch (error) {
          console.error('Error setting item in storage:', error)
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key) // Remove item from localStorage
        } catch (error) {
          console.error('Error removing item from storage:', error)
        }
      },
    },
  },
})

console.log('Supabase client created - attempting connection...')
