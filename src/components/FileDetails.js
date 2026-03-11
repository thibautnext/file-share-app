'use client'

export default function FileDetails({ file, onDownload, downloading }) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="space-y-6">
        {/* File Icon */}
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
        </div>

        {/* File Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nom du fichier
            </label>
            <p className="text-lg font-semibold text-gray-800 break-all">
              {file.filename}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Taille
              </label>
              <p className="text-lg text-gray-800">
                {formatBytes(file.size)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Temps restant
              </label>
              <p className="text-lg text-gray-800">
                {file.timeRemaining}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Partagé le
            </label>
            <p className="text-sm text-gray-600">
              {formatDate(file.createdAt)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Expire le
            </label>
            <p className="text-sm text-gray-600">
              {formatDate(file.expiresAt)}
            </p>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={onDownload}
          disabled={downloading}
          className={`w-full btn-primary py-3 text-lg font-semibold ${
            downloading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {downloading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Téléchargement...
            </span>
          ) : (
            <span>⬇️ Télécharger le fichier</span>
          )}
        </button>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            ℹ️ Ce fichier sera automatiquement supprimé après 24 heures
          </p>
        </div>
      </div>
    </div>
  )
}
