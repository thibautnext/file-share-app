# FileShare 📁

Application web de partage sécurisé de fichiers avec suppression automatique après 24h.

## ✨ Fonctionnalités

- ✅ **Upload Drag & Drop** - Interface simple et intuitive
- ✅ **Fichiers jusqu'à 100MB** - Limites généreuses
- ✅ **Protection par mot de passe** - Optionnel mais disponible
- ✅ **Suppression automatique** - Après 24h (zéro maintenance)
- ✅ **Lien unique et privé** - Format `/upload/[fileId]`
- ✅ **Affichage temps restant** - Compte à rebours du reste
- ✅ **Téléchargement direct** - Pas de redirection
- ✅ **Design moderne** - Tailwind CSS

## 🚀 Quick Start

```bash
# 1. Installer
npm install

# 2. Configurer la base de données
cp .env.example .env
# Éditer .env avec vos paramètres

# 3. Migrer la DB
npm run migrate

# 4. Lancer le serveur
npm run dev
```

Accédez à `http://localhost:3000`

## 📚 Documentation Complète

- **[SETUP.md](./SETUP.md)** - Guide complet d'installation et déploiement
- **[Architecture](./ARCHITECTURE.md)** - Détails techniques (voir ci-dessous)

## 🏗️ Architecture

### Stack Technique

- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de données**: PostgreSQL (NAS ou cloud)
- **Stockage fichiers**: NAS (ou Vercel Blob optionnel)
- **Authentification**: Password hash avec bcryptjs
- **Cron**: Vercel Cron Jobs

### Structure du Projet

```
file-share-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── upload/          # POST upload
│   │   │   ├── download/[id]    # GET download
│   │   │   ├── file/[id]        # GET file info / POST password check
│   │   │   └── cleanup/         # CRON job
│   │   ├── upload/[fileId]/     # Download page
│   │   ├── layout.js             # Root layout
│   │   ├── page.js               # Upload page
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── UploadZone.js         # Drag & drop zone
│   │   ├── UploadProgress.js     # Upload indicator
│   │   ├── FileDetails.js        # File info + download
│   │   └── PasswordPrompt.js     # Password input
│   └── lib/
│       └── db.js                 # PostgreSQL connection pool
├── scripts/
│   ├── migrate.js                # DB migration
│   └── cleanup.js                # Manual cleanup
├── .env.example
├── package.json
├── next.config.js
├── tailwind.config.js
├── vercel.json                   # Cron config
└── README.md
```

## 🗄️ Schéma Base de Données

```sql
CREATE TABLE shared_files (
  id VARCHAR(12) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  password_hash VARCHAR(255),
  download_count INTEGER DEFAULT 0,
  downloaded_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_ip VARCHAR(45),
  user_agent TEXT
);
```

## 📡 API Endpoints

### Upload
```
POST /api/upload
Content-Type: multipart/form-data

body:
  - file: File (max 100MB)
  - password: string (optional)

response:
  {
    fileId: string,
    filename: string,
    size: number,
    protected: boolean,
    downloadUrl: string,
    expiresAt: ISO8601
  }
```

### Get File Info
```
GET /api/file/[fileId]

response:
  {
    id: string,
    filename: string,
    size: number,
    protected: boolean,
    timeRemaining: string,
    expiresAt: ISO8601
  }
```

### Verify Password
```
POST /api/file/[fileId]
Content-Type: application/json

body: { password: string }

response: Same as GET (if password correct)
Error 401: Invalid password
```

### Download
```
GET /api/download/[fileId]

response: Binary file + headers
  Content-Type: application/octet-stream
  Content-Disposition: attachment; filename="..."
```

### Cleanup (Cron)
```
POST /api/cleanup
Header: x-cron-secret: <secret>

response: { message, deletedCount }
```

## 🔐 Sécurité

- ✅ Passwords hashés avec bcryptjs (salt: 10)
- ✅ File IDs uniques avec nanoid (12 chars, 74 bits entropy)
- ✅ Expiration automatique après 24h
- ✅ Suppression fichier + DB record
- ✅ HTTPS en production (Vercel)
- ✅ Cron job sécurisé avec secret token

## 📈 Performance

- Streaming download (pas de stockage en RAM)
- Connection pooling PostgreSQL (max 20)
- Next.js Image Optimization (static assets)
- Compression automatique Vercel

## 💰 Coûts

- **Vercel**: Gratuit (tier hobby) → ~$20/mo (production)
- **PostgreSQL NAS**: Gratuit (sur infrastructure existante)
- **Bande passante**: Incluse Vercel (~100GB/mo gratuit)

## 📝 Roadmap

- [ ] Vercel Blob support
- [ ] Analytics dashboard
- [ ] Bulk upload
- [ ] Expiration custom (7j, 30j, etc.)
- [ ] Fichiers multiples zip

## 🤝 Contribution

Des questions ou bugs? Crée une issue ou un PR.

## 📄 Licence

MIT

---

**Made with ❤️ by Nova**
