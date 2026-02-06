import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '../app/hooks'
import { fetchPosts } from '../features/blog/blogSlice'
import { Link } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'

// Dashboard component to display blog posts with pagination
function Dashboard() {
  const dispatch = useAppDispatch()
  const { posts, loading, totalCount } = useAppSelector((state) => state.blogs)
  const { user } = useAppSelector((state) => state.auth)
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(totalCount / 10) // Assuming 10 posts per page

  // Fetch posts on component mount and page change
  useEffect(() => {
    dispatch(fetchPosts(page))
  }, [dispatch, page])

  // Handle page navigation with smooth scroll
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Generate array of page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const start = Math.max(0, page - 2)
    const end = Math.min(totalPages - 1, page + 2)
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  // Get user's initial for avatar
  const getUserInitial = (email: string) => {
    return email?.charAt(0).toUpperCase() || 'U'
  }

  // Format content snippet
  const getContentSnippet = (content: string) => {
    const plainText = content.replace(/[#*`]/g, '') // Remove markdown syntax
    return plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 py-3">
            Blog Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Discover stories, thinking, and expertise from writers on any topic.
          </p>
        </div>

        {/* Action Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">
                  {user ? getUserInitial(user.email || '') : 'B'}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {user ? `Welcome back, ${user.email?.split('@')[0]}` : 'Welcome to SimpleBlog'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalCount} posts published • {user ? 'Ready to write?' : 'Join the conversation!'}
                </p>
              </div>
            </div>

            {user && (
              <Link
                to="/create"
                className="group px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Write New Post</span>
              </Link>
            )}
          </div>
        </div>

        {/* Posts Grid */}
        {loading && posts.length === 0 ? (
          <div className="grid gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="p-8">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2 mb-6">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto h-32 w-32 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 mb-8">
              <svg className="h-16 w-16 text-indigo-400 dark:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No posts yet</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
              Be the first to share your thoughts and start the conversation!
            </p>
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Join to Write
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <article 
                key={post.id} 
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="p-8">
                  {/* Author & Date */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                        post.user_id === user?.id 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                          : post.user_id 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                      }`}>
                        {post.user_id ? getUserInitial(post.author_email) : 'A'}
                      </div>
                      <div>
                        <p className="text-start text-sm font-medium text-gray-900 dark:text-gray-100">
                          {post.user_id === user?.id 
                            ? 'You' 
                            : post.user_id 
                              ? post.author_email.split('@')[0]
                              : 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                          <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                        </p>
                      </div>
                    </div>
                    
                    {post.image_url && (
                      <div className="h-16 w-16 rounded-lg overflow-hidden shadow-sm">
                        <img 
                          src={post.image_url} 
                          alt="" 
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                  </div>

                  {/* Title & Content */}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                    <Link to={`/post/${post.id}`} className="hover:underline decoration-2 decoration-indigo-500">
                      {post.title}
                    </Link>
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3">
                    {getContentSnippet(post.content)}
                  </p>

                  {/* Stats & Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Read</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{post.comment_count || 0} comments</span>
                      </span>
                    </div>

                    <Link 
                      to={`/post/${post.id}`}
                      className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors"
                    >
                      <span className="mr-2">Read more</span>
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="flex items-center space-x-2 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-2">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`h-10 w-10 rounded-lg font-medium transition-colors duration-200 ${
                      page === pageNum
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                ))}
                {totalPages > 5 && page < totalPages - 3 && (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages - 1)}
                      className="h-10 w-10 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {posts.length} of {totalCount} posts
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page + 1 >= totalPages}
                className="flex items-center space-x-2 px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Call to Action */}
        {!user && posts.length > 0 && (
          <div className="mt-12 p-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Join our community of writers</h3>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Share your stories, connect with readers, and be part of something bigger.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Writing Now
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                Sign In to Continue
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard