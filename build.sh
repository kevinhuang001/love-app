#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting build process..."

# 1. Build Frontend
echo "📦 Building frontend..."
npm run build:ci

# 2. Clean up previous build
echo "🧹 Cleaning up old build..."
rm -rf dist-pack love-app-deploy.zip
mkdir -p dist-pack/uploads
mkdir -p dist-pack/public

# 3. Copy Backend Files
echo "📂 Copying backend files..."
cp server/index.js dist-pack/
cp server/app.js dist-pack/
cp server/models.js dist-pack/
cp server/package.json dist-pack/
cp server/seed.js dist-pack/
cp -r server/controllers dist-pack/
cp -r server/middleware dist-pack/
cp -r server/routes dist-pack/

# 4. Create Default Users (Fresh Database)
echo "👤 Creating fresh database with default users..."
# Temporary move existing local db to avoid including local data in build
if [ -f server/database.sqlite ]; then
    mv server/database.sqlite server/database.sqlite.tmp_bak
fi

# Run seed script to create a clean database.sqlite in server/
node server/seed.js

# Copy the fresh database to dist-pack
cp server/database.sqlite dist-pack/

# Remove the fresh database from server/ and restore the original local db
rm server/database.sqlite
if [ -f server/database.sqlite.tmp_bak ]; then
    mv server/database.sqlite.tmp_bak server/database.sqlite
fi

# 5. Copy Frontend Build
echo "📂 Copying frontend assets..."
cp -r dist/* dist-pack/public/

# 6. Create Deployment Instructions
echo "📝 Creating README..."
echo "Deployment Instructions:

1. Upload love-app-deploy.zip to your server.
2. Unzip it: unzip -o love-app-deploy.zip
3. Go to the folder: cd dist-pack
4. Install dependencies: npm install
5. Start the server: node index.js
   (Or use PM2: pm2 start index.js --name love-app)

Note: The server runs on port 3000 by default.
" > dist-pack/README.txt

# 7. Zip everything (excluding node_modules and existing uploads)
echo "🤐 Zipping package..."
zip -r love-app-deploy.zip dist-pack -x "dist-pack/node_modules/*" "dist-pack/uploads/*"

echo "✅ Build complete! 'love-app-deploy.zip' is ready for deployment."
