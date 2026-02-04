import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { fetchPost, deletePost } from '../features/blog/blogSlice'
import { format, formatDistanceToNow } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { CommentSection } from '../components/CommentSection'
import toast from 'react-hot-toast'

// PostDetail component to display a single blog post and its comments
function PostDetail() {
  const { id } = useParams<{ id: string }>() // Get post ID from URL params
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { currentPost, loadingSingle } = useAppSelector((state) => state.blogs) // Get current post from state
  const { user } = useAppSelector((state) => state.auth) // Get current user from auth state

  const isOwner = currentPost?.user_id === user?.id // Check if current user is the post owner

  // Fetch post details on component mount
  useEffect(() => {
    if (id) {
      dispatch(fetchPost({ id }))
    }
  }, [id, dispatch])

  // Handle post deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      await dispatch(deletePost(id!)) 
      toast.success('Post deleted successfully')
      navigate('/dashboard')
    }
  }

  // Get user initial for avatar
  const getUserInitial = (email: string) => {
    return email?.charAt(0).toUpperCase() || 'U'
  }

  // Render loading state
  if (loadingSingle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-8"></div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render not found state
  if (!currentPost) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-red-500 to-orange-500 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Post Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/dashboard"
            className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Browse All Posts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Hero Image */}
        {currentPost.image_url && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
            <img
              src={currentPost.image_url}
              alt={currentPost.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Back Button */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to all posts</span>
          </Link>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
          {/* Author Header */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ${
                  isOwner 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                    : currentPost.user_id 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                }`}>
                  {currentPost.user_id ? getUserInitial(currentPost.author_email) : 'A'}
                </div>
                <div>
                  <h3 className="text-start text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {currentPost.user_id === user?.id 
                      ? 'You' 
                      : currentPost.user_id 
                        ? currentPost.author_email.split('@')[0]
                        : 'Anonymous'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <time>{format(new Date(currentPost.created_at), 'MMMM d, yyyy')}</time>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(currentPost.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {isOwner && (
                <div className="flex items-center space-x-3">
                  <Link
                    to={`/edit/${currentPost.id}`}
                    className="px-5 py-2.5 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-red-600 hover:to-orange-600 transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div className="p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
              {currentPost.title}
            </h1>
            
            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-blockquote:border-l-indigo-500 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentPost.content}
              </ReactMarkdown>
            </div>

            {/* Post Tags (Optional - can be added to your Post type) */}
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                Blog Post
              </span>
              <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
                {format(new Date(currentPost.created_at), 'MMM yyyy')}
              </span>
            </div>
          </div>
        </div>

        {/* New CommentSection Component with Edit & Reply Features */}
        <CommentSection postId={currentPost.id} />
      </div>
    </div>
  )
}

export default PostDetail