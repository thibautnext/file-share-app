# FileShare - Architecture Technique

## 🏗️ Vue d'ensemble

FileShare est une application Next.js 14 minimaliste pour le partage de fichiers temporaires. Elle suit une architecture classique request-response avec un storage décentralisé.

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─→ GET  /                    (Upload page)
       ├─→ POST /api/upload          (File + metadata)
       ├─→ GET  /upload/[id]         (Download page)
       ├─→ GET  /api/file/[id]       (File info)
       ├─→ POST /api/file/[id]       (Password check)
       └─→ GET  /api/download/[id]   (Binary download)
       
┌─────────────────────┐
│   Vercel Edge       │
│  ┌───────────────┐  │
│  │  Next.js 14   │  │
│  │  - App Router │  │
│  │  - API Routes │  │
│  └───────────────┘  │
└────────┬────────────┘
         │
    ┌────┴──────┬────────────┐
    │            │            │
    ▼            ▼            ▼
 ┌──────┐  ┌──────────┐  ┌─────────────┐
 │ NAS  │  │PostgreSQL│  │Vercel Cron  │
 │Files │  │ Metadata │  │  (cleanup)  │
 └──────┘  └──────────┘  └─────────────┘
```

## 📊 Flux de données

### 1. Upload

```
Client                Backend              Storage        Database
  │                     │                    │              │
  ├─ POST /api/upload─→ │                    │              │
  │  - file (stream)    │                    │              │
  │  - password (opt)   │                    │              │
  │                     ├─ Generate fileId   │              │
  │                     ├─ Hash password     │              │
  │                     ├─ Save file────────→│              │
  │                     ├─ Insert metadata──────────────────→│
  │                     ├─ 200 OK            │              │
  │←────────────────────┤                    │              │
  │  fileId, expiresAt  │                    │              │
  │                     │                    │              │
```

### 2. Download (Password Protected)

```
Client           Backend          Database      Storage
  │                │                 │            │
  ├─ GET /upload/[id]─→              │            │
  │                 ├─ Fetch metadata───────────→│
  │                 │←─ id, filename, protected──│
  │←─ Download page─┤                │            │
  │  (Password form)│                │            │
  │                 │                │            │
  ├─ POST /api/file/[id]─→           │            │
  │  password      │                 │            │
  │                 ├─ Fetch password_hash───────→│
  │                 ├─ bcrypt.compare()           │
  │                 ├─ 200 (if match)            │
  │←─────────────────┤                │            │
  │                 │                │            │
  ├─ GET /api/download/[id]─→        │            │
  │                 ├─ Increment download_count─→│
  │                 ├─ Read file────────────────→│
  │                 ├─ Stream response           │
  │←─ Binary data───┤                │            │
  │  (file.ext)    │                │            │
```

### 3. Auto-Cleanup (Cron)

```
Vercel Scheduler    API              Database      Storage
  │                 │                   │            │
  ├─ Trigger /api/cleanup at 2am        │            │
  │                 │                   │            │
  │                 ├─ SELECT expired files────────→│
  │                 │←─ List of expired files       │
  │                 │                   │            │
  │                 ├─ FOR each file:    │            │
  │                 │  - DELETE from FS─────────────→│
  │                 │  - UPDATE deleted_at────────→│
  │                 │                   │            │
  │                 ├─ 200 OK            │            │
  │←─────────────────┤                   │            │
