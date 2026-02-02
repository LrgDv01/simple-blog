import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { createPost, clearCurrentPost } from '../features/blog/blogSlice'
import { useNavigate } from 'react-router-dom'
import ImageUpload from '../components/ImageUpload'
import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

// Validation schema for blog post creation
const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
})

type FormData = z.infer<typeof schema>

function CreateBlog() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [isPreview, setIsPreview] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      content: '',
    }
  })

  const content = watch('content', '')
  const title = watch('title', '')

  // Create new AbortController on mount
  useEffect(() => {
    abortControllerRef.current = new AbortController()
    
    return () => {
      // Abort any ongoing requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      reset()
      setImageUrl(undefined)
      setIsSubmitting(false)
    }
  }, [reset])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - abort ongoing operations
        if (abortControllerRef.current && isSubmitting) {
          abortControllerRef.current.abort()
          setIsSubmitting(false)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isSubmitting])

  // Update character count
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length)
  }

  // Form submission handler
  const onSubmit = async (data: FormData) => {
    if (!user?.email) {
      toast.error(
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-2-5h.01M12 12h.01M12 7h.01M7 12h.01" />
          </svg>
          <span>You must be logged in to create a post</span>
        </div>
      )
      return
    }
    
    // Prevent multiple submissions
    if (isSubmitting) return
    
    // Create new AbortController for this submission
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal
    
    setIsSubmitting(true)
    
    try {
      // Create the post with abort signal
      const result = await dispatch(
        createPost({
          title: data.title,
          content: data.content,
          image_url: imageUrl,
          author_email: user.email,
        })
      ).unwrap()

      // Check if request was aborted
      if (signal.aborted) {
        return
      }

      toast.success(
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Post published successfully!</span>
        </div>,
        { duration: 4000 }
      )
      
      // Reset form state
      reset()
      setImageUrl(undefined)
      setIsSubmitting(false)
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
      
    } catch (error: any) {
      // Check if error is due to abort
      if (error.name === 'AbortError' || signal.aborted) {
        console.log('Request was aborted')
        return
      }
      
      setIsSubmitting(false)
      
      const errorMessage = error?.message || 'Failed to publish post. Please try again.'
      toast.error(
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Create New Post
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Share your thoughts, stories, and ideas with the world
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Form Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  !isPreview
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Write</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsPreview(true)}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  isPreview
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Preview</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Title Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Post Title
                  </label>
                  <span className={`text-sm ${title.length < 5 ? 'text-red-500' : 'text-green-500'}`}>
                    {title.length}/5 characters
                  </span>
                </div>
                <input
                  {...register('title')}
                  className={`w-full px-5 py-4 text-lg border rounded-xl focus:ring-2 focus:ring-offset-2 transition-all ${
                    errors.title
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700'
                  }`}
                  placeholder="Craft a compelling title that captures attention..."
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm font-medium">{errors.title.message}</span>
                  </div>
                )}
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Featured Image
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Optional</span>
                </div>
                <ImageUpload 
                  onUpload={setImageUrl} 
                  label="Upload a featured image for your post"
                  maxSizeMB={50}
                  disabled={isSubmitting}
                />
              </div>

              {/* Content Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Post Content
                  </label>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm ${charCount < 20 ? 'text-red-500' : 'text-green-500'}`}>
                      {charCount}/20 characters
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Markdown supported</span>
                  </div>
                </div>

                {isPreview ? (
                  <div className="min-h-[400px] p-6 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {content ? (
                        <ReactMarkdown>{content}</ReactMarkdown>
                      ) : (
                        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>Start writing to see the preview...</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <textarea
                      {...register('content')}
                      rows={15}
                      onChange={(e) => {
                        register('content').onChange(e)
                        handleContentChange(e)
                      }}
                      className={`w-full px-5 py-4 border rounded-xl focus:ring-2 focus:ring-offset-2 transition-all font-mono text-sm ${
                        errors.content
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-700'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700'
                      }`}
                      placeholder="Write your story here... You can use **bold**, *italic*, `code`, lists, and more with Markdown."
                      disabled={isSubmitting}
                    />
                    {errors.content && (
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-sm font-medium">{errors.content.message}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Markdown Tips */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Markdown Tips</span>
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">**bold**</code>
                    <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">*italic*</code>
                    <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border"># Heading 1</code>
                    <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">- List item</code>
                    <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">1. Numbered</code>
                    <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">`code`</code>
                    <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">[link](url)</code>
                    <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded border">![alt](image.png)</code>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsPreview(!isPreview)}
                    className="px-6 py-3 border-2 border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    {isPreview ? 'Continue Editing' : 'Preview Post'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !user}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Publishing...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Publish Post</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Inspiration Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-indigo-100 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Need inspiration?</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Share a personal story, tutorial, opinion, or industry insight. Great posts are authentic, 
            informative, and engaging. Remember to add value to your readers!
          </p>
        </div>
      </div>
    </div>
  )
}

export default CreateBlog