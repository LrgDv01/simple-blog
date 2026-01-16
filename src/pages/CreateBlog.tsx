import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { createPost } from '../features/blog/blogSlice'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  author_email: z.string().email('Please enter a valid email'),
})

type FormData = z.infer<typeof schema>

function CreateBlog() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await dispatch(
      createPost({
        ...data, 
        author_email: user?.email || 'anonymous@example.com',
      })
    ).unwrap()
    navigate('/dashboard')
  }

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-8 text-gray-800">Write a New Post</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              {...register('title')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter a catchy title..."
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              {...register('content')}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Write your story..."
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Author Email</label>
            <input
              {...register('author_email')}
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="your@email.com"
            />
            {errors.author_email && <p className="mt-1 text-sm text-red-600">{errors.author_email.message}</p>}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBlog