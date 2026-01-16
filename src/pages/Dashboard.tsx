import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { fetchPosts } from '../features/blog/blogSlice'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

function Dashboard() {
  const dispatch = useAppDispatch()
  const { posts, loading, totalCount } = useAppSelector((state) => state.blogs)
  const { user } = useAppSelector((state) => state.auth)
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(totalCount / 10)

  useEffect(() => {
    dispatch(fetchPosts(page))
  }, [dispatch, page])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-4xl font-bold text-gray-900">Blog Posts</h2>
        {user && (
          <Link
            to="/create"
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md"
          >
            Write New Post
          </Link>
        )}
      </div>

      {loading && posts.length === 0 ? (
        <div className="grid gap-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-500 py-12 text-xl">No posts yet. Be the first to write one!</p>
      ) : (
        <div className="grid gap-8">
          {posts.map((post) => (
            <article key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                <Link to={`/post/${post.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {post.title}
                </Link>
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {post.content?.substring(0, 100)}
              </p>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {post.author_email.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  By <span className="font-medium">{user && post.user_id === user?.id ? 'You' : post.author_email || 'Anonymous'}</span> • {format(new Date(post.created_at), 'MMM d, yyyy')}
                </p>
              </div>

              <Link to={`/post/${post.id}`} className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium hover:underline transition-colors gap-1">
                Read more <span>→</span>
              </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-6 py-3 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
          >
            Previous
          </button>
          <span className="self-center text-gray-700">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages}
            className="px-6 py-3 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Dashboard