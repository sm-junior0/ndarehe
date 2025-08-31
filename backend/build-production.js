#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Starting production build process...');

try {
  // Step 1: Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Step 2: Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Step 3: Build TypeScript (with memory optimization)
  console.log('🔨 Building TypeScript...');
  execSync('npx tsc --max-old-space-size=2048', { stdio: 'inherit' });

  // Step 4: Verify build output
  console.log('🔍 Verifying build output...');
  const fs = require('fs');
  if (!fs.existsSync('dist/server.js')) {
    throw new Error('Build failed: dist/server.js not found');
  }
  console.log('✅ Build output verified');

  // Step 5: Push database schema (optional - don't fail build if this fails)
  console.log('🗄️  Pushing database schema...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database schema updated');
  } catch (dbError) {
    console.warn('⚠️  Database schema update failed (continuing):', dbError.message);
  }

  console.log('✅ Production build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
