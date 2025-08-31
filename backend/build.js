#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting safe build process...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Run safe migration to convert TEMPORARY to PENDING
  console.log('🔄 Running safe migration...');
  execSync('node safe-migration.js', { stdio: 'inherit' });

  // Now remove TEMPORARY from schema and push
  console.log('🗄️  Updating schema and pushing to database...');
  
  // Remove TEMPORARY from schema
  const fs = require('fs');
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  let schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Remove TEMPORARY from BookingStatus enum
  schema = schema.replace(/^\s*TEMPORARY\s*$/gm, '');
  
  // Write updated schema
  fs.writeFileSync(schemaPath, schema);
  console.log('✅ Schema updated: TEMPORARY status removed');

  // Generate Prisma client again with updated schema
  console.log('🔧 Regenerating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Push the updated schema (should work now without data loss warnings)
  console.log('🗄️  Pushing updated schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ Build completed successfully with no data loss!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
