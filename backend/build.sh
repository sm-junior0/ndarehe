#!/bin/bash

echo "🚀 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push database schema with accept-data-loss flag
echo "🗄️  Pushing database schema..."
npx prisma db push --accept-data-loss

echo "✅ Build completed successfully!"
