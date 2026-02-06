import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { updateComment, deleteComment, createComment } from '../features/blog/blogSlice'
import type { Comment as CommentType } from '../types/post'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import ImageUpload from './ImageUpload'
import { format, formatDistanceToNow } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Validation schema for comment edit form
const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
})

type CommentFormData = z.infer<typeof commentSchema>

interface CommentItemProps {
  comment: CommentType
  postId: string
  level?: number
}

export function CommentItem({ comment, postId, level = 0 }: CommentItemProps) {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { comments } = useAppSelector((state) => state.blogs)
  // const { currentPost, comments } = useAppSelector((state) => state.blogs)
  const [isEditing, setIsEditing] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  // const [editImageUrl, setEditImageUrl] = useState<string | undefined>(
  //   comment.image_url ? comment.image_url : undefined
  // )
  const [replyImageUrl, setReplyImageUrl] = useState<string | undefined>()
  const [showReplies, setShowReplies] = useState(true)

  // Initialize react-hook-form for editing
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    // watch: editWatch,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: comment.content,
    }
  })

  // Initialize react-hook-form for replying
  const {
    register: replyRegister,
    handleSubmit: handleReplySubmit,
    watch: replyWatch,
    reset: resetReply,
    formState: { errors: replyErrors, isSubmitting: isReplySubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  // Remove unused editContent variable
  const replyContent = replyWatch('content', '')

  const isAuthor = user?.email === comment.author_email && comment.author_email !== '[deleted]'
  const canReply = user && comment.author_email !== '[deleted]'

  const handleUpdateComment = async (data: CommentFormData) => {
    if (!data.content.trim() || data.content === comment.content) {
      setIsEditing(false)
      return
    }

    try {
        await dispatch(updateComment({
        commentId: comment.id,
        content: data.content
        })).unwrap()
        setIsEditing(false)
        
        // Note: Not updating the image URL here because
        // backend doesn't support updating comment images yet
        // To support image updates, need to modify
        // the updateComment thunk to accept image_url
    } catch (error) {
        console.error('Failed to update comment:', error)
    }
  }

  const handleDeleteComment = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    
    try {
      await dispatch(deleteComment(comment.id)).unwrap()
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const handleReply = async (data: CommentFormData) => {
    if (!data.content.trim() || !user?.email || !user?.id) {
      setIsReplying(false)
      return
    }
    
    try {
      await dispatch(createComment({
        postId,
        user_id: user.id,
        content: data.content,
        author_email: user.email,
        parent_id: comment.id,
        image_url: replyImageUrl
      })).unwrap()
      resetReply()
      setReplyImageUrl(undefined)
      setIsReplying(false)
      setShowReplies(true)
    } catch (error) {
      console.error('Failed to post reply:', error)
    }
  }

  // Get user initial for avatar
  const getUserInitial = (email: string) => {
    return email?.charAt(0).toUpperCase() || 'U'
  }

  // Helper function to safely set image URL
  // const safeSetEditImageUrl = (url: string | null | undefined) => {
  //   setEditImageUrl(url ? url : undefined)
  // }

  // Find replies for this comment
  const replies = comments.filter(c => c.parent_id === comment.id)

  return (
    <div className={`${level > 0 ? 'ml-8 md:ml-12' : ''}`}>
      <div className={`group p-6 rounded-xl border transition-all duration-200 mb-4 ${
        comment.user_id === user?.id
          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800'
          : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
            comment.user_id === user?.id
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
              : comment.user_id
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
          }`}>
            {comment.user_id ? getUserInitial(comment.author_email) : 'A'}
          </div>

          {/* Comment Content */}
          <div className="flex-1">
            {/* Comment Header */}
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
                {comment.is_edited && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    Edited
                  </span>
                )}
              </span>
            </div>

            {/* Comment Content - Edit Mode */}
            {isEditing ? (
                <div className="space-y-4 mb-4">
                    <textarea
                    {...editRegister('content')}
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 resize-none"
                    autoFocus
                    />
                    {editErrors.content && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{editErrors.content.message}</span>
                    </div>
                    )}

                    {/* Comment image updates are not supported at this time */}
                    {/* {comment.image_url && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                        <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 max-w-xs">
                        <img 
                            src={comment.image_url} 
                            alt="Current comment attachment"
                            className="w-full h-32 object-cover"
                        />
                        </div>              
                    </div>
                    )} */}

                    <div className="flex items-center space-x-2">
                    <button
                        onClick={handleEditSubmit(handleUpdateComment)}
                        disabled={isEditSubmitting}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                    >
                        {isEditSubmitting ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Saving...</span>
                        </>
                        ) : (
                        <span>Save</span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                        setIsEditing(false)
                        resetEdit()
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    </div>
                </div>
            ) : (

              /* Comment Content - View Mode */
              <>
                <div className="text-start prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 mb-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comment.content}
                  </ReactMarkdown>
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
              </>
            )}

            {/* Comment Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                {canReply && !isEditing && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Reply</span>
                  </button>
                )}
                
                {replies.length > 0 && (
                  <button
                    onClick={() => setShowReplies(!showReplies)}
                    className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <svg className={`w-4 h-4 transform transition-transform ${showReplies ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>
                      {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  </button>
                )}
              </div>

              {isAuthor && (
                <div className="flex items-center space-x-3">
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={handleDeleteComment}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Reply Form */}
            {isReplying && (
              <div className="mt-4 pl-4 border-l-2 border-indigo-300 dark:border-indigo-600">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {getUserInitial(user?.email || '')}
                        {/* {currentPost.user_id ? getUserInitial(currentPost.author_email) : 'A'} */}
                      </span>
                    </div>
                    <div className="flex-1">
                      <form onSubmit={handleReplySubmit(handleReply)} className="space-y-4">
                        <textarea
                          {...replyRegister('content')}
                          rows={3}
                          maxLength={500}
                          placeholder={`Reply to ${comment.author_email}...`}
                          className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 resize-none"
                          autoFocus
                        />
                        {replyErrors.content && (
                          <div className="flex items-center space-x-2 text-red-600 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{replyErrors.content.message}</span>
                          </div>
                        )}

                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Add an image to your reply (optional)
                          </label>
                          <ImageUpload 
                            onUpload={setReplyImageUrl} 
                            label="Choose an image for your reply"
                          />
                          {replyImageUrl && (
                            <div className="mt-3 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 max-w-xs">
                              <img 
                                src={replyImageUrl} 
                                alt="Preview" 
                                className="w-full h-32 object-cover"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="submit"
                            disabled={isReplySubmitting || !replyContent.trim()}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                          >
                            {isReplySubmitting ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Posting...</span>
                              </>
                            ) : (
                              <span>Post Reply</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsReplying(false)
                              resetReply()
                              setReplyImageUrl(undefined)
                            }}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}