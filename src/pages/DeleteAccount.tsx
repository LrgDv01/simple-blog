import { useAppSelector, useAppDispatch } from '../app/hooks'
import { signOut } from '../features/auth/authSlice'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useState } from 'react'

function DeleteAccount() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (confirmEmail !== user?.email) {
      toast.error('Email does not match')
      return
    }

    setLoading(true)
    try {
      await dispatch(signOut()).unwrap()
      toast.success('Account deleted! Your posts/comments are now anonymous.')
      navigate('/login')
    } catch (err) {
      toast.error('Deletion failed')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    navigate('/dashboard')
    return null
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-red-600 dark:text-red-400">Delete Your Account</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          This action is permanent. You will be signed out immediately.
          <br /><br />
          <strong>Your posts and comments will remain public but become anonymous</strong> (no one can edit them).
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type your email to confirm: <span className="font-bold">{user.email}</span>
            </label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="mt-2 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmEmail !== user.email}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccount