import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import type { ReactNode } from 'react'   // ← standard import

// Define the props for ProtectedRoute
interface ProtectedRouteProps {
  children: ReactNode
}

// ProtectedRoute component to guard routes
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useAppSelector((state) => state.auth.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace /> // Redirect to login if not authenticated
  }

  return <>{children}</> // Render children if authenticated
}

export default ProtectedRoute