```

## 🔑 Composants Clés

### Frontend

#### UploadZone
- Drag & drop interface
- Valide taille fichier (100MB max)
- Affiche progression upload

#### PasswordPrompt
- Formulaire password pour fichiers protégés
- Gère erreur "Invalid password"

#### FileDetails
- Affiche info fichier
- Compte à rebours expiration
- Bouton download

### Backend

#### `/api/upload`
1. Valide taille fichier (413 si > 100MB)
2. Génère fileId unique (nanoid 12)
3. Hash password si présent (bcryptjs, salt: 10)
4. Sauvegarde fichier dans NAS
5. Insère metadata en DB
6. Retourne fileId + expiration

#### `/api/file/[id]`
GET:
1. Récupère metadata (si pas expiré)
2. Calcule temps restant
3. Retourne protected=true/false

POST:
1. Récupère password_hash de DB
2. Compare password avec bcrypt.compare()
3. Retourne metadata (si match)

#### `/api/download/[id]`
1. Vérifie file existe + pas expiré
2. Increment download_count
3. Lit fichier du NAS
4. Stream avec Content-Disposition: attachment

#### `/api/cleanup`
1. Vérifie x-cron-secret header
2. SELECT fichiers où expires_at <= NOW()
3. DELETE fichiers du NAS
4. UPDATE deleted_at = NOW()

## 📦 Data Models

### File Metadata (PostgreSQL)

```javascript
{
  id: "abc123xyz789",          // PRIMARY KEY, nanoid(12)
  filename: "document.pdf",     // Original filename
  size: 2097152,                // Bytes
  created_at: timestamp,        // Upload time
  expires_at: timestamp,        // = created_at + 24h
  password_hash: "$2a$10...",   // bcryptjs hash (null if no pwd)
  download_count: 0,            // Incremented on download
  downloaded_at: timestamp,     // Last download time
  deleted_at: null,             // Set by cleanup cron
  created_ip: "203.0.113.5",   // For analytics (optional)
  user_agent: "Mozilla/5.0..." // For analytics (optional)
}
```

### Request/Response

Upload Response:
```json
{
  "fileId": "abc123xyz789",
  "filename": "document.pdf",
  "size": 2097152,
  "protected": true,
  "downloadUrl": "/upload/abc123xyz789",
  "expiresAt": "2024-03-13T08:00:00.000Z"
}
```

File Info Response:
```json
{
  "id": "abc123xyz789",
  "filename": "document.pdf",
  "size": 2097152,
  "protected": true,
  "expiresAt": "2024-03-13T08:00:00.000Z",
  "timeRemaining": "23h 45m",
  "createdAt": "2024-03-12T08:15:00.000Z"
}
```

## 🔒 Sécurité Détaillée

### Authentication
- ❌ Pas d'auth utilisateur (design volontaire)
- ✅ File ID uniques (nanoid: 74 bits entropy)
- ✅ URLs non devinable (format `/upload/[random]`)

### File Protection
- ✅ Passwords hashés: bcryptjs salt 10 (2^10 rounds)
- ✅ Time constant comparison (bcrypt.compare)
- ✅ 401 error (pas de hints sur password)

### Storage Security
- ✅ Fichiers stockés par ID (pas de noms originaux en FS)
- ✅ Suppression après 24h garantie par cron
- ✅ Isolation fichiers (pas d'accès cross-fileId)

### API Security
- ✅ Cron protégé par secret header
- ✅ POST /api/file validée (password required)
- ✅ Pas de leak d'infos (404 si expired)
- ✅ Rate limiting via Vercel (optional)

### Transport
- ✅ HTTPS automatique (Vercel)
- ✅ No secrets in URL query strings
- ✅ Passwords jamais loggées

## ⚡ Performance

### Optimisations

1. **Connection Pooling**
   - Pool PostgreSQL: max 20 connections
   - Réuse connections across requests
   - Idle timeout: 30s

2. **Streaming Upload**
   - FormData parsed as stream
   - Fichier écrit au disque incrementally
   - Pas de stockage en RAM

3. **Streaming Download**
   - readFile() + pipe to response
   - Pas de load full file en mémoire

4. **Database Indexes**
   ```sql
   CREATE INDEX idx_expires_at ON shared_files(expires_at)
   CREATE INDEX idx_created_at ON shared_files(created_at)
   ```

5. **Cron Job Batching**
   - Cleanup 1000 files per run
   - Pas de timeout risk

### Estimations de Performance

- Upload 100MB: ~5-10s (dépend réseau)
- Download 100MB: ~5-10s (dépend réseau)
- Cleanup 1000 files: ~30s
- API response: <100ms (P95)

## 🧪 Testing

### Manual Testing

```bash
# 1. Upload file sans password
curl -F "file=@test.pdf" http://localhost:3000/api/upload

# 2. Get file info
curl http://localhost:3000/api/file/[fileId]

# 3. Download
curl -O http://localhost:3000/api/download/[fileId]
```

### Load Testing

```bash
# Avec Apache Bench
ab -n 100 -c 10 http://localhost:3000/

# Avec k6
k6 run load-test.js
```

## 🚀 Scaling Considerations

### Current Limits

- Max 100MB per file
- 24h expiration (fixed)
- PostgreSQL single instance
- NAS storage single location

### Scaling Path

1. **Horizontal**: Multi-region Vercel (auto)
2. **Storage**: Vercel Blob (distributed)
3. **Database**: Supabase Cloud (managed)
4. **Cache**: Redis for hot files (future)

## 📋 Checklist Déploiement

- [ ] Database migrations run
- [ ] NAS folder created with correct permissions
- [ ] Environment variables configured
- [ ] CRON_SECRET is strong random
- [ ] Cron job scheduled (Vercel)
- [ ] HTTPS enabled (Vercel auto)
- [ ] Error logging configured
- [ ] Backup strategy for NAS

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 413 Payload Too Large | File > 100MB | Augment limite si needed |
| ENOENT file not found | Bad NAS path | Check `NAS_UPLOAD_PATH` |
| DB connection refused | PostgreSQL down | Restart service |
| Files not deleted | Cron not running | Check Vercel cron logs |
| Password always wrong | Hash algo mismatch | Ensure bcryptjs 2.4.3+ |

---

**Architecture Simple = Maintainable = Fast to Deploy**
