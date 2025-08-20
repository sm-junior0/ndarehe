import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  // Add more comprehensive system settings
  await prisma.systemSetting.upsert({
    where: { key: 'backend_url' }, update: {}, create: { key: 'backend_url', value: 'http://localhost:5000', description: 'Backend API URL' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'frontend_url' }, update: {}, create: { key: 'frontend_url', value: 'http://localhost:5173', description: 'Frontend URL' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'email_from' }, update: {}, create: { key: 'email_from', value: 'noreply@ndarehe.com', description: 'Default sender email' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'language' }, update: {}, create: { key: 'language', value: 'en', description: 'Default language' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'timezone' }, update: {}, create: { key: 'timezone', value: 'Africa/Kigali', description: 'Default timezone' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'maintenance_mode' }, update: {}, create: { key: 'maintenance_mode', value: 'false', description: 'Maintenance mode status' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'sms_provider_enabled' }, update: {}, create: { key: 'sms_provider_enabled', value: 'false', description: 'SMS provider status' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'email_provider_enabled' }, update: {}, create: { key: 'email_provider_enabled', value: 'true', description: 'Email provider status' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'stripe_public_key' }, update: {}, create: { key: 'stripe_public_key', value: 'pk_test_...', description: 'Stripe public key' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'stripe_secret_key' }, update: {}, create: { key: 'stripe_secret_key', value: 'sk_test_...', description: 'Stripe secret key' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'twilio_sid' }, update: {}, create: { key: 'twilio_sid', value: 'AC...', description: 'Twilio SID' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'twilio_auth_token' }, update: {}, create: { key: 'twilio_auth_token', value: '...', description: 'Twilio auth token' }
  });
  await prisma.systemSetting.upsert({
    where: { key: 'twilio_from' }, update: {}, create: { key: 'twilio_from', value: '+1234567890', description: 'Twilio from number' }
  });

  // Add sample analytics data for testing
  console.log('🌐 Adding sample analytics data...');
  
  // Create sample users for analytics
  const sampleUsers: any[] = [];
  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.upsert({
      where: { email: `sample${i}@example.com` },
      update: {},
      create: {
        firstName: `Sample${i}`,
        lastName: `User${i}`,
        email: `sample${i}@example.com`,
        password: await bcrypt.hash('password123', 10),
        role: 'USER',
        isVerified: true,
        isActive: true,
        phone: `+25078${String(i).padStart(7, '0')}`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      }
    });
    sampleUsers.push(user);
  }

  // Create sample bookings for analytics
  const serviceTypes = ['ACCOMMODATION', 'TRANSPORTATION', 'TOUR'];
  const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  const availableLocations = [kigali, musanze, rubavu];
  
  for (let i = 1; i <= 50; i++) {
    const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
    const location = availableLocations[Math.floor(Math.random() * availableLocations.length)];
    
    let serviceData: any = {};
    if (serviceType === 'ACCOMMODATION') {
      const accommodation = await prisma.accommodation.upsert({
        where: { name: `Sample Accommodation ${i}` },
        update: {},
        create: {
          name: `Sample Accommodation ${i}`,
          description: `A sample accommodation for testing analytics`,
          type: 'HOTEL',
          category: 'STANDARD',
          pricePerNight: Math.floor(Math.random() * 50000) + 10000,
          maxGuests: Math.floor(Math.random() * 4) + 1,
          bedrooms: Math.floor(Math.random() * 3) + 1,
          bathrooms: Math.floor(Math.random() * 2) + 1,
          address: `Sample Address ${i}`,
          locationId: location.id,
          amenities: ['WiFi', 'Parking', 'Kitchen'],
          images: [`https://example.com/image${i}.jpg`],
          isAvailable: true,
          isVerified: true,
          isPartner: false,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }
      });
      serviceData.accommodationId = accommodation.id;
    } else if (serviceType === 'TRANSPORTATION') {
      const transportation = await prisma.transportation.upsert({
        where: { name: `Sample Transportation ${i}` },
        update: {},
        create: {
          name: `Sample Transportation ${i}`,
          description: `A sample transportation service for testing analytics`,
          type: 'CITY_TRANSPORT',
          vehicleType: 'STANDARD',
          pricePerTrip: Math.floor(Math.random() * 20000) + 5000,
          capacity: Math.floor(Math.random() * 6) + 1,
          locationId: location.id,
          amenities: ['AC', 'Music'],
          images: [`https://example.com/transport${i}.jpg`],
          isAvailable: true,
          isVerified: true,
          isPartner: false,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }
      });
      serviceData.transportationId = transportation.id;
    } else {
      const tour = await prisma.tour.upsert({
        where: { name: `Sample Tour ${i}` },
        update: {},
        create: {
          name: `Sample Tour ${i}`,
          description: `A sample tour for testing analytics`,
          type: 'CULTURAL_TOUR',
          category: 'STANDARD',
          pricePerPerson: Math.floor(Math.random() * 30000) + 15000,
          duration: Math.floor(Math.random() * 7) + 1,
          maxParticipants: Math.floor(Math.random() * 20) + 5,
          minParticipants: 1,
          locationId: location.id,
          meetingPoint: `Sample Meeting Point ${i}`,
          startTime: '09:00',
          endTime: '17:00',
          images: [`https://example.com/tour${i}.jpg`],
          itinerary: ['Visit location 1', 'Lunch break', 'Visit location 2'],
          includes: ['Guide', 'Transport', 'Lunch'],
          excludes: ['Personal expenses'],
          isAvailable: true,
          isVerified: true,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        }
      });
      serviceData.tourId = tour.id;
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        serviceType: serviceType as any,
        status: status as any,
        startDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + (Math.random() * 30 + 1) * 24 * 60 * 60 * 1000),
        numberOfPeople: Math.floor(Math.random() * 4) + 1,
        totalAmount: Math.floor(Math.random() * 50000) + 10000,
        isConfirmed: status === 'CONFIRMED',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        ...serviceData
      }
    });

    // Create payment for confirmed/completed bookings
    if (['CONFIRMED', 'COMPLETED'].includes(status)) {
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          userId: user.id,
          amount: booking.totalAmount,
          currency: 'RWF',
          method: 'CARD',
          status: 'COMPLETED',
          transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(booking.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  console.log('✅ Sample analytics data added successfully');

  // Add sample help data
  console.log('📚 Adding sample help data...');
  
  // Create help categories
  const generalCategory = await prisma.helpCategory.create({
    data: {
      name: 'General',
      description: 'General help and information',
      icon: 'help-circle',
      order: 1
    }
  });

  const technicalCategory = await prisma.helpCategory.create({
    data: {
      name: 'Technical',
      description: 'Technical support and troubleshooting',
      icon: 'wrench',
      order: 2
    }
  });

  const adminCategory = await prisma.helpCategory.create({
    data: {
      name: 'Admin Guide',
      description: 'Administrative tasks and management',
      icon: 'shield',
      order: 3
    }
  });

  // Create help articles
  await prisma.helpArticle.create({
    data: {
      title: 'Getting Started with Admin Panel',
      content: `# Getting Started with Admin Panel

Welcome to the NDAREHE Admin Panel! This guide will help you get started with managing your platform.

## Key Features

- **Dashboard**: Overview of platform statistics and recent activity
- **Bookings**: Manage accommodation, transportation, and tour bookings
- **Users**: User management and verification
- **Content**: Manage accommodations, transportation services, and tours
- **Reports**: Generate comprehensive reports and analytics
- **Settings**: Configure system settings and integrations

## Quick Actions

1. Use the sidebar navigation to access different sections
2. Check the Dashboard for platform overview
3. Use the "Add New" button to create new content
4. Export data using CSV download buttons

For more detailed information, explore the other help articles in this section.`,
      categoryId: generalCategory.id,
      tags: ['getting-started', 'admin', 'overview'],
      order: 1,
      isPublished: true,
      authorId: admin.id
    }
  });

  await prisma.helpArticle.create({
    data: {
      title: 'Managing Bookings',
      content: `# Managing Bookings

Learn how to effectively manage bookings in the admin panel.

## Booking Statuses

- **PENDING**: New booking awaiting confirmation
- **CONFIRMED**: Booking confirmed and active
- **COMPLETED**: Service has been delivered
- **CANCELLED**: Booking cancelled by user or admin

## Actions Available

1. **View Details**: Click on any booking to see full information
2. **Update Status**: Change booking status as needed
3. **Filter & Search**: Use filters to find specific bookings
4. **Export Data**: Download booking data in CSV format

## Best Practices

- Respond to pending bookings within 24 hours
- Update status promptly when changes occur
- Use filters to organize and manage large numbers of bookings
- Export data regularly for record keeping`,
      categoryId: adminCategory.id,
      tags: ['bookings', 'management', 'status'],
      order: 2,
      isPublished: true,
      authorId: admin.id
    }
  });

  await prisma.helpArticle.create({
    data: {
      title: 'User Management Guide',
      content: `# User Management Guide

Comprehensive guide to managing users on the platform.

## User Roles

- **USER**: Regular platform users
- **ADMIN**: Full administrative access
- **PROVIDER**: Service providers with limited admin access

## User Verification

1. **Email Verification**: Users must verify their email addresses
2. **Account Status**: Monitor active/inactive user accounts
3. **Profile Management**: Help users update their profiles

## Security Features

- Password requirements and validation
- Account lockout for suspicious activity
- Role-based access control
- Activity logging for all user actions

## Support

For user-related issues, check the support tickets section or contact the technical team.`,
      categoryId: adminCategory.id,
      tags: ['users', 'management', 'security', 'verification'],
      order: 3,
      isPublished: true,
      authorId: admin.id
    }
  });

  await prisma.helpArticle.create({
    data: {
      title: 'Troubleshooting Common Issues',
      content: `# Troubleshooting Common Issues

Solutions to frequently encountered problems.

## Connection Issues

**Problem**: Cannot connect to backend
**Solution**: 
1. Check if backend server is running
2. Verify API base URL in settings
3. Check CORS configuration
4. Ensure database is accessible

## Data Not Loading

**Problem**: Pages show no data
**Solution**:
1. Check backend connectivity
2. Verify user authentication
3. Check database connection
4. Review error logs

## Performance Issues

**Problem**: Slow loading times
**Solution**:
1. Check database query performance
2. Monitor server resources
3. Optimize database indexes
4. Check for rate limiting

## Getting Help

If you continue to experience issues:
1. Check the system diagnostics
2. Submit a support ticket
3. Contact technical support
4. Review error logs and diagnostics`,
      categoryId: technicalCategory.id,
      tags: ['troubleshooting', 'issues', 'support', 'technical'],
      order: 4,
      isPublished: true,
      authorId: admin.id
    }
  });

  console.log('✅ Sample help data added successfully');

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