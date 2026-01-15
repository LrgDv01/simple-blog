import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { useEffect } from 'react'
import { setUser } from './features/auth/authSlice'
import { supabase } from './lib/supabaseClient'

import Header from './components/Header'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateBlog from './pages/CreateBlog'
import PostDetail from './pages/PostDetail'
import EditBlog from './pages/EditBlog'
import ProtectedRoute from './components/ProtectedRoute'

import './App.css'

function App() {
  const dispatch = useAppDispatch() // Dispatch function from Redux
  const { user } = useAppSelector((state) => state.auth) 

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch(setUser(session?.user ?? null))
    })

    // Listen for changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch(setUser(session?.user ?? null))
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [dispatch])

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Render the application with routing
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-500 w-full flex flex-col items-center dark">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-400 dark">
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <CreateBlog />
                </ProtectedRoute>
              }
            />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route
              path="/edit/:id"
              element={
                <ProtectedRoute>
                  <EditBlog />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App