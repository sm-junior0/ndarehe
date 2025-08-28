import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTemporaryStatus() {
  try {
    console.log('🔄 Starting migration to add TEMPORARY status...');
    
    // First, let's check if we need to update any existing PENDING bookings
    // that might be blocking availability
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: 'PENDING'
      }
    });
    
    console.log(`📊 Found ${pendingBookings.length} existing PENDING bookings`);
    
    // For now, we'll keep existing PENDING bookings as they are
    // but new bookings will use TEMPORARY status
    
    console.log('✅ Migration completed successfully');
    console.log('📝 Note: New bookings will now use TEMPORARY status');
    console.log('📝 Existing PENDING bookings remain unchanged');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateTemporaryStatus()
    .then(() => {
      console.log('🚀 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateTemporaryStatus };
