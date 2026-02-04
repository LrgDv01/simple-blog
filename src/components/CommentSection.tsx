import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { createComment } from '../features/blog/blogSlice'
import { CommentItem } from './CommentItem'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import ImageUpload from './ImageUpload'
// import { format, formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'

// Validation schema for comment form
const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
})

type CommentFormData = z.infer<typeof commentSchema>

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { currentPost, comments, loadingComments } = useAppSelector((state) => state.blogs)
  const [commentImageUrl, setCommentImageUrl] = useState<string | undefined>()

  const isOwner = user?.id // Check if current user is commentor
  

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  const commentContent = watch('content', '')

  // Filter top-level comments (no parent_id)
  const topLevelComments = comments.filter(comment => !comment.parent_id)

  const handleSubmitComment = async (data: CommentFormData) => {
    if (!user?.email || !user?.id) {
      toast.error('You must be logged in to comment')
      return
    }
    
    try {
      await dispatch(createComment({
        postId,
        user_id: user.id,
        content: data.content,
        image_url: commentImageUrl,
        author_email: user.email
      })).unwrap()
      
      toast.success('Comment added successfully!')
      reset()
      setCommentImageUrl(undefined)
    } catch (error) {
      console.error('Failed to post comment:', error)
      toast.error('Failed to post comment. Please try again.')
    }
  }

  // Get user initial for avatar
  const getUserInitial = (email: string) => {
    return email?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Comments ({topLevelComments.length})
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Join the conversation
          </div>
        </div>

        {/* Comment Form */}
        {user ? (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-10 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4 mb-6">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
                  isOwner 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                    : currentPost?.user_id 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                }`}>
                <span className="text-white font-bold text-lg">
                   {currentPost?.user_id ? getUserInitial(currentPost.author_email) : 'A'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {/* {user.email?.split('@')[0]} */}
                    {user?.id
                      ? 'You' 
                    : currentPost?.user_id 
                        ? currentPost.author_email.split('@')[0]
                        : 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {commentContent.length}/500 characters
                  </span>
                </div>
                <form onSubmit={handleSubmit(handleSubmitComment)} className="space-y-4">
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
        ) : topLevelComments.length === 0 ? (
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
            {topLevelComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                level={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}