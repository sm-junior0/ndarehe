const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyUser() {
  try {
    // Update the user to be verified
    const user = await prisma.user.update({
      where: { email: 'test2@example.com' },
      data: { isVerified: true }
    });

    console.log('✅ User verified successfully:', {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified
    });
  } catch (error) {
    console.error('❌ Error verifying user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUser(); 