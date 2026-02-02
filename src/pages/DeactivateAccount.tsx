import { useAppSelector, useAppDispatch } from '../app/hooks'
import { signOut } from '../features/auth/authSlice'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// DeactivateAccount component for handling account deactivation
function DeactivateAccount() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // Function to log deactivation action
  const logDeactivation = async (userId: string, postCount: number | null, commentCount: number | null) => {
    try {
      const { data, error: logError } = await supabase
        .from('account_status_logs')
        .insert({
          user_id: userId,
          action: 'deactivated',
          post_count: postCount || 0,
          comment_count: commentCount || 0,
          created_at: new Date().toISOString()
        })
        .select();

      if (logError) {
        console.warn('Failed to log deactivation:', logError);
      } else {
        console.log('Deactivation logged successfully:', data);
      }
    } catch (err) {
      console.warn('Error logging deactivation:', err);
    }
  };

  // Deactivation handler
  const handleDeactivate = async () => {
    if (confirmEmail !== user?.email) {
      toast.error('Email does not match');
      return;
    }

    setLoading(true);

    try {
      // Count user's posts and comments before anonymization
      const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Anonymize posts - save original_user_id and set user_id to null
      const { data: updatedPosts, error: postsError } = await supabase
        .from('posts')
        .update({ 
          original_user_id: user.id, // Save original user ID
          user_id: null // This makes content anonymous
        })
        .eq('user_id', user.id)
        .select();

      console.log('Posts update result:', { error: postsError, data: updatedPosts }); // Debugging log
      // handle posts error
      // if (postsError) {
      //   console.error('Posts error details:', postsError);
      //   console.error('Error message:', postsError.message);
      //   console.error('Error hint:', postsError.hint);
      //   console.error('Error details:', postsError.details);
      //   throw new Error(`Failed to anonymize posts: ${postsError.message}`);
      // }
      
      //  Debugging if no posts updated
      // if (!updatedPosts || updatedPosts.length === 0) {
      //   console.warn('WARNING: No posts were updated! Check if:');
      //   console.warn('1. User has posts with user_id =', user.id);
      //   console.warn('2. RLS policy allows user to update their own posts');
      //   console.warn('3. Query filters are correct');
      // }

      // Anonymize comments - save original_user_id and set user_id to null
      console.log('Attempting to update comments with user_id:', user.id); // Debugging log
      const { data: updatedComments, error: commentsError } = await supabase
        .from('comments')
        .update({ 
          original_user_id: user.id,
          user_id: null  //  This makes content anonymous
        })
        .eq('user_id', user.id)
        .select();
      
      console.log('Comments update result:', { error: commentsError, data: updatedComments }); // Debugging log

      console.log('Content anonymized successfully:', {
        posts_anonymized: updatedPosts?.length || 0,
        comments_anonymized: updatedComments?.length || 0
      });

      // Log the deactivation action
      await logDeactivation(user.id, postCount, commentCount);

      // Final log
      console.log('Account deactivation complete:', {
        user_id: user.id,
        posts_anonymized: postCount || 0,
        comments_anonymized: commentCount || 0,
        created_at: new Date().toISOString()
      });

      // Sign out the user
      await dispatch(signOut()).unwrap();
      
      // Show success toast
      toast.success(
        <div>
          <p className="font-bold">✅ Account Deactivated</p>
          <p className="text-sm mt-1">Your posts/comments are now anonymous.</p>
          <p className="text-sm mt-1">Log in again to reactivate.</p>
        </div>,
        { duration: 7000 }
      );
      
      navigate('/'); // Redirect to home after deactivation
    } catch (err: any) {
      console.error('Deactivation error:', err);
      toast.error('Deactivation failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect if no user
  if (!user) {
    navigate('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          
          {/* Warning Section */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                  Account Deactivation
                </h3>
                <p className="mt-2 text-orange-700 dark:text-orange-400">
                  This will sign you out and anonymize your content.
                  <br />
                  <strong>You can log in again anytime to reactivate!</strong>
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Deactivate Your Account
          </h2>

          {/* User Info */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Account to be deactivated:</p>
                <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To confirm, type your email:
                <span className="ml-2 font-bold text-gray-900 dark:text-white">
                  {user.email}
                </span>
              </label>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Type your email to confirm"
                className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition duration-200"
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              
              <button
                onClick={handleDeactivate}
                disabled={loading || confirmEmail !== user.email}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deactivating...
                  </span>
                ) : (
                  'Deactivate Account'
                )}
              </button>
            </div>

            {/* Reactivation Message */}
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-center text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold">Changed your mind?</span>
                <br />
                <span className="mt-1 inline-block">
                  Simply log in again to reactivate your account!
                </span>
                <br />
                <span className="text-xs mt-2 block">
                  Your content remains anonymous until you reactivate.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeactivateAccount