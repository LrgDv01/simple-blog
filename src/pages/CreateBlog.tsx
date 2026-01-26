import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { createPost } from '../features/blog/blogSlice'
import { useNavigate } from 'react-router-dom'
import ImageUpload from '../components/ImageUpload'
import { useState } from 'react'
import toast from 'react-hot-toast'

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
})

type FormData = z.infer<typeof schema>

function CreateBlog() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)
  const [imageUrl, setImageUrl] = useState<string | undefined>()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!user?.email) {
      toast.error('You must be logged in')
      return
    }

    await dispatch(
      createPost({
        title: data.title,
        content: data.content,
        image_url: imageUrl,
        author_email: user.email,
      })
    ).unwrap()

    toast.success('Post published!')
    navigate('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">Write a New Post</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
            <input
              {...register('title')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
              placeholder="Enter a catchy title..."
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <ImageUpload onUpload={setImageUrl} />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content (Markdown supported)</label>
            <textarea
              {...register('content')}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
              placeholder="Write your story... **bold**, *italic*, lists, etc."
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
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