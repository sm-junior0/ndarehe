import { Request } from 'express';
import { User, UserRole } from '@prisma/client';

// Extended Request interface with user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
  };
}

// JWT Payload interface
export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Email template data interfaces
export interface EmailTemplateData {
  [key: string]: any;
}

export interface BookingEmailData {
  id: string;
  serviceName: string;
  startDate: Date;
  totalAmount: number;
  currency: string;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Query parameters interfaces
export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface AccommodationQuery extends PaginationQuery {
  type?: string;
  category?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  guests?: string;
  checkIn?: string;
  checkOut?: string;
  search?: string;
  roomTypes?: string;
}

export interface TourQuery extends PaginationQuery {
  type?: string;
  category?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  duration?: string;
  search?: string;
}

export interface TransportationQuery extends PaginationQuery {
  type?: string;
  vehicleType?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  capacity?: string;
}

// Booking interfaces
export interface CreateBookingData {
  serviceType: 'ACCOMMODATION' | 'TRANSPORTATION' | 'TOUR';
  serviceId: string;
  startDate: string;
  endDate?: string;
  numberOfPeople: number;
  specialRequests?: string;
}

// Review interfaces
export interface CreateReviewData {
  serviceType: 'ACCOMMODATION' | 'TOUR';
  serviceId: string;
  bookingId?: string;
  rating: number;
  comment?: string;
}

// Trip Plan interfaces
export interface CreateTripPlanData {
  arrivalDate: string;
  departureDate: string;
  numberOfPeople: number;
  budget: number;
  tripType: 'BUSINESS' | 'FAMILY' | 'ROMANTIC' | 'ADVENTURE' | 'CULTURAL' | 'RELAXATION';
  interests: string[];
  specialRequests?: string;
}

// Payment interfaces
export interface CreatePaymentData {
  bookingId: string;
  amount: number;
  method: 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH' | 'PAYPAL';
}

// SMS interfaces
export interface SMSData {
  id: string;
  serviceName: string;
  startDate: Date;
  totalAmount: number;
  currency: string;
}

// Admin interfaces
export interface UpdateUserStatusData {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  role?: UserRole;
}

export interface UpdateBookingStatusData {
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
}

// Error interfaces
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// File upload interfaces
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Notification interfaces
export interface CreateNotificationData {
  userId: string;
  type: 'BOOKING_CONFIRMATION' | 'PAYMENT_SUCCESS' | 'TRIP_PLAN_READY' | 'SYSTEM_UPDATE';
  title: string;
  message: string;
  data?: any;
} 