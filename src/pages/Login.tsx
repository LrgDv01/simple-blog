import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { signIn } from '../features/auth/authSlice'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

// Define the validation schema using Zod
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema> // Infer the form data type from the schema

// Login component
function Login() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, loading, error } = useAppSelector((state) => state.auth)

  // Initialize the form with react-hook-form and Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      setError('root', { message: '' })
      await dispatch(signIn(data)).unwrap()
    } catch (err: any) {
      setError('root', { 
        message: err.message || 'Login failed. Please check your credentials.' 
      })
    }
  }

  // Redirect on successful login
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])


  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Sign in</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              {...register('password')}
              type="password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting || loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Deactivated your account?  
          <span className="ms-2 font-medium text-indigo-600 dark:text-indigo-400">
            Just log in to reactivate!
          </span>
          <br />
          Your content remains anonymous until you reactivate your account.
        </p>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login