import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { supabase } from '../../lib/supabaseClient'

// User interface definition
export interface User {
  id: string
  email?: string
}

// Define the return type for thunks
interface AuthResponse {
  user: User | null
  session: any | null
}

//  Auth state interface definition
interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

// Initial state definition
const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
}


// Sign up thunk
export const signUp = createAsyncThunk(
  'auth/signUp',
  // Payload contains email and password
  async ({ email, password }: { email: string; password: string }): Promise<AuthResponse> => {
    console.log('=== SIGNUP THUNK ===');
    
    // Call Supabase signUp method with email redirect option
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`, // Redirect after email confirmation
      }
    });
        
    if (error) {
      console.error('SignUp error:', error);
      throw error;
    }
    
    // Return both user and session
    return { 
      user: data.user ?? null, 
      session: data.session ?? null 
    };
  }
);

// Sign in thunk
export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }: { email: string; password: string }): Promise<AuthResponse> => {
    console.log('=== SIGNIN THUNK ===');
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });  // Call Supabase signIn method
        
    if (error) {
      console.error('SignIn error:', error);
      throw error;
    }
    
    // Return both user and session
    return { 
      user: data.user ?? null, 
      session: data.session ?? null 
    };
  }
);

// Sign out thunk
export const signOut = createAsyncThunk('auth/signOut', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('SignOut error:', error);
    throw error;
  }
});

// Auth slice definition
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle signUp lifecycle
      .addCase(signUp.pending, (state) => { 
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        // Set user from payload
        state.user = action.payload.user ?? null;
        state.loading = false;
        state.error = null;
        
        // Log based on session presence
        if (action.payload.session) {
          console.log('Registration successful with auto-login');
        } else {
          console.log('Registration succeeded but no session - check email confirmation');
        }
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Signup failed';
        console.error('SignUp rejected:', action.error);
      })
      .addCase(signIn.pending, (state) => { 
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload.user ?? null;
        state.loading = false;
        console.log('Login successful');
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Login failed';
        console.error('SignIn rejected:', action.error);
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        console.log('Logout successful');
      })
      .addCase(signOut.rejected, (state, action) => {
        state.error = action.error.message ?? 'Logout failed';
        console.error('SignOut rejected:', action.error);
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;


