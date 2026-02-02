import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

// Props interface
interface ImageUploadProps {
  onUpload: (url: string) => void
  initialUrl?: string | null
  label?: string
  maxSizeMB?: number
}

// ImageUpload component
function ImageUpload({ onUpload, initialUrl, label = "Upload Image (optional)", maxSizeMB = 50 }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl || null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle the upload process
  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      setUploadProgress(0)

      // Validate file size
      const maxSize = maxSizeMB * 1024 * 1024
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${maxSizeMB}MB`)
        return
      }

      // Generate preview
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file)

      clearInterval(progressInterval) // Clear simulated progress interval
      setUploadProgress(100) // Set progress to 100% on completion

      if (uploadError) throw uploadError

      // Get public URL of the uploaded image
      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName)

      // Notify parent component of the new image URL
      onUpload(data.publicUrl)
      toast.success(
        <div className="flex items-center space-x-2">
          <span>Image uploaded successfully!</span>
        </div>
      )
      
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000)
      
    } catch (err: any) {
      toast.error(
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>{err.message || 'Upload failed. Please try again.'}</span>
        </div>
      )
    } finally {
      setUploading(false)
    }
  }

  // Handle file input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleUpload(file)
  }

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  // Handle drop event
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0])
    }
  }

  // Trigger file input click
  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  // Remove image
  const handleRemoveImage = () => {
    setPreview(null)
    onUpload('')
    toast.success('Image removed')
  }

  return (
    <div className="space-y-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        <span className="ml-1 text-xs text-gray-500">(Max {maxSizeMB}MB)</span>
      </label>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        <div className="text-center">
          {/* Upload Icon */}
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 mb-4">
            {uploading ? (
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-gray-200 dark:border-gray-600"></div>
                <div 
                  className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-t-indigo-500 animate-spin"
                  style={{
                    background: 'conic-gradient(transparent, transparent)',
                    borderRightColor: 'transparent',
                    borderBottomColor: 'transparent',
                    borderLeftColor: 'transparent'
                  }}
                ></div>
              </div>
            ) : (
              <svg className="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG up to {maxSizeMB}MB
            </p>
          </div>

          {/* Upload Button */}
          {!uploading && (
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={uploading}
              className="mt-4 px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Choose Image
            </button>
          )}

          {/* Progress Bar */}
          {uploading && uploadProgress > 0 && (
            <div className="mt-4 space-y-2">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Preview
            </p>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Remove</span>
            </button>
          </div>
          
          <div className="relative group overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          {/* Image Info */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Ready to publish</span>
            </span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
              {initialUrl ? 'Current' : 'New upload'}
            </span>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start space-x-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Tip: Use high-quality images (min. 1200px width) for best results on blog posts.</span>
        </p>
      </div>
    </div>
  )
}

export default ImageUpload