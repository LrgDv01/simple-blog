import { Link, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { signOut } from '../features/auth/authSlice'
// import { useTheme } from '../context/ThemeContext'

// Header component
function Header() {
  const user = useAppSelector((state) => state.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await dispatch(signOut())
    navigate('/login')
  }
  // const { isDark, toggleTheme } = useTheme()

  return (
    <header className="bg-white shadow-sm border-b w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-3xl font-bold text-indigo-600">
          Simple Blog - Welcome {user?.email ? (() => {
            const emailName = user.email.split('@')[0];
            return emailName.replace(/[._-]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          })() : 'Guest'}
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
              <Link to="/deactivate-account" className="text-orange-600 hover:text-orange-700 font-medium">
                Deactivate Account
              </Link>
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
          {/* <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button> */}
        </nav>
      </div>
    </header>
  )
}

export default Header