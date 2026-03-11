'use client'

import { useState, useRef } from 'react'
import UploadZone from '@/components/UploadZone'
import UploadProgress from '@/components/UploadProgress'

export default function Home() {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (file) => {
    setError('')
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    if (usePassword && password) {
      formData.append('password', password)
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const bodyText = await response.text()
      let data

      try {
        data = JSON.parse(bodyText)
      } catch (parseErr) {
        console.error('Response text:', bodyText)
        throw new Error(`Server error: ${bodyText.substring(0, 100)}`)
      }

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed')
      }

      setUploadedFile(data)
      setPassword('')
      setUsePassword(false)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {uploadedFile ? (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Fichier uploadé avec succès!</h2>
            <p className="text-gray-600 mb-6">Partagez ce lien avec vos destinataires:</p>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-6 break-all">
              <code className="font-mono text-sm">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/upload/${uploadedFile.fileId}`}
              </code>
            </div>

            {uploadedFile.protected && (
              <p className="text-amber-600 mb-4 text-sm">⚠️ Ce fichier est protégé par un mot de passe</p>
            )}

            <p className="text-gray-500 text-sm mb-6">
              Le fichier sera automatiquement supprimé dans 24 heures
            </p>

            <button
              onClick={() => setUploadedFile(null)}
              className="btn-primary"
            >
              Uploader un autre fichier
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Uploadez votre fichier</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <UploadZone
              onUpload={handleUpload}
              disabled={uploading}
            />

            {!uploading && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="usePassword"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    className="w-4 h-4 text-blue-500 rounded cursor-pointer"
                  />
                  <label htmlFor="usePassword" className="text-sm text-gray-700 cursor-pointer">
                    Protéger avec un mot de passe
                  </label>
                </div>

                {usePassword && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Entrez un mot de passe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {uploading && <UploadProgress />}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">📋 Fonctionnalités</h3>
            <ul className="space-y-2 text-sm text-blue-900">
              <li>✓ Upload de fichiers jusqu'à 100MB</li>
              <li>✓ Protection optionnelle par mot de passe</li>
              <li>✓ Suppression automatique après 24 heures</li>
              <li>✓ Lien de partage unique et sécurisé</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
