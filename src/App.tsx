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

  useEffect(() => {
    console.log('=== APP INITIALIZATION ===');
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '❌ MISSING');
    console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '❌ MISSING');
    
    let isInitialized = false;
    let subscription: any = null;

    // Set up the auth state change listener BEFORE checking initial session
    // Ensures to catch any changes during the session recovery process
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('=== AUTH STATE CHANGE ===');
          console.log('Event:', event);
          console.log('Session user:', session?.user?.email);
          
          // Only update state AFTER initial load is complete
          if (isInitialized) {
            dispatch(setUser(session?.user ?? null));
            
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('✅ User signed in:', session.user.email);
              await checkAndReactivateUser(session.user.id);
            }
            
            if (event === 'SIGNED_OUT') {
              console.log('User signed out');
            }
          }
        }
      );
      subscription = data?.subscription;
    } catch (error) {
      console.error('❌ Failed to setup auth listener:', error);
    }

    // Initial auth state check
    const initializeAuth = async () => {
      try {
        console.log('Attempting to restore session from storage...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
        } else if (session?.user) {
          console.log('✅ Restoring user from session:', session.user.email);
          dispatch(setUser(session.user));
          // Auto-reactivate user content on login
          await checkAndReactivateUser(session.user.id);
        } else {
          console.log('ℹ️ No user session found');
          dispatch(setUser(null));
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        dispatch(setUser(null));
      } finally {
        isInitialized = true;
        setAppLoading(false);
      }
    };
    
    initializeAuth();

    // Theme effect
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => {
      console.log('Cleaning up auth listener');
      subscription?.unsubscribe();
    };
  }, [dispatch]);

  // Helper to check and reactivate user content
  const checkAndReactivateUser = async (userId: string) => {
    try {
      console.log('🔄 Checking for user content to reactivate for user:', userId);
      
      // Check for posts and comments with original_user_id = userId and user_id IS NULL
      const { data: postsToReactivate, error: postsCheckError } = await supabase
        .from('posts')
        .select('*')  // Select all to see full data
        .eq('original_user_id', userId)
        .is('user_id', null);

      // Handle errors
      if (postsCheckError) {
        console.error('❌ Error checking posts:', postsCheckError);
        throw postsCheckError;
      }
      
      console.log('📋 Posts with original_user_id:', postsToReactivate);

      // Check comments similarly
      const { data: commentsToReactivate, error: commentsCheckError } = await supabase
        .from('comments')
        .select('*')  // Select all to see full data
        .eq('original_user_id', userId)
        .is('user_id', null);

      if (commentsCheckError) {
        console.error('❌ Error checking comments:', commentsCheckError);
        throw commentsCheckError;
      }

      console.log('📋 Comments with original_user_id:', commentsToReactivate);

      const postCount = postsToReactivate?.length || 0;
      const commentCount = commentsToReactivate?.length || 0;
      
      console.log(`📊 Found ${postCount} posts and ${commentCount} comments to reactivate`);

      if (postCount === 0 && commentCount === 0) {
        console.log('ℹ️ No anonymous content found for this user');
        return;
      }

      // Reactivate posts - restore user_id from original_user_id
      if (postCount > 0) {
        console.log('🔄 Attempting to reactivate posts:');
        console.log('   Setting user_id =', userId);
        console.log('   Where original_user_id =', userId);
        console.log('   And user_id is null');
        
        const { error: updatePostsError, data: updatedPosts } = await supabase
          .from('posts')
          .update({ 
            user_id: userId,
            original_user_id: null  // Clear in same update to be atomic
          })
          .eq('original_user_id', userId)
          .is('user_id', null)
          .select();

        if (updatePostsError) {
          console.error('❌ Posts reactivation error:', updatePostsError);
          console.error('   Error message:', updatePostsError.message);
          console.error('   Error hint:', updatePostsError.hint);
          console.error('   Error details:', updatePostsError.details);
          throw new Error(`Failed to reactivate posts: ${updatePostsError.message}`);
        }
        
        if (!updatedPosts || updatedPosts.length === 0) {
          console.warn('⚠️ WARNING: No posts were reactivated!');
          console.warn('   Posts returned:', updatedPosts?.length || 0);
          console.warn('   Check if RLS policy allows update');
        } else {
          console.log(`✅ Reactivated ${updatedPosts.length} posts:`, updatedPosts);
        }
      }

      // Reactivate comments - restore user_id from original_user_id
      if (commentCount > 0) {
        console.log('🔄 Attempting to reactivate comments:');
        console.log('   Setting user_id =', userId);
        console.log('   Where original_user_id =', userId);
        console.log('   And user_id is null');
        
        const { error: updateCommentsError, data: updatedComments } = await supabase
          .from('comments')
          .update({ 
            user_id: userId,
            original_user_id: null  // Clear in same update to be atomic
          })
          .eq('original_user_id', userId)
          .is('user_id', null)
          .select();

        if (updateCommentsError) {
          console.error('❌ Comments reactivation error:', updateCommentsError);
          console.error('   Error message:', updateCommentsError.message);
          console.error('   Error hint:', updateCommentsError.hint);
          console.error('   Error details:', updateCommentsError.details);
          throw new Error(`Failed to reactivate comments: ${updateCommentsError.message}`);
        }
        
        if (!updatedComments || updatedComments.length === 0) {
          console.warn('⚠️ WARNING: No comments were reactivated!');
          console.warn('   Comments returned:', updatedComments?.length || 0);
          console.warn('   Check if RLS policy allows update');
        } else {
          console.log(`✅ Reactivated ${updatedComments.length} comments:`, updatedComments);
        }
      }

      const totalReactivated = postCount + commentCount;
      console.log(`🎉 Successfully reactivated ${totalReactivated} total items for user ${userId}`);
      
      // Show success toast to user
      toast.success(
        <div>
          <p className="font-bold">✅ Account Reactivated!</p>
          <p className="text-sm mt-1">Your {postCount > 0 ? `${postCount} post${postCount !== 1 ? 's' : ''}` : ''}{postCount > 0 && commentCount > 0 ? ' and ' : ''}{commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : ''} are now appeared again as your own.</p>
        </div>,
        { duration: 5000 }
      );
    } catch (error) {
      console.error('❌ Reactivation error:', error);
      // Don't show error toast - this happens silently if no content to reactivate
    }
  };

  // Show loading screen while initializing
  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-500">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-800">Loading...</p>
        </div>
      </div>
    );
  }

  // Main app render
  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-500 w-full flex flex-col items-center">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-400 ">
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
      </div>
    </HashRouter>
  )
}

export default App