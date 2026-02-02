import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch } from './app/hooks'
import { useEffect, useState } from 'react'
import { setUser } from './features/auth/authSlice'
import { supabase } from './lib/supabaseClient'
import toast from 'react-hot-toast'
import Header from './components/Header'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateBlog from './pages/CreateBlog'
import PostDetail from './pages/PostDetail'
import EditBlog from './pages/EditBlog'
import DeactivateAccount from './pages/DeactivateAccount'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

// Main App component
function App() {
  const dispatch = useAppDispatch();
  const [appLoading, setAppLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing SimpleBlog...');

  useEffect(() => {    
    let isInitialized = false; // To track if initial auth state is set
    let subscription: any = null; // To hold the auth state change subscription

    // Setup Supabase auth state change listener
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {       
          
          // Only update state AFTER initial load is complete
          if (isInitialized) {
            dispatch(setUser(session?.user ?? null));
            
            // Handle sign in event
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('User signed in:', session.user.email);
              await checkAndReactivateUser(session.user.id);
            }
            
            // Handle sign out event
            if (event === 'SIGNED_OUT') {
              console.log('User signed out');
            }
          }
        }
      );
      subscription = data?.subscription;
    } catch (error) {
      console.error('Failed to setup auth listener:', error);
    }

    // Initialize auth state on app load
    const initializeAuth = async () => {
      try {
        setLoadingMessage('Checking authentication...');
        console.log('Attempting to restore session from storage...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user) {
          setLoadingMessage('Restoring your session...');
          console.log('Restoring user from session:', session.user.email);
          dispatch(setUser(session.user));
          // Auto-reactivate user content on login
          await checkAndReactivateUser(session.user.id);
        } else {
          console.log('No user session found');
          dispatch(setUser(null));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch(setUser(null));
      } finally {
        isInitialized = true;
        setLoadingMessage('Finalizing setup...');
        setTimeout(() => setAppLoading(false), 300);
      }
    };
    
    initializeAuth();

    // Set theme based on user preference
    const setTheme = () => {
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    setTheme();
    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme);

    return () => {
      console.log('Cleaning up auth listener');
      subscription?.unsubscribe(); // Unsubscribe on unmount
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', setTheme);
    };
  }, [dispatch]);

  // Function to check and reactivate user content
  const checkAndReactivateUser = async (userId: string) => {
    try {
      console.log('🔄 Checking for user content to reactivate for user:', userId);
      
      // Check posts with original_user_id and null user_id
      const { data: postsToReactivate, error: postsCheckError } = await supabase
        .from('posts')
        .select('*')
        .eq('original_user_id', userId)
        .is('user_id', null);

      // Handle errors
      if (postsCheckError) {
        console.error('Error checking posts:', postsCheckError);
        throw postsCheckError;
      }
      
      console.log('Posts with original_user_id:', postsToReactivate);

      // Check comments with original_user_id and null user_id
      const { data: commentsToReactivate, error: commentsCheckError } = await supabase
        .from('comments')
        .select('*')
        .eq('original_user_id', userId)
        .is('user_id', null);

      if (commentsCheckError) {
        console.error('Error checking comments:', commentsCheckError);
        throw commentsCheckError;
      }

      console.log('Comments with original_user_id:', commentsToReactivate);

      const postCount = postsToReactivate?.length || 0; 
      const commentCount = commentsToReactivate?.length || 0;
      
      console.log(`Found ${postCount} posts and ${commentCount} comments to reactivate`);

      if (postCount === 0 && commentCount === 0) {
        console.log('No anonymous content found for this user');
        return;
      }

      // Reactivate posts - restore user_id from original_user_id
      if (postCount > 0) {
        const { error: updatePostsError, data: updatedPosts } = await supabase
          .from('posts')
          .update({ 
            user_id: userId, // Restore user_id
            original_user_id: null  // Clear in same update to be atomic
          })
          .eq('original_user_id', userId)
          .is('user_id', null)
          .select();

        if (updatePostsError) {
          console.error('Posts reactivation error:', updatePostsError);
          throw new Error(`Failed to reactivate posts: ${updatePostsError.message}`);
        }
        
        if (!updatedPosts || updatedPosts.length === 0) {
          console.warn('WARNING: No posts were reactivated!');
        } else {
          console.log(`Reactivated ${updatedPosts.length} posts:`, updatedPosts);
        }
      }

      // Reactivate comments - restore user_id from original_user_id
      if (commentCount > 0) {
        const { error: updateCommentsError, data: updatedComments } = await supabase
          .from('comments')
          .update({ 
            user_id: userId,
            original_user_id: null
          })
          .eq('original_user_id', userId)
          .is('user_id', null)
          .select();

        if (updateCommentsError) {
          console.error('Comments reactivation error:', updateCommentsError);
          throw new Error(`Failed to reactivate comments: ${updateCommentsError.message}`);
        }
        
        if (!updatedComments || updatedComments.length === 0) {
          console.warn('WARNING: No comments were reactivated!');
        } else {
          console.log(`Reactivated ${updatedComments.length} comments:`, updatedComments);
        }
      }

      // Summary log
      const totalReactivated = postCount + commentCount;
      console.log(`Successfully reactivated ${totalReactivated} total items for user ${userId}`);
      
      // Show success toast with counts
      toast.success(
        <div>
          <p className="font-bold">✅ Account Reactivated!</p>
          <p className="text-sm mt-1">Your {postCount > 0 ? `${postCount} post${postCount !== 1 ? 's' : ''}` : ''}{postCount > 0 && commentCount > 0 ? ' and ' : ''}{commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : ''} are now appeared again as your own.</p>
        </div>,
        { duration: 5000 }
      );
    } catch (error) {
      console.error('Reactivation error:', error);
    }
  };

  // Show loading screen while initializing
  if (appLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Animated Logo */}
          <div className="relative mb-8">
            <div className="h-24 w-24 mx-auto rounded-2xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30 shadow-2xl flex items-center justify-center">
              <span className="text-4xl font-bold text-white">B</span>
            </div>
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-400/30 to-pink-400/30 animate-pulse"></div>
          </div>

          {/* Loading Text */}
          <h1 className="text-3xl font-bold text-white mb-2">SimpleBlog</h1>
          <p className="text-white/80 mb-8">Your personal writing space</p>

          {/* Loading Animation */}
          <div className="space-y-4">
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-white/40 to-white/20 animate-[shimmer_2s_infinite]"></div>
            </div>
            <p className="text-white/70 text-sm animate-pulse">{loadingMessage}</p>
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-2 mt-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-white/40 animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main app render with routing
  return (
    <HashRouter>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <main className="flex-1 w-full">
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
            <Route
              path="/deactivate-account"
              element={
                <ProtectedRoute>
                  <DeactivateAccount />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  SimpleBlog
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400 space-x-6">
                <a href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Terms
                </a>
                <a href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Privacy
                </a>
                <a href="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  About
                </a>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-500">
                © {new Date().getFullYear()} SimpleBlog. Share your story with the world.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </HashRouter>
  )
}

export default App

