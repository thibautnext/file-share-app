'use client'

export default function UploadProgress() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
        </div>
        <p className="text-center text-gray-600 font-medium">
          Upload en cours...
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full animate-pulse"
            style={{ width: '100%' }}
          ></div>
        </div>
      </div>
    </div>
  )
}
