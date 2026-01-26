import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { fetchPost, updatePost } from '../features/blog/blogSlice'
import { useParams, useNavigate } from 'react-router-dom'
import ImageUpload from '../components/ImageUpload'
import toast from 'react-hot-toast'

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
})

type FormData = z.infer<typeof schema>

function EditBlog() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { currentPost, loadingSingle } = useAppSelector((state) => state.blogs)
  const { user } = useAppSelector((state) => state.auth)
  const [imageUrl, setImageUrl] = useState<string | undefined>(currentPost?.image_url || undefined)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (id) dispatch(fetchPost({ id }))
  }, [id, dispatch])

  useEffect(() => {
    if (currentPost) {
      reset({
        title: currentPost.title,
        content: currentPost.content,
      })
      setImageUrl(currentPost.image_url || undefined)
    }
  }, [currentPost, reset])

  const onSubmit = async (data: FormData) => {
    await dispatch(
      updatePost({
        id: id!,
        title: data.title,
        content: data.content,
        image_url: imageUrl,
        author_email: user?.email || currentPost?.author_email || '',
      })
    ).unwrap()

    toast.success('Post updated!')
    navigate(`/post/${id}`)
  }

  if (loadingSingle) return <div className="text-center py-12">Loading...</div>
  if (!currentPost || currentPost.user_id !== user?.id) {
    return <div className="text-center py-12 text-red-600">Unauthorized or post not found</div>
  }

  return (
    <div className="max-w-4xl mx-auto mt-12">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">Edit Post</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
            <input
              {...register('title')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <ImageUpload onUpload={setImageUrl} initialUrl={currentPost.image_url || undefined} />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
            <textarea
              {...register('content')}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(`/post/${id}`)}
              className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditBlog