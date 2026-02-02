import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import blogReducer from '../features/blog/blogSlice'

// Configure the Redux store with auth and blog slices
export const store = configureStore({
  reducer: {
    auth: authReducer,
    blogs: blogReducer,
  },
})

// Define RootState and AppDispatch types for TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch