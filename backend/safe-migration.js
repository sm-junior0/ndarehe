#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function safeMigration() {
  try {
    console.log('🔄 Starting safe migration process...');
    
    // Step 1: Check how many TEMPORARY status bookings exist
    const tempBookings = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "bookings" WHERE status = 'TEMPORARY'
    `;
    
    const count = tempBookings[0]?.count || 0;
    console.log(`📊 Found ${count} bookings with TEMPORARY status`);
    
    if (count > 0) {
      // Step 2: Safely convert TEMPORARY to PENDING
      console.log('🔄 Converting TEMPORARY status to PENDING...');
      
      const result = await prisma.$executeRaw`
        UPDATE "bookings" 
        SET status = 'PENDING', "updatedAt" = NOW()
        WHERE status = 'TEMPORARY'
      `;
      
      console.log(`✅ Successfully converted ${result} bookings from TEMPORARY to PENDING`);
      
      // Step 3: Verify the conversion
      const verifyCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "bookings" WHERE status = 'TEMPORARY'
      `;
      
      if (verifyCount[0]?.count === 0) {
        console.log('✅ Verification successful: No TEMPORARY status bookings remain');
      } else {
        console.log('⚠️  Warning: Some TEMPORARY status bookings still exist');
      }
    } else {
      console.log('✅ No TEMPORARY status bookings found - nothing to migrate');
    }
    
    console.log('✅ Safe migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
safeMigration()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
