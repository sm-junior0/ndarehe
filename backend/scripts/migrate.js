const { execSync } = require('child_process');

console.log('🚀 Starting database migration...');

try {
  // First, try to generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Then try to push schema changes
  console.log('🗄️ Pushing database schema changes...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('✅ Database migration completed successfully!');
} catch (error) {
  console.error('❌ Database migration failed:', error.message);
  
  // If push fails, try to create a migration instead
  try {
    console.log('🔄 Attempting to create migration...');
    execSync('npx prisma migrate dev --name production-deploy --create-only', { stdio: 'inherit' });
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migration created and deployed successfully!');
  } catch (migrationError) {
    console.error('❌ Migration creation also failed:', migrationError.message);
    console.log('💡 Please check your database connection and schema changes.');
    process.exit(1);
  }
}
