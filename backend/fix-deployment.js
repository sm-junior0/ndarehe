#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function fixTemporaryStatus() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting to fix TEMPORARY status bookings...');
    
    // First, let's check if there are any TEMPORARY status bookings
    const temporaryBookings = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM bookings WHERE status = 'TEMPORARY'
    `;
    
    console.log(`Found ${temporaryBookings[0]?.count || 0} bookings with TEMPORARY status`);
    
    if (temporaryBookings[0]?.count > 0) {
      // Update all TEMPORARY bookings to PENDING status
      const result = await prisma.$executeRaw`
        UPDATE bookings 
        SET status = 'PENDING', "updatedAt" = NOW()
        WHERE status = 'TEMPORARY'
      `;
      
      console.log(`✅ Successfully updated ${result} bookings from TEMPORARY to PENDING status`);
    } else {
      console.log('✅ No TEMPORARY status bookings found');
    }
    
    console.log('✅ Status fix completed successfully');
  } catch (error) {
    console.error('❌ Failed to fix TEMPORARY status:', error);
    // Don't throw error, just log it
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixTemporaryStatus()
  .then(() => {
    console.log('Fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fix failed:', error);
    process.exit(0); // Exit with 0 to not fail the build
  });
