import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../types';

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      const appError = new Error(errorMessage) as AppError;
      appError.statusCode = 400;
      return next(appError);
    }
    
    next();
  };
};

// Validation schemas
export const authSchemas = {
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().optional(),
    dateOfBirth: Joi.date().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  })
};

export const userSchemas = {
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().optional(),
    dateOfBirth: Joi.date().optional(),
    profileImage: Joi.string().optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  })
};

export const adminSchemas = {
  createUser: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('USER', 'ADMIN', 'PROVIDER').required(),
    password: Joi.string().min(6).optional(),
    phone: Joi.string().optional(),
    isVerified: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
  })
};

export const accommodationSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).required(),
    type: Joi.string().valid('HOTEL', 'GUESTHOUSE', 'APARTMENT', 'VILLA', 'HOSTEL', 'CAMPING', 'HOMESTAY').required(),
    category: Joi.string().valid('BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY').required(),
    locationId: Joi.string().required(),
    address: Joi.string().required(),
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    website: Joi.string().uri().optional(),
    pricePerNight: Joi.number().positive().required(),
    currency: Joi.string().default('RWF'),
    maxGuests: Joi.number().integer().positive().required(),
    bedrooms: Joi.number().integer().positive().required(),
    bathrooms: Joi.number().integer().positive().required(),
    amenities: Joi.array().items(Joi.string()).optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    // Partner fields (optional)
    isPartner: Joi.boolean().optional(),
    partnerName: Joi.string().optional(),
    partnerContact: Joi.string().optional(),
    partnerNotes: Joi.string().optional()
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    description: Joi.string().min(10).optional(),
    type: Joi.string().valid('HOTEL', 'GUESTHOUSE', 'APARTMENT', 'VILLA', 'HOSTEL', 'CAMPING', 'HOMESTAY').optional(),
    category: Joi.string().valid('BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY').optional(),
    locationId: Joi.string().optional(),
    address: Joi.string().optional(),
    phone: Joi.string().optional(),
    email: Joi.string().email().optional(),
    website: Joi.string().uri().optional(),
    pricePerNight: Joi.number().positive().optional(),
    currency: Joi.string().optional(),
    maxGuests: Joi.number().integer().positive().optional(),
    bedrooms: Joi.number().integer().positive().optional(),
    bathrooms: Joi.number().integer().positive().optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    isAvailable: Joi.boolean().optional(),
    // Partner fields (optional)
    isPartner: Joi.boolean().optional(),
    partnerName: Joi.string().optional(),
    partnerContact: Joi.string().optional(),
    partnerNotes: Joi.string().optional()
  })
};

export const transportationSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).required(),
    type: Joi.string().valid('AIRPORT_PICKUP', 'CITY_TRANSPORT', 'TOUR_TRANSPORT', 'PRIVATE_TRANSPORT').required(),
    vehicleType: Joi.string().valid('STANDARD', 'VIP', 'VAN', 'BUS', 'MOTORCYCLE').required(),
    locationId: Joi.string().required(),
    capacity: Joi.number().integer().positive().required(),
    pricePerTrip: Joi.number().positive().required(),
    pricePerHour: Joi.number().positive().optional(),
    currency: Joi.string().default('RWF'),
    amenities: Joi.array().items(Joi.string()).optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    // Partner fields (optional)
    isPartner: Joi.boolean().optional(),
    partnerName: Joi.string().optional(),
    partnerContact: Joi.string().optional(),
    partnerNotes: Joi.string().optional()
  })
};

export const tourSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).required(),
    type: Joi.string().valid('CITY_TOUR', 'CULTURAL_TOUR', 'ADVENTURE_TOUR', 'FOOD_TOUR', 'NIGHTLIFE_TOUR', 'EDUCATIONAL_TOUR', 'NATURE_TOUR').required(),
    category: Joi.string().valid('BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY').required(),
    locationId: Joi.string().required(),
    duration: Joi.number().integer().positive().required(),
    maxParticipants: Joi.number().integer().positive().required(),
    minParticipants: Joi.number().integer().positive().default(1),
    pricePerPerson: Joi.number().positive().required(),
    currency: Joi.string().default('RWF'),
    itinerary: Joi.array().items(Joi.string()).optional(),
    includes: Joi.array().items(Joi.string()).optional(),
    excludes: Joi.array().items(Joi.string()).optional(),
    meetingPoint: Joi.string().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    images: Joi.array().items(Joi.string().uri()).optional()
  })
};

export const bookingSchemas = {
  create: Joi.object({
    serviceType: Joi.string().valid('ACCOMMODATION', 'TRANSPORTATION', 'TOUR').required(),
    serviceId: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().when('serviceType', {
      is: 'ACCOMMODATION',
      then: Joi.date().required().greater(Joi.ref('startDate')),
      otherwise: Joi.date().optional()
    }),
    numberOfPeople: Joi.number().integer().min(1).required(),
    specialRequests: Joi.string().allow('').optional().default('')  // Make optional and allow empty string
  })
};

export const reviewSchemas = {
  create: Joi.object({
    serviceType: Joi.string().valid('ACCOMMODATION', 'TOUR').required(),
    serviceId: Joi.string().required(),
    bookingId: Joi.string().optional(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().min(10).optional()
  })
};

export const tripPlanSchemas = {
  create: Joi.object({
    arrivalDate: Joi.date().required(),
    departureDate: Joi.date().required(),
    numberOfPeople: Joi.number().integer().positive().required(),
    budget: Joi.number().positive().required(),
    tripType: Joi.string().valid('BUSINESS', 'FAMILY', 'ROMANTIC', 'ADVENTURE', 'CULTURAL', 'RELAXATION').required(),
    interests: Joi.array().items(Joi.string()).required(),
    specialRequests: Joi.string().optional()
  })
}; 