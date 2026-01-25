import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

// Define the props for ImageUpload
interface ImageUploadProps {
  onUpload: (url: string) => void
  initialUrl?: string | null
}

// ImageUpload component for uploading images to Supabase Storage
function ImageUpload({ onUpload, initialUrl }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl || null)
  const [uploading, setUploading] = useState(false)

    // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the file from the input
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) return

      // Preview
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string) // Set preview once file is read
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

    //   Get public URL
      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName)

        // Notify parent component
      onUpload(data.publicUrl)
      toast.success('Image uploaded!')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Upload Image (optional)
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
      />
      {uploading && <p className="text-sm text-indigo-600">Uploading...</p>}
      {preview && (
        <div className="mt-4">
          <img src={preview} alt="Preview" className="max-h-64 rounded-lg shadow-md" />
        </div>
      )}
    </div>
  )
}

export default ImageUpload