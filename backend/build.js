#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Starting build process...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Run safe migration
  console.log('🔄 Running safe migration...');
  execSync('node safe-migration.js', { stdio: 'inherit' });

  // Update schema to remove TEMPORARY status
  console.log('📝 Updating schema...');
  const fs = require('fs');
  let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  
  // Remove TEMPORARY from BookingStatus enum
  schema = schema.replace(/^\s*TEMPORARY\s*$/gm, '');
  fs.writeFileSync('prisma/schema.prisma', schema);
  
  console.log('✅ Schema updated: TEMPORARY status removed');

  // Generate Prisma client with updated schema
  console.log('🔧 Regenerating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Push schema (should work now without warnings)
  console.log('🗄️  Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
