import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { fetchPost, updatePost } from '../features/blog/blogSlice'
import { useParams, useNavigate } from 'react-router-dom'
import ImageUpload from '../components/ImageUpload'
import toast from 'react-hot-toast'

// Validation schema for editing a blog post
const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
})

type FormData = z.infer<typeof schema> // Infer form data type from schema

// EditBlog component for editing existing blog posts
function EditBlog() {
  const { id } = useParams<{ id: string }>() // Get post ID from URL params
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { currentPost, loadingSingle } = useAppSelector((state) => state.blogs) // Get current post and loading state
  const { user } = useAppSelector((state) => state.auth)
  const [imageUrl, setImageUrl] = useState<string | undefined>(currentPost?.image_url || undefined) // State for image URL

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }, // Destructure isSubmitting for button state
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema), // Use Zod schema for validation
  })

  useEffect(() => {
    if (id) dispatch(fetchPost({ id })) // Fetch the post to edit
  }, [id, dispatch])

  // Populate form when currentPost is loaded
  useEffect(() => {
    if (currentPost) {
      reset({
        title: currentPost.title,
        content: currentPost.content,
      })
      setImageUrl(currentPost.image_url || undefined) // Set initial image URL
    }
  }, [currentPost, reset])

  // Form submission handler
  const onSubmit = async (data: FormData) => {
    await dispatch(
      updatePost({
        id: id!,
        title: data.title,
        content: data.content,
        image_url: imageUrl,
        author_email: user?.email || currentPost?.author_email || '', // Fallback to existing email
      })
    ).unwrap()

    toast.success('Post updated successfully! ✨')
    navigate(`/post/${id}`) // Navigate to the updated post
  }

  // Loading state
  if (loadingSingle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3 mb-8"></div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="space-y-8">
                <div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
                <div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Unauthorized or not found state
  if (!currentPost || currentPost.user_id !== user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-red-500 to-orange-500 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.408 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Access Restricted</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            You don't have permission to edit this post or the post doesn't exist.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(`/post/${id}`)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Post</span>
            </button>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Editing post • {new Date(currentPost.created_at).toLocaleDateString()}
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Edit Your Story
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Refine your thoughts and share your updated perspective with the world.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Title Field */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Title
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      {currentPost.title.length}/100 characters
                    </span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Editing as {user?.email?.split('@')[0]}</span>
                  </div>
                </div>
                <input
                  {...register('title')}
                  defaultValue={currentPost.title}
                  maxLength={100}
                  className="w-full px-6 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-gray-700/50 text-lg font-medium placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                  placeholder="Craft a compelling title for your story..."
                />
                {errors.title && (
                  <div className="flex items-center space-x-2 mt-2 text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{errors.title.message}</span>
                  </div>
                )}
              </div>

              {/* Featured Image */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Featured Image
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      Optional • 1200×630px recommended
                    </span>
                  </label>
                  {/* {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(undefined)}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove Image</span>
                    </button>
                  )} */}
                </div>
                <ImageUpload onUpload={setImageUrl} initialUrl={currentPost.image_url || undefined} />
                
                {imageUrl && (
                  <div className="mt-4 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Content Field */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Your Story
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                      Share your thoughts and ideas
                    </span>
                  </label>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Markdown supported</span>
                  </div>
                </div>
                <textarea
                  {...register('content')}
                  defaultValue={currentPost.content}
                  rows={15}
                  className="w-full px-6 py-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-gray-700/50 font-mono text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 resize-none"
                  placeholder="Start writing your story here... You can use **markdown** for formatting."
                />
                {errors.content && (
                  <div className="flex items-center space-x-2 mt-2 text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{errors.content.message}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {currentPost.content.length} characters
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Minimum 20 characters required
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Last edited: {new Date().toLocaleDateString()} • Auto-save disabled
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/post/${id}`)}
                      className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-lg transition-all duration-200"
                    >
                      Discard Changes
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none transition-all duration-200 flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Publish Updates</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Tips Sidebar */}
          <div className="bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 border-t border-indigo-200 dark:border-gray-700 p-6">
            <h4 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Editing Tips
            </h4>
            <ul className="space-y-3 text-sm text-indigo-700 dark:text-indigo-400">
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Use headings (##) to structure your content</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Add **bold** or *italic* text for emphasis</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Include links [text](url) to reference sources</span>
              </li>
              <li className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Update images to keep content fresh</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditBlog