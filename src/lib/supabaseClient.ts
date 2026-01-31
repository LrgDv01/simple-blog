import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Supabase Configuration Check:');
console.log('URL length:', supabaseUrl?.length || 0, 'chars');
console.log('Key length:', supabaseAnonKey?.length || 0, 'chars');
console.log('URL valid format:', supabaseUrl?.startsWith('https://') ? '✓' : '❌');
console.log('Key valid format:', supabaseAnonKey?.startsWith('eyJ') ? '✓' : '❌');

// Validate that they exist
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase environment variables!')
  console.error('❌ VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ MISSING')
  console.error('❌ VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '❌ MISSING')
  console.error('')
  console.error('📝 To fix:')
  console.error('1. Create a .env file in the project root')
  console.error('2. Add these lines:')
  console.error('   VITE_SUPABASE_URL=https://xxxx.supabase.co')
  console.error('   VITE_SUPABASE_ANON_KEY=eyJxxx...')
  console.error('3. Get values from Supabase: Settings → API')
  console.error('4. Restart the dev server: npm run dev')
  throw new Error(
    'Missing Supabase credentials. Check console for setup instructions.'
  )
}

// Create Supabase client with custom storage handlers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key)
        } catch (error) {
          console.error('Error getting item from storage:', error)
          return null
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value)
        } catch (error) {
          console.error('Error setting item in storage:', error)
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.error('Error removing item from storage:', error)
        }
      },
    },
  },
})

console.log('✅ Supabase client created - attempting connection...')
