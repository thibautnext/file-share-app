#!/usr/bin/env node

/**
 * Validation script to check if all required files are in place
 * Run: node validate.js
 */

const fs = require('fs')
const path = require('path')

const requiredFiles = [
  // Config files
  'package.json',
  'next.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'vercel.json',
  '.env.example',
  '.gitignore',

  // App files
  'src/app/layout.js',
  'src/app/page.js',
  'src/app/globals.css',
  'src/app/upload/[fileId]/page.js',

  // API routes
  'src/app/api/upload/route.js',
  'src/app/api/file/[fileId]/route.js',
  'src/app/api/download/[fileId]/route.js',
  'src/app/api/cleanup/route.js',

  // Components
  'src/components/UploadZone.js',
  'src/components/UploadProgress.js',
  'src/components/FileDetails.js',
  'src/components/PasswordPrompt.js',

  // Libraries
  'src/lib/db.js',

  // Scripts
  'scripts/migrate.js',
  'scripts/cleanup.js',

  // Documentation
  'README.md',
  'QUICKSTART.md',
  'SETUP.md',
  'DEPLOYMENT.md',
  'ARCHITECTURE.md',
  'BUILD_SUMMARY.md',
]

console.log('🔍 Validating FileShare structure...\n')

let missing = 0
let present = 0

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`)
    present++
  } else {
    console.log(`❌ MISSING: ${file}`)
    missing++
  }
})

console.log(`\n📊 Results: ${present}/${requiredFiles.length} files present`)

if (missing === 0) {
  console.log('✨ All required files are present! Ready to deploy.\n')
  console.log('📝 Next steps:')
  console.log('  1. npm install')
  console.log('  2. cp .env.example .env (then edit)')
  console.log('  3. npm run migrate')
  console.log('  4. npm run dev')
  process.exit(0)
} else {
  console.log(`\n⚠️  ${missing} files are missing. Please review.`)
  process.exit(1)
}
