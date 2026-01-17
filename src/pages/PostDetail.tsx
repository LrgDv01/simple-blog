import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { fetchPost, deletePost, clearCurrentPost } from '../features/blog/blogSlice'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { currentPost, loadingSingle, error } = useAppSelector((state) => state.blogs)
  const { user } = useAppSelector((state) => state.auth)

  const isOwner = currentPost?.user_id === user?.id

  useEffect(() => {
    if (id) dispatch(fetchPost(id))

    return () => {
      dispatch(clearCurrentPost())
    }
  }, [id, dispatch])

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await dispatch(deletePost(id!))
      navigate('/dashboard')
    }
  }

  if (loadingSingle) {
    return <div className="text-center py-12">Loading post...</div>
  }

  if (error || !currentPost) {
    return <div className="text-center py-12 text-red-600">{error || 'Post not found'}</div>
  }

  return (
    <article className="max-w-4xl mx-auto mt-12 bg-white rounded-xl shadow-lg p-8 md:p-12">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-2xl font-bold text-white">
          {currentPost.author_email.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-4xl font-bold dark:text-gray-500 mb-2">{currentPost.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>By {currentPost.author_email || 'Anonymous'}</span>
            <time>{format(new Date(currentPost.created_at), 'MMMM d, yyyy')}</time>
          </div>
        </div>
      </header>

      <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentPost.content}</ReactMarkdown>
      </div>

      {isOwner && (
        <div className="mt-12 flex gap-4">
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

      <div className="mt-8">
        <Link to="/dashboard" className="text-indigo-600 hover:underline">
          ← Back to all posts
        </Link>
      </div>
    </article>
  )
}

export default PostDetail