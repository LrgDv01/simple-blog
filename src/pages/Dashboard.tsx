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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Blog Posts</h2>
        {user && (
          <Link
            to="/create"
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Write New Post
          </Link>
        )}
      </div>

      {loading && page === 0 ? (
        <p className="text-center text-gray-500">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-gray-500">No posts yet. Be the first to write one!</p>
      ) : (
        <div className="grid gap-8">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                <Link to={`/edit/${post.id}`} className="hover:text-indigo-600">
                  {post.title}
                </Link>
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>By {post.user_id === user?.id ? 'You' : 'Someone'}</span>
                <time>{format(new Date(post.created_at), 'MMM d, yyyy')}</time>
              </div>
              {post.user_id === user?.id && (
                <div className="mt-4 flex gap-4">
                  <Link to={`/edit/${post.id}`} className="text-indigo-600 hover:underline">
                    Edit
                  </Link>
                  {/* Delete button will come tomorrow */}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="self-center">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Dashboard