# FileShare - Guide de Déploiement Vercel

## 🚀 Déploiement en 10 minutes

### Étape 1: Préparer le Git

```bash
cd /Users/thibaut/clawd/file-share-app
git init
git add .
git commit -m "Initial commit: FileShare MVP"
git remote add origin https://github.com/YOUR_USERNAME/file-share-app.git
git push -u origin main
```

### Étape 2: Configurer la Base de Données

**Sur le NAS:**

```bash
ssh thibaut@192.168.1.4

# Créer la database
docker exec nas-postgres psql -U thibaut -d main -c "CREATE DATABASE file_share;"

# Créer le dossier uploads
mkdir -p /volume1/docker/file-share/uploads
chmod 755 /volume1/docker/file-share/uploads
```

### Étape 3: Déployer sur Vercel

#### Option A: Via CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Lors du déploiement:
- Project name: `file-share-app`
- Framework: Next.js
- Root directory: `.`
- Build command: `npm run build`
- Output directory: `.next`

#### Option B: Via GitHub (Recommandé)

1. Push le repo sur GitHub
2. Allez à https://vercel.com/new
3. Connectez votre repo GitHub
4. Vercel détecte automatiquement Next.js
5. Cliquez "Deploy"

### Étape 4: Configurer les Environment Variables

Dans le dashboard Vercel:
1. Settings → Environment Variables
2. Ajoutez ces variables:

```env
DATABASE_URL=postgresql://thibaut:Nv8kL2mQxpR4wZj7Bc9Yd@192.168.1.4:5433/file_share
STORAGE_TYPE=nas
NAS_UPLOAD_PATH=/volume1/docker/file-share/uploads
NEXT_PUBLIC_APP_URL=https://your-deployment-url.vercel.app
CRON_SECRET=abc123def456ghi789jkl (générez une clé aléatoire)
```

Pour générer `CRON_SECRET`:
```bash
openssl rand -hex 32
```

### Étape 5: Exécuter les Migrations

Après le premier déploiement, vous devez créer les tables:

```bash
# Option A: Via SSH Vercel
vercel env pull
npm run migrate

# Option B: Directement sur le NAS
ssh thibaut@192.168.1.4
cd /path/to/file-share-app
npm run migrate
```

### Étape 6: Vérifier le Déploiement

```bash
# Vérifiez que le site est actif
curl https://your-app.vercel.app

# Testez l'upload
curl -F "file=@test.pdf" https://your-app.vercel.app/api/upload

# Vérifiez la cron
curl -X POST https://your-app.vercel.app/api/cleanup \
  -H "x-cron-secret: your-secret"
```

## 🌐 Custom Domain (Optionnel)

1. Dashboard Vercel → Settings → Domains
2. Ajoutez votre domaine: `file-share.yourdomain.com`
3. Configurez les DNS records:
   ```
   CNAME file-share.yourdomain.com → cname.vercel.com
   ```
4. Vercel auto-configure HTTPS

## ⚙️ Configuration Post-Déploiement

### Configurer le Cron Job

Vercel supporte nativement les cron jobs via `vercel.json` (déjà inclus):

```json
{
  "crons": [{
    "path": "/api/cleanup",
    "schedule": "0 2 * * *"
  }]
}
```

Cela exécute `/api/cleanup` chaque jour à 2h du matin (UTC).

Pour changer l'heure:
- `0 2 * * *` = 2h du matin
- `0 14 * * *` = 2h de l'après-midi
- `0 */6 * * *` = Toutes les 6h

Consultez: https://crontab.guru/

### Monitoring

#### Via Vercel Dashboard
- Settings → Usage
- Analytics → Functions
- Logs → Runtime logs

#### SQL pour vérifier les fichiers

```bash
PGPASSWORD='Nv8kL2mQxpR4wZj7Bc9Yd' psql \
  -h 192.168.1.4 -p 5433 -U thibaut -d file_share \
  -c "SELECT filename, size, expires_at, deleted_at FROM shared_files ORDER BY created_at DESC LIMIT 20;"
```

#### Usage disque NAS

```bash
ssh thibaut@192.168.1.4 du -sh /volume1/docker/file-share/uploads
```

## 🔄 Updates & Maintenance

### Mettre à jour l'app

```bash
# Apportez vos changements
git add .
git commit -m "Feature: add new functionality"
git push

# Vercel redéploie automatiquement
# (si connecté via GitHub)
```

### Database Migrations (futures)

```bash
# Localement
npm run migrate

# Ou manuellement via NAS
ssh thibaut@192.168.1.4
docker exec nas-postgres psql -U thibaut -d file_share -c "ALTER TABLE shared_files ADD COLUMN new_column TEXT;"
```

### Cleanup manuel des vieux fichiers

```bash
# Supprimer tous les fichiers supprimés depuis > 7 jours
PGPASSWORD='...' psql -h 192.168.1.4 -p 5433 -U thibaut -d file_share \
  -c "DELETE FROM shared_files WHERE deleted_at < NOW() - INTERVAL '7 days';"
```

## 🆘 Troubleshooting

### App déploie mais database ne se connecte pas

**Symptôme**: 500 errors sur l'upload

**Cause**: DATABASE_URL incorrecte ou PostgreSQL non accessible depuis Vercel

**Solution**:
1. Vérifiez que PostgreSQL écoute sur le port 5433:
   ```bash
   ssh thibaut@192.168.1.4
   netstat -tlnp | grep 5432
   ```

2. Si utilisant un tunnel SSH, ajustez CONNECTION_URL:
   ```bash
   # Utilisez Supabase à la place (plus facile)
   DATABASE_URL=postgresql://user:pwd@db.supabase.co:5432/postgres
   ```

### Files ne se suppriment pas

**Symptôme**: Fichiers restent après 24h

**Cause**: Cron job ne s'exécute pas

**Solution**:
1. Vérifiez dans Vercel: Settings → Crons
2. Vérifiez les logs: Deployments → Runtime Logs
3. Déclenchez manuellement:
   ```bash
   curl -X POST https://your-app.vercel.app/api/cleanup \
     -H "x-cron-secret: your-secret"
   ```

### "File not found in storage"

**Cause**: NAS path inexistant

**Solution**:
```bash
ssh thibaut@192.168.1.4
ls -la /volume1/docker/file-share/uploads
chmod 755 /volume1/docker/file-share/uploads
```

### Uploads lents

**Cause**: Vercel fonction timeout (10s) ou NAS lent

**Solution**:
1. Vérifiez la vitesse NAS:
   ```bash
   ssh thibaut@192.168.1.4
   dd if=/dev/zero of=/volume1/test bs=1M count=100
   ```

2. Augmentez le timeout dans next.config.js:
   ```js
   const nextConfig = {
     api: {
       bodyParser: {
         sizeLimit: '100mb',
       },
       responseLimit: '100mb',
     },
     maxDuration: 60, // 60 secondes
   }
   ```

## 📊 Monitoring en Production

### Log des erreurs

```bash
# Via Vercel CLI
vercel logs

# Ou dans le dashboard
# Deployments → [Latest] → Logs
```

### Alertes

Configurez des alertes Vercel pour:
- Erreurs 5xx
- Fonction timeout
- Usage élevé

## 🚨 Disaster Recovery

### Backup des fichiers

```bash
# Backupez /volume1/docker/file-share/uploads régulièrement
ssh thibaut@192.168.1.4
rsync -av /volume1/docker/file-share/uploads /volume2/backup/

# Ou vers un disque externe
rsync -av /volume1/docker/file-share/uploads /mnt/external/backup/
```

### Restore files

```bash
# Si vous avez un backup
rsync -av /volume2/backup/uploads /volume1/docker/file-share/
```

## 📈 Scaling Pour le Futur

### Si beaucoup d'uploads

1. **Vercel Blob** pour stockage distribué
   - Remplacez NAS_UPLOAD_PATH par Blob
   - Voir `/api/upload` (commenté)

2. **Supabase** pour database gérée
   - Plus de scalabilité que NAS PostgreSQL
   - Backup automatique

3. **Vercel Edge Functions**
   - Plus rapide que les routines API standards
   - Réduire latence

## 📞 Support & Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Besoin d'aide?** Ouvrez un issue ou consultez les logs Vercel.
