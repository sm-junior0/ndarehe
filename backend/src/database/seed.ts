import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ndarehe.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@ndarehe.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJ5qKqC', // admin123
      role: 'ADMIN',
      isVerified: true,
      isActive: true
    }
  });

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'user@ndarehe.com' },
    update: {},
    create: {
      firstName: 'Test',
      lastName: 'User',
      email: 'user@ndarehe.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJ5qKqC', // user123
      role: 'USER',
      isVerified: true,
      isActive: true
    }
  });

  // Create locations
  const kigali = await prisma.location.upsert({
    where: { name: 'Kigali' },
    update: {},
    create: {
      name: 'Kigali',
      type: 'CITY',
      address: 'Kigali, Rwanda',
      city: 'Kigali',
      district: 'Kigali',
      province: 'Kigali',
      country: 'Rwanda',
      latitude: -1.9441,
      longitude: 30.0619,
      isActive: true
    }
  });

  const musanze = await prisma.location.upsert({
    where: { name: 'Musanze' },
    update: {},
    create: {
      name: 'Musanze',
      type: 'CITY',
      address: 'Musanze District, Northern Province, Rwanda',
      city: 'Musanze',
      district: 'Musanze',
      province: 'Northern Province',
      country: 'Rwanda',
      latitude: -1.4998,
      longitude: 29.2608,
      isActive: true
    }
  });

  const rubavu = await prisma.location.upsert({
    where: { name: 'Rubavu' },
    update: {},
    create: {
      name: 'Rubavu',
      type: 'CITY',
      address: 'Rubavu District, Western Province, Rwanda',
      city: 'Rubavu',
      district: 'Rubavu',
      province: 'Western Province',
      country: 'Rwanda',
      latitude: -1.6869,
      longitude: 29.3714,
      isActive: true
    }
  });

  // Create accommodations
  const hotel1 = await prisma.accommodation.upsert({
    where: { name: 'Kigali Serena Hotel' },
    update: {},
    create: {
      name: 'Kigali Serena Hotel',
      description: 'Luxury hotel in the heart of Kigali with stunning city views and world-class amenities.',
      type: 'HOTEL',
      category: 'LUXURY',
      locationId: kigali.id,
      address: 'KN 3 Ave, Kigali, Rwanda',
      phone: '+250 252 596 000',
      email: 'reservations.kigali@serena.com',
      website: 'https://www.serenahotels.com',
      pricePerNight: 250000,
      currency: 'RWF',
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 2,
      amenities: ['Wi-Fi', 'Swimming Pool', 'Spa', 'Restaurant', 'Gym', 'Air Conditioning'],
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
      ],
      isAvailable: true,
      isVerified: true
    }
  });

  const hotel2 = await prisma.accommodation.upsert({
    where: { name: 'Gorilla View Lodge' },
    update: {},
    create: {
      name: 'Gorilla View Lodge',
      description: 'Beautiful lodge near Volcanoes National Park with stunning mountain views.',
      type: 'HOTEL',
      category: 'PREMIUM',
      locationId: musanze.id,
      address: 'Musanze District, Northern Province, Rwanda',
      phone: '+250 788 123 456',
      email: 'info@gorillaviewlodge.com',
      website: 'https://www.gorillaviewlodge.com',
      pricePerNight: 180000,
      currency: 'RWF',
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      amenities: ['Wi-Fi', 'Restaurant', 'Bar', 'Garden', 'Mountain View', 'Fireplace'],
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
      ],
      isAvailable: true,
      isVerified: true
    }
  });

  const guesthouse = await prisma.accommodation.upsert({
    where: { name: 'Lake Kivu Guesthouse' },
    update: {},
    create: {
      name: 'Lake Kivu Guesthouse',
      description: 'Cozy guesthouse with beautiful lake views and authentic Rwandan hospitality.',
      type: 'GUESTHOUSE',
      category: 'STANDARD',
      locationId: rubavu.id,
      address: 'Rubavu District, Western Province, Rwanda',
      phone: '+250 789 987 654',
      email: 'hello@lakekivuguesthouse.com',
      pricePerNight: 45000,
      currency: 'RWF',
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: ['Wi-Fi', 'Breakfast', 'Lake View', 'Garden', 'Kitchen'],
      images: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
      ],
      isAvailable: true,
      isVerified: true
    }
  });

  // Create transportation services
  const airportPickup = await prisma.transportation.upsert({
    where: { name: 'Kigali Airport Shuttle' },
    update: {},
    create: {
      name: 'Kigali Airport Shuttle',
      description: 'Reliable airport pickup and drop-off service with professional drivers.',
      type: 'AIRPORT_PICKUP',
      vehicleType: 'STANDARD',
      locationId: kigali.id,
      capacity: 4,
      pricePerTrip: 25000,
      currency: 'RWF',
      amenities: ['Air Conditioning', 'Wi-Fi', 'Professional Driver', 'Meet & Greet'],
      images: [
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800'
      ],
      isAvailable: true,
      isVerified: true
    }
  });

  const cityTransport = await prisma.transportation.upsert({
    where: { name: 'Kigali City Tours Transport' },
    update: {},
    create: {
      name: 'Kigali City Tours Transport',
      description: 'Comfortable transportation for city tours and sightseeing.',
      type: 'CITY_TRANSPORT',
      vehicleType: 'VAN',
      locationId: kigali.id,
      capacity: 12,
      pricePerTrip: 50000,
      pricePerHour: 15000,
      currency: 'RWF',
      amenities: ['Air Conditioning', 'Wi-Fi', 'Tour Guide', 'Bottled Water'],
      images: [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800'
      ],
      isAvailable: true,
      isVerified: true
    }
  });

  // Create tours
  const cityTour = await prisma.tour.upsert({
    where: { name: 'Kigali City Tour' },
    update: {},
    create: {
      name: 'Kigali City Tour',
      description: 'Explore the beautiful city of Kigali with our expert guides.',
      type: 'CITY_TOUR',
      category: 'STANDARD',
      locationId: kigali.id,
      duration: 4,
      maxParticipants: 15,
      minParticipants: 2,
      pricePerPerson: 35000,
      currency: 'RWF',
      itinerary: [
        'Visit Kigali Genocide Memorial',
        'Explore Kimironko Market',
        'Visit Presidential Palace Museum',
        'Lunch at local restaurant',
        'City center walking tour'
      ],
      includes: ['Transportation', 'Professional Guide', 'Lunch', 'Entrance Fees'],
      excludes: ['Personal Expenses', 'Tips'],
      meetingPoint: 'Kigali Convention Centre',
      startTime: '09:00',
      endTime: '13:00',
      images: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
      ],
      isAvailable: true,
      isVerified: true
    }
  });

  const culturalTour = await prisma.tour.upsert({
    where: { name: 'Rwandan Cultural Experience' },
    update: {},
    create: {
      name: 'Rwandan Cultural Experience',
      description: 'Immerse yourself in Rwandan culture with traditional dance and local experiences.',
      type: 'CULTURAL_TOUR',
      category: 'PREMIUM',
      locationId: musanze.id,
      duration: 6,
      maxParticipants: 10,
      minParticipants: 2,
      pricePerPerson: 75000,
      currency: 'RWF',
      itinerary: [
        'Traditional dance performance',
        'Local craft workshop',
        'Traditional lunch',
        'Village visit',
        'Storytelling session'
      ],
      includes: ['Transportation', 'Cultural Guide', 'Traditional Lunch', 'Dance Performance'],
      excludes: ['Personal Expenses', 'Tips'],
      meetingPoint: 'Musanze Cultural Center',
      startTime: '10:00',
      endTime: '16:00',
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
      ],
      isAvailable: true,
      isVerified: true
    }
  });

  const adventureTour = await prisma.tour.upsert({
    where: { name: 'Lake Kivu Adventure' },
    update: {},
    create: {
      name: 'Lake Kivu Adventure',
      description: 'Exciting adventure activities around beautiful Lake Kivu.',
      type: 'ADVENTURE_TOUR',
      category: 'STANDARD',
      locationId: rubavu.id,
      duration: 8,
      maxParticipants: 8,
      minParticipants: 2,
      pricePerPerson: 60000,
      currency: 'RWF',
      itinerary: [
        'Kayaking on Lake Kivu',
        'Hiking to viewpoints',
        'Beach activities',
        'Sunset boat ride',
        'Local dinner'
      ],
      includes: ['Equipment', 'Professional Guide', 'Dinner', 'Safety Gear'],
      excludes: ['Personal Expenses', 'Tips'],
      meetingPoint: 'Lake Kivu Beach Resort',
      startTime: '08:00',
      endTime: '16:00',
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
      ],
      isAvailable: true,
      isVerified: true
    }
  });

  // Create system settings
  await prisma.systemSetting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: {
      key: 'site_name',
      value: 'NDAREHE.COM',
      description: 'Website name'
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'site_description' },
    update: {},
    create: {
      key: 'site_description',
      value: 'Accommodation and Local Experience Booking Platform',
      description: 'Website description'
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'contact_email' },
    update: {},
    create: {
      key: 'contact_email',
      value: 'contact@ndarehe.com',
      description: 'Contact email address'
    }
  });

  await prisma.systemSetting.upsert({
    where: { key: 'contact_phone' },
    update: {},
    create: {
      key: 'contact_phone',
      value: '+250 788 123 456',
      description: 'Contact phone number'
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@ndarehe.com / admin123');
  console.log('👤 Test user: user@ndarehe.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 