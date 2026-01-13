import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { signOut } from '../features/auth/authSlice'

function Header() {
  const user = useAppSelector((state) => state.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await dispatch(signOut())
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-3xl font-bold text-indigo-600">
          Simple Blog
        </Link>
        <nav className="flex items-center space-x-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 font-medium">
                Dashboard
              </Link>
              <Link to="/create" className="text-gray-700 hover:text-indigo-600 font-medium">
                New Post
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-indigo-600 font-medium">
                Login
              </Link>
              <Link to="/register" className="text-gray-700 hover:text-indigo-600 font-medium">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header