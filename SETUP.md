# FileShare - Guide de Configuration

## 📋 Prérequis

- Node.js 18+ et npm/yarn
- PostgreSQL (NAS ou cloud)
- Accès Vercel (pour déploiement)
- Dossier NAS accessible pour stockage fichiers (ou Vercel Blob)

## 🗄️ Configuration de la Base de Données

### Option 1: NAS PostgreSQL (Recommandé)

Utilisez le PostgreSQL du NAS Synology sur le port 5433.

#### 1. Créer une nouvelle database

```bash
# Sur le NAS
ssh thibaut@192.168.1.4

# Ou en Docker
docker exec nas-postgres psql -U thibaut -d main -c "CREATE DATABASE file_share;"

# Ou via psql local avec tunnel SSH
PGPASSWORD='Nv8kL2mQxpR4wZj7Bc9Yd' /opt/homebrew/opt/libpq/bin/psql \
  -h 192.168.1.4 -p 5433 -U thibaut \
  -c "CREATE DATABASE file_share;"
```

#### 2. Copier et remplir le .env

```bash
cp .env.example .env
```

Remplissez avec:
```env
DATABASE_URL=postgresql://thibaut:Nv8kL2mQxpR4wZj7Bc9Yd@192.168.1.4:5433/file_share
STORAGE_TYPE=nas
NAS_UPLOAD_PATH=/volume1/docker/file-share/uploads
NEXT_PUBLIC_APP_URL=https://file-share.yourdomain.com
CRON_SECRET=generate-random-secret-here
```

#### 3. Créer le dossier de stockage sur le NAS

```bash
ssh thibaut@192.168.1.4 mkdir -p /volume1/docker/file-share/uploads
```

### Option 2: Supabase Cloud

Si vous préférez Supabase:

```env
DATABASE_URL=postgresql://user:password@host:port/database
STORAGE_TYPE=nas
NAS_UPLOAD_PATH=/volume1/docker/file-share/uploads
```

## 🚀 Installation et Déploiement Local

```bash
# Installer les dépendances
npm install

# Exécuter les migrations
npm run migrate

# Démarrer le serveur de développement
npm run dev
```

L'app sera disponible sur `http://localhost:3000`

## 📦 Déploiement sur Vercel

### 1. Préparer le projet

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Créer le projet sur Vercel

```bash
npm install -g vercel
vercel
```

Suivez les instructions.

### 3. Configurer les variables d'environnement

Dans le dashboard Vercel:
- Settings → Environment Variables

Ajoutez:
```
DATABASE_URL=postgresql://...
STORAGE_TYPE=nas
NAS_UPLOAD_PATH=/volume1/docker/file-share/uploads
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=your-secret-key
```

### 4. Configurer le Custom Domain (optionnel)

Si vous avez un domaine personnalisé, allez dans Settings → Domains

## ⚙️ Configuration du Cleanup Automatique

### Option 1: Cron Vercel (Recommandé)

Vercel supporte les cron jobs via `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cleanup",
    "schedule": "0 2 * * *"
  }]
}
```

Le fichier `vercel.json` est déjà inclus.

### Option 2: External Cron Service

Utilisez un service comme EasyCron ou similaire:

```
URL: https://your-app.vercel.app/api/cleanup
Method: POST
Header: x-cron-secret: <YOUR_CRON_SECRET>
Schedule: Every 24 hours
```

### Option 3: Node-Cron Local (Dev)

```bash
# Dans scripts/cron-daemon.js
const cron = require('node-cron')
const fetch = require('node-fetch')

cron.schedule('0 2 * * *', async () => {
  const secret = process.env.CRON_SECRET
  await fetch('http://localhost:3000/api/cleanup', {
    method: 'POST',
    headers: { 'x-cron-secret': secret }
  })
})
```

## 📝 Commandes Utiles

```bash
# Migration DB
npm run migrate

# Cleanup manuel
npm run cleanup

# Build production
npm run build

# Start production
npm run start

# Développement
npm run dev
```

## 🔒 Sécurité

- Changez `CRON_SECRET` à une valeur aléatoire forte
- Utilisez HTTPS en production
- Les fichiers sont supprimés après 24h automatiquement
- Les mots de passe sont hashés avec bcryptjs
- Vérifiez les permissions du dossier NAS

## 📊 Monitoring

### Vérifier les fichiers actifs

```bash
PGPASSWORD='...' psql -h 192.168.1.4 -p 5433 -U thibaut -d file_share \
  -c "SELECT filename, size, created_at, expires_at FROM shared_files WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 10;"
```

### Voir l'usage disque

```bash
ssh thibaut@192.168.1.4 du -sh /volume1/docker/file-share/uploads
```

## 🐛 Troubleshooting

### "Database connection refused"

- Vérifiez que PostgreSQL est running: `docker ps | grep postgres`
- Testez la connexion: `psql -h 192.168.1.4 -p 5433 -U thibaut`

### "File not found in storage"

- Vérifiez `NAS_UPLOAD_PATH` est correct
- Vérifiez les permissions du dossier

### "Upload fails with 413"

- Le fichier dépasse 100MB
- Augmentez `maxBodySize` dans next.config.js si nécessaire

```js
// next.config.js
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}
```

## 📞 Support

Pour toute question, consultez:
- Next.js docs: https://nextjs.org/docs
- PostgreSQL docs: https://www.postgresql.org/docs/
- Vercel docs: https://vercel.com/docs
