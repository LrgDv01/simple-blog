import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { fetchPost, deletePost, createComment, fetchComments } from '../features/blog/blogSlice'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ImageUpload from '../components/ImageUpload'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useState } from 'react'

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
})

type CommentFormData = z.infer<typeof commentSchema>

function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { currentPost, comments, loadingSingle, loadingComments } = useAppSelector((state) => state.blogs)
  const { user } = useAppSelector((state) => state.auth)
  const [commentImageUrl, setCommentImageUrl] = useState<string | undefined>()

  const isOwner = currentPost?.user_id === user?.id
  console.log('comments:', comments)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  useEffect(() => {
    if (id) {
      dispatch(fetchPost({ id }))
    }
  }, [id, dispatch])

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await dispatch(deletePost(id!))
      toast.success('Post deleted')
      navigate('/dashboard')
    }
  }

  const onCommentSubmit = async (data: CommentFormData) => {
    if (!user?.email || !user?.id) {
      toast.error('You must be logged in to comment')
      return
    }

    await dispatch(
      createComment({
        postId: id!,
        user_id: user.id,
        content: data.content,
        image_url: commentImageUrl,
        author_email: user.email,
      })
    ).unwrap()

    toast.success('Comment added!')
    reset()
    setCommentImageUrl(undefined)
  }

  if (loadingSingle) {
    return <div className="text-center py-20">Loading post...</div>
  }

  if (!currentPost) {
    return <div className="text-center py-20 text-red-600">Post not found</div>
  }

  return (
    <div className="max-w-5xl mx-auto mt-8">
      {/* Hero Image */}
      {currentPost.image_url && (
        <div className="mb-10 rounded-xl overflow-hidden shadow-xl">
          <img
            src={currentPost.image_url}
            alt={currentPost.title}
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 md:p-12">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
              {currentPost.user_id
                ? currentPost.author_email.charAt(0).toUpperCase()
                : 'A'}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {currentPost.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-lg text-gray-600 dark:text-gray-400">
                <span>By {currentPost.user_id ? currentPost.author_email : 'Anonymous'}</span>
                <time>{format(new Date(currentPost.created_at), 'MMMM d, yyyy')}</time>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {currentPost.content}
          </ReactMarkdown>
        </div>

        {/* Owner Actions */}
        {isOwner && (
          <div className="flex gap-4 mb-12 pb-8 border-b dark:border-gray-700">
            <Link
              to={`/edit/${currentPost.id}`}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              Edit Post
            </Link>
            <button
              onClick={handleDelete}
              className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
            >
              Delete Post
            </button>
          </div>
        )}

        {/* Comments Section */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">Comments ({comments.length})</h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSubmit(onCommentSubmit)} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-10 space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold text-white">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    {...register('content')}
                    rows={4}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800"
                  />
                  {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
                </div>
              </div>

              <ImageUpload onUpload={setCommentImageUrl} />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-center py-8 text-gray-600 dark:text-gray-400">
              <Link to="/login" className="text-indigo-600 hover:underline">Log in</Link> to leave a comment
            </p>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <p className="text-center py-8">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-8">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                    {comment.user_id ? comment.author_email.charAt(0).toUpperCase() : 'A'}        
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {comment.user_id ? comment.author_email : 'Anonymous'}
                      </span>
                      <time className="text-sm text-gray-500">
                        {format(new Date(comment.created_at), 'MMM d, yyyy')}
                      </time>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-4">
                      {comment.content}                        
                    </p>
                    {comment.image_url && (
                      <img
                        src={comment.image_url}
                        alt="Comment image"
                        className="max-w-md rounded-lg shadow-md"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-12">
          <Link to="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline text-lg">
            ← Back to all posts
          </Link>
        </div>
      </article>
    </div>
  )
}

export default PostDetail