import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NDAREHE API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for NDAREHE - Accommodation and Local Experience Booking Platform',
      contact: {
        name: 'NDAREHE Team',
        email: 'info@ndarehe.com',
        url: 'https://ndarehe.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.ndarehe.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'PROVIDER'] },
            isVerified: { type: 'boolean' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Accommodation: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['HOTEL', 'GUESTHOUSE', 'APARTMENT', 'VILLA', 'HOSTEL', 'CAMPING', 'HOMESTAY'] },
            category: { type: 'string', enum: ['BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY'] },
            pricePerNight: { type: 'number' },
            currency: { type: 'string', default: 'RWF' },
            maxGuests: { type: 'integer' },
            bedrooms: { type: 'integer' },
            bathrooms: { type: 'integer' },
            amenities: { type: 'array', items: { type: 'string' } },
            images: { type: 'array', items: { type: 'string' } },
            rating: { type: 'number' },
            totalReviews: { type: 'integer' }
          }
        },
        Tour: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['CITY_TOUR', 'CULTURAL_TOUR', 'ADVENTURE_TOUR', 'FOOD_TOUR', 'NIGHTLIFE_TOUR', 'EDUCATIONAL_TOUR', 'NATURE_TOUR'] },
            category: { type: 'string', enum: ['BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY'] },
            duration: { type: 'integer', description: 'Duration in hours' },
            pricePerPerson: { type: 'number' },
            currency: { type: 'string', default: 'RWF' },
            maxParticipants: { type: 'integer' },
            minParticipants: { type: 'integer' },
            meetingPoint: { type: 'string' },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            rating: { type: 'number' },
            totalReviews: { type: 'integer' }
          }
        },
        Transportation: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            type: { type: 'string', enum: ['AIRPORT_PICKUP', 'CITY_TRANSPORT', 'TOUR_TRANSPORT', 'PRIVATE_TRANSPORT'] },
            vehicleType: { type: 'string', enum: ['STANDARD', 'VIP', 'VAN', 'BUS', 'MOTORCYCLE'] },
            capacity: { type: 'integer' },
            pricePerTrip: { type: 'number' },
            pricePerHour: { type: 'number' },
            currency: { type: 'string', default: 'RWF' }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            serviceType: { type: 'string', enum: ['ACCOMMODATION', 'TRANSPORTATION', 'TOUR'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            numberOfPeople: { type: 'integer' },
            totalAmount: { type: 'number' },
            currency: { type: 'string', default: 'RWF' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REFUNDED'] },
            specialRequests: { type: 'string' }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string', default: 'RWF' },
            method: { type: 'string', enum: ['CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'PAYPAL'] },
            status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'] },
            transactionId: { type: 'string' }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string' },
            serviceType: { type: 'string', enum: ['ACCOMMODATION', 'TRANSPORTATION', 'TOUR'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        TripPlan: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            arrivalDate: { type: 'string', format: 'date-time' },
            departureDate: { type: 'string', format: 'date-time' },
            budget: { type: 'number' },
            tripType: { type: 'string', enum: ['BUSINESS', 'FAMILY', 'ROMANTIC', 'ADVENTURE', 'CULTURAL', 'RELAXATION'] },
            numberOfPeople: { type: 'integer' },
            specialRequests: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'] }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/server.ts']
};

export const specs = swaggerJsdoc(options); 