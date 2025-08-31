import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateTemporaryStatus() {
  try {
    console.log('🔄 Starting migration of TEMPORARY status bookings...');
    
    // Find all bookings with TEMPORARY status
    const temporaryBookings = await prisma.$queryRaw`
      SELECT id, status FROM bookings 
      WHERE status = 'TEMPORARY'
    `;
    
    console.log(`Found ${Array.isArray(temporaryBookings) ? temporaryBookings.length : 0} bookings with TEMPORARY status`);
    
    if (Array.isArray(temporaryBookings) && temporaryBookings.length > 0) {
      // Update all TEMPORARY bookings to PENDING status
      const updateResult = await prisma.$executeRaw`
        UPDATE bookings 
        SET status = 'PENDING', "updatedAt" = NOW()
        WHERE status = 'TEMPORARY'
      `;
      
      console.log(`✅ Successfully updated ${updateResult} bookings from TEMPORARY to PENDING status`);
    }
    
    console.log('✅ Migration completed successfully');
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
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateTemporaryStatus };
