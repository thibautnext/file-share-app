# 🚀 FileShare - Quick Start (5 minutes)

**TL;DR**: App Next.js complète prête à déployer. Voici comment la lancer.

## 1️⃣ Installation (2 min)

```bash
cd /Users/thibaut/clawd/file-share-app

# Install packages
npm install
```

## 2️⃣ Configuration Database (2 min)

Créez la database sur le NAS:

```bash
# Via SSH sur NAS
ssh thibaut@192.168.1.4
docker exec nas-postgres psql -U thibaut -d main -c "CREATE DATABASE file_share;"
mkdir -p /volume1/docker/file-share/uploads
exit

# Ou en local avec psql
PGPASSWORD='Nv8kL2mQxpR4wZj7Bc9Yd' /opt/homebrew/opt/libpq/bin/psql \
  -h 192.168.1.4 -p 5433 -U thibaut \
  -c "CREATE DATABASE file_share;"
```

## 3️⃣ Setup .env (1 min)

```bash
cp .env.example .env

# Éditer avec:
cat > .env << 'EOF'
DATABASE_URL=postgresql://thibaut:Nv8kL2mQxpR4wZj7Bc9Yd@192.168.1.4:5433/file_share
STORAGE_TYPE=nas
NAS_UPLOAD_PATH=/volume1/docker/file-share/uploads
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=my-secret-key-123
EOF
```

## 4️⃣ Migrate Database (instant)

```bash
npm run migrate
```

Vous devez voir:
```
✅ Migrations completed successfully!
```

## 5️⃣ Start Dev Server

```bash
npm run dev
```

Allez à: **http://localhost:3000**

## ✅ Test

### Upload un fichier:
1. Allez à http://localhost:3000
2. Drag & drop un fichier (ou cliquez)
3. Optionnel: Cochez "Protéger avec mot de passe"
4. Cliquez "Submit"
5. Vous recevez un lien: `/upload/[fileId]`

### Download:
1. Allez au lien reçu
2. Si password: Entrez le mot de passe
3. Cliquez "Télécharger le fichier"
4. C'est fait! ✅

## 🌐 Déployer sur Vercel (5 min)

### Option A: Via GitHub (plus facile)

```bash
# Git setup
git init
git remote add origin https://github.com/YOUR_USERNAME/file-share.git
git add .
git commit -m "Initial"
git push -u origin main

# Allez sur https://vercel.com/new
# Sélectionnez votre repo
# Cliquez "Deploy"
```

### Option B: Via Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

### Config Variables en Production

Dans le dashboard Vercel (Settings → Environment Variables):

```
DATABASE_URL=postgresql://thibaut:Nv8kL2mQxpR4wZj7Bc9Yd@192.168.1.4:5433/file_share
STORAGE_TYPE=nas
NAS_UPLOAD_PATH=/volume1/docker/file-share/uploads
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
CRON_SECRET=strong-random-secret
```

### Après deploy:
```bash
# Exécutez les migrations
npm run migrate

# Testez
curl https://your-vercel-url.vercel.app
```

## 📂 Structure Simple

```
file-share-app/
├── src/app/              → Pages Next.js
├── src/app/api/          → API routes
├── src/components/       → Composants React
├── src/lib/              → Utilitaires (DB, etc)
├── scripts/              → Migration + cleanup
└── docs/                 → Documentation
```

## 🎯 What You Get

✅ Full file sharing app
✅ Drag & drop upload
✅ Optional password protection
✅ Auto-delete after 24h
✅ Clean responsive UI
✅ Production-ready code
✅ Complete documentation

## 🐛 If Something Fails

### "Database connection refused"
```bash
# Check PostgreSQL is running
ssh thibaut@192.168.1.4 docker ps | grep postgres

# Check DATABASE_URL is correct
cat .env | grep DATABASE_URL
```

### "Cannot find module 'next'"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "File not uploaded / ENOENT"
```bash
# Check NAS folder exists
ssh thibaut@192.168.1.4 ls -la /volume1/docker/file-share/uploads

# Check permissions
ssh thibaut@192.168.1.4 chmod 755 /volume1/docker/file-share/uploads
```

## 📚 More Info

- **README.md** - Features overview
- **SETUP.md** - Detailed setup guide
- **DEPLOYMENT.md** - Vercel deployment guide
- **ARCHITECTURE.md** - Technical deep dive

## 🚀 Next Steps

1. Test locally (`npm run dev`)
2. Deploy to Vercel
3. Configure custom domain (optional)
4. Share links!

---

**Questions?** Check the logs:
- Local: Console output
- Vercel: Settings → Logs

**Besoin d'aide?** Lis DEPLOYMENT.md ou TROUBLESHOOTING section dans SETUP.md
