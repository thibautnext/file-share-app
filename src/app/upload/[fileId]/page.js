'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import FileDetails from '@/components/FileDetails'
import PasswordPrompt from '@/components/PasswordPrompt'

export default function DownloadPage() {
  const params = useParams()
  const fileId = params.fileId
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [passwordToken, setPasswordToken] = useState(null)

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await fetch(`/api/file/${fileId}`)
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || 'File not found')
        }

        const data = await response.json()
        setFile(data)
        
        if (data.protected) {
          setNeedsPassword(true)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (fileId) {
      fetchFile()
    }
  }, [fileId])

  const handlePasswordSubmit = async (password) => {
    try {
      const response = await fetch(`/api/file/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Invalid password')
      }

      const data = await response.json()
      setFile(data)
      setPasswordToken(password)
      setNeedsPassword(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const url = passwordToken
        ? `/api/download/${fileId}?token=${encodeURIComponent(passwordToken)}`
        : `/api/download/${fileId}`
      window.location.href = url
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.')) {
      return
    }

    setDeleting(true)
    try {
      const deleteUrl = passwordToken
        ? `/api/delete/${fileId}?token=${encodeURIComponent(passwordToken)}`
        : `/api/delete/${fileId}`
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la suppression')
      }

      // Redirect to home after successful deletion
      setTimeout(() => {
        window.location.href = '/?deleted=true'
      }, 500)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du fichier...</p>
        </div>
      </div>
    )
  }

  if (error && !file) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-8 text-center">
          <div className="text-3xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Fichier non trouvé</h2>
          <p className="text-red-600">{error}</p>
          <a href="/" className="btn-primary inline-block mt-6">
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {needsPassword ? (
        <PasswordPrompt
          onSubmit={handlePasswordSubmit}
          error={error}
          onClearError={() => setError('')}
        />
      ) : file ? (
        <FileDetails
          file={file}
          onDownload={handleDownload}
          downloading={downloading}
          onDelete={handleDelete}
          deleting={deleting}
        />
      ) : null}
    </div>
  )
}
