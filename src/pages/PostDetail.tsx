import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { fetchPost, deletePost, createComment } from '../features/blog/blogSlice'
import { format, formatDistanceToNow } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ImageUpload from '../components/ImageUpload'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useState } from 'react'

// Validation schema for comment form
const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'), // Comment content is required
})

type CommentFormData = z.infer<typeof commentSchema> // Infer form data type from schema

// PostDetail component to display a single blog post and its comments
function PostDetail() {
  const { id } = useParams<{ id: string }>() // Get post ID from URL params
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { currentPost, comments, loadingSingle, loadingComments } = useAppSelector((state) => state.blogs) // Get current post and comments from state
  const { user } = useAppSelector((state) => state.auth) // Get current user from auth state
  const [commentImageUrl, setCommentImageUrl] = useState<string | undefined>() // State for comment image URL

  const isOwner = currentPost?.user_id === user?.id // Check if current user is the post owner

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema), // Use Zod schema for validation
  })

  const commentContent = watch('content', '')

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

  // Handle comment submission
  const onCommentSubmit = async (data: CommentFormData) => {
    if (!user?.email || !user?.id) {
      toast.error('You must be logged in to comment')
      return
    }
    // Create the comment
    await dispatch(
      createComment({
        postId: id!,
        user_id: user.id,
        content: data.content,
        image_url: commentImageUrl,
        author_email: user.email,
      })
    ).unwrap()

    toast.success('Comment added successfully!')
    reset()
    setCommentImageUrl(undefined) // Reset comment image URL
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

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Comments ({comments.length})
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Join the conversation
              </div>
            </div>

            {/* Comment Form */}
            {user ? (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-10 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {getUserInitial(user.email || '')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {user.email?.split('@')[0]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {commentContent.length}/500 characters
                      </span>
                    </div>
                    <form onSubmit={handleSubmit(onCommentSubmit)} className="space-y-4">
                      <textarea
                        {...register('content')}
                        rows={4}
                        maxLength={500}
                        placeholder="Share your thoughts on this post..."
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 resize-none"
                      />
                      {errors.content && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{errors.content.message}</span>
                        </div>
                      )}

                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Add an image to your comment (optional)
                        </label>
                        <ImageUpload onUpload={setCommentImageUrl} />
                        {commentImageUrl && (
                          <div className="mt-3 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 max-w-xs">
                            <img 
                              src={commentImageUrl} 
                              alt="Preview" 
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Markdown is supported in comments
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmitting || !commentContent.trim()}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Posting...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              <span>Post Comment</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-indigo-100 dark:border-gray-700">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-md">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Join the Discussion</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Sign in to share your thoughts and connect with other readers.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In to Comment</span>
                </Link>
              </div>
            )}

            {/* Comments List */}
            {loadingComments ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No comments yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Be the first to share your thoughts on this post!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div 
                    key={comment.id} 
                    className={`group p-6 rounded-xl border transition-all duration-200 ${
                      comment.user_id === user?.id
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800'
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
                        comment.user_id === user?.id
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                          : comment.user_id
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                      }`}>
                        {comment.user_id ? getUserInitial(comment.author_email) : 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {comment.user_id === user?.id 
                              ? 'You' 
                              : comment.user_id 
                                ? comment.author_email.split('@')[0]
                                : 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(comment.created_at), 'MMM d, yyyy')} • {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-start prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-4">
                          {comment.content}
                        </div>
                        {comment.image_url && (
                          <div className="mt-3 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 max-w-xs">
                            <img
                              src={comment.image_url}
                              alt="Comment attachment"
                              className="w-full h-40 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostDetail