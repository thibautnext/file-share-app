import './globals.css'

export const metadata = {
  title: 'FileShare - Partage Sécurisé de Fichiers',
  description: 'Partagez vos fichiers de manière sécurisée avec suppression automatique après 24h',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-blue-600">FileShare</h1>
              <p className="text-sm text-gray-600">Partage sécurisé de fichiers</p>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-white border-t text-center py-4 text-sm text-gray-600">
            <p>Les fichiers sont supprimés automatiquement après 24 heures</p>
          </footer>
        </div>
      </body>
    </html>
  )
}